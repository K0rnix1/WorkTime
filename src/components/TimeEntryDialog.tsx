import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  Grid, Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Locale } from 'date-fns';
import { TimeEntry, AppLanguage } from '../App';

interface TimeEntryDialogTranslations {
  edit: string;
  new: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: string;
  project: string;
  notes: string;
  workingTime: string;
  cancel: string;
  save: string;
  required: string;
}

interface TimeEntryDialogProps {
  open: boolean;
  entry: TimeEntry | null;
  onClose: () => void;
  onSave: (entry: TimeEntry) => void;
  language: AppLanguage;
  translations: TimeEntryDialogTranslations;
  dateLocale: Locale;
}

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({ 
  open, 
  entry, 
  onClose, 
  onSave,
  language,
  translations: t,
  dateLocale
}) => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(new Date());
  const [breakDuration, setBreakDuration] = useState<number>(0);
  const [project, setProject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (entry) {
      // Bearbeiten eines bestehenden Eintrags
      setDate(entry.date);
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setBreakDuration(entry.breakDuration);
      setProject(entry.project);
      setNotes(entry.notes);
    } else {
      // Neuen Eintrag erstellen
      const now = new Date();
      setDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      setStartTime(now);
      setEndTime(now);
      setBreakDuration(0);
      setProject('');
      setNotes('');
    }
    
    // Fehler zurücksetzen
    setErrors({});
  }, [entry, open]);

  const handleSave = () => {
    // Validierung
    const newErrors: {[key: string]: string} = {};
    
    if (!date) {
      newErrors.date = `${t.date} ${t.required}`;
    }
    
    if (!startTime) {
      newErrors.startTime = `${t.startTime} ${t.required}`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Wenn startTime und endTime nur die Uhrzeit enthalten, kombiniere sie mit dem Datum
    const combinedDate = date!;
    
    const combinedStartTime = new Date(
      combinedDate.getFullYear(),
      combinedDate.getMonth(),
      combinedDate.getDate(),
      startTime!.getHours(),
      startTime!.getMinutes()
    );
    
    let combinedEndTime = null;
    if (endTime) {
      combinedEndTime = new Date(
        combinedDate.getFullYear(),
        combinedDate.getMonth(),
        combinedDate.getDate(),
        endTime.getHours(),
        endTime.getMinutes()
      );
      
      // Wenn Endzeit vor Startzeit liegt, nehmen wir an, dass die Endzeit am nächsten Tag ist
      if (combinedEndTime < combinedStartTime) {
        combinedEndTime.setDate(combinedEndTime.getDate() + 1);
      }
    }
    
    // Erstelle den Eintrag
    const savedEntry: TimeEntry = {
      id: entry ? entry.id : Date.now().toString(),
      date: combinedDate,
      startTime: combinedStartTime,
      endTime: combinedEndTime,
      breakDuration: breakDuration || 0,
      project: project || '',
      notes: notes || ''
    };
    
    onSave(savedEntry);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {entry ? t.edit : t.new}
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Datum */}
            <Grid item xs={12}>
              <DatePicker
                label={t.date}
                value={date}
                onChange={(newDate) => setDate(newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.date,
                    helperText: errors.date
                  }
                }}
              />
            </Grid>
            
            {/* Startzeit */}
            <Grid item xs={6}>
              <TimePicker
                label={t.startTime}
                value={startTime}
                onChange={(newTime) => setStartTime(newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startTime,
                    helperText: errors.startTime
                  }
                }}
              />
            </Grid>
            
            {/* Endzeit */}
            <Grid item xs={6}>
              <TimePicker
                label={t.endTime}
                value={endTime}
                onChange={(newTime) => setEndTime(newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            
            {/* Pausendauer */}
            <Grid item xs={12}>
              <TextField
                label={t.breakDuration}
                type="number"
                fullWidth
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            {/* Projekt */}
            <Grid item xs={12}>
              <TextField
                label={t.project}
                fullWidth
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
            </Grid>
            
            {/* Notizen */}
            <Grid item xs={12}>
              <TextField
                label={t.notes}
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
            
            {/* Infos */}
            {startTime && endTime && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t.workingTime} {
                    (() => {
                      const start = new Date(startTime);
                      const end = new Date(endTime);
                      const diffMs = end.getTime() - start.getTime();
                      const diffMins = diffMs / 60000;
                      const workMins = diffMins - breakDuration;
                      
                      if (workMins <= 0) return '0m';
                      
                      const hours = Math.floor(workMins / 60);
                      const mins = Math.round(workMins % 60);
                      
                      return `${hours}h ${mins}m`;
                    })()
                  }
                </Typography>
              </Grid>
            )}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeEntryDialog; 
import React from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, IconButton, Divider, 
  ListItemSecondaryAction, Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TimeEntry } from '../App';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeListProps {
  timeEntries: TimeEntry[];
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const TimeList: React.FC<TimeListProps> = ({ timeEntries, onEditEntry, onDeleteEntry }) => {
  if (timeEntries.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          Keine Einträge vorhanden
        </Typography>
      </Box>
    );
  }

  // Sortiere Zeiteinträge nach Datum, neueste zuerst
  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Berechne die Gesamtarbeitszeit
  const totalWorkHours = timeEntries.reduce((total, entry) => {
    if (entry.endTime) {
      const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
      const diffMins = diffMs / 60000;
      const workMins = diffMins - entry.breakDuration;
      return total + workMins / 60;
    }
    return total;
  }, 0);

  // Gruppiere nach Datum
  const entriesByDate: { [key: string]: TimeEntry[] } = {};
  sortedEntries.forEach(entry => {
    const dateStr = format(entry.date, 'yyyy-MM-dd');
    if (!entriesByDate[dateStr]) {
      entriesByDate[dateStr] = [];
    }
    entriesByDate[dateStr].push(entry);
  });

  return (
    <Box sx={{ width: '100%', overflow: 'auto', flex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Einträge
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="primary">
        Gesamtarbeitszeit: {totalWorkHours.toFixed(2)} Stunden
      </Typography>
      
      {Object.entries(entriesByDate).map(([dateStr, entries]) => (
        <Paper key={dateStr} sx={{ mb: 2, overflow: 'hidden' }}>
          <Typography 
            variant="subtitle1" 
            sx={{ p: 1, bgcolor: 'primary.dark', color: 'white' }}
          >
            {format(new Date(dateStr), 'eeee, dd. MMMM yyyy', { locale: de })}
          </Typography>
          
          <List dense>
            {entries.map((entry, index) => {
              // Berechne Arbeitszeit
              let workHours = 0;
              let workTimeStr = '-';
              
              if (entry.endTime) {
                const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
                const diffMins = diffMs / 60000;
                const workMins = diffMins - entry.breakDuration;
                workHours = workMins / 60;
                
                const hours = Math.floor(workHours);
                const mins = Math.round((workHours - hours) * 60);
                workTimeStr = `${hours}h ${mins}min`;
              }
              
              return (
                <React.Fragment key={entry.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <>
                          <Typography component="span" fontWeight="bold">
                            {format(entry.startTime, 'HH:mm')} - {entry.endTime ? format(entry.endTime, 'HH:mm') : 'läuft'}
                          </Typography>
                          {entry.project && 
                            <Typography component="span" color="primary.light" sx={{ ml: 1 }}>
                              ({entry.project})
                            </Typography>
                          }
                        </>
                      }
                      secondary={
                        <>
                          {entry.breakDuration > 0 && `Pause: ${entry.breakDuration} Min. | `}
                          Arbeitszeit: {workTimeStr}
                          {entry.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {entry.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit" onClick={() => onEditEntry(entry)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => onDeleteEntry(entry.id)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      ))}
    </Box>
  );
};

export default TimeList; 
import React, { useState, useEffect } from 'react';
import { 
  Container, AppBar, Toolbar, Typography, Button, IconButton, 
  Box, Menu, MenuItem, Dialog, DialogTitle, DialogContent, 
  DialogActions, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoIcon from '@mui/icons-material/Info';
import TranslateIcon from '@mui/icons-material/Translate';
import TimeList from './components/TimeList';
import TimeEntryDialog from './components/TimeEntryDialog';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

// Definiere die autoTable Methode für TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Zeiteintragstyp
export interface TimeEntry {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date | null;
  breakDuration: number;
  project: string;
  notes: string;
}

// Aktueller Arbeitszeitstatus
interface CurrentSession {
  startTime: Date | null;
  breakStart: Date | null;
  totalBreakTime: number;
}

// Typ für die unterstützten Sprachen
export type AppLanguage = 'de' | 'en';

// Übersetzungen
const translations = {
  de: {
    appName: 'WorkTime',
    dateFormat: 'eeee, dd. MMMM yyyy',
    clock: {
      pausedSince: '⏸️ Pausiert seit',
      workingTime: '⏱️ Arbeitszeit:',
      start: 'Beginn:',
      pause: 'Min. Pause',
    },
    buttons: {
      startWork: 'Arbeitsbeginn',
      startBreak: 'Pause starten',
      endBreak: 'Pause beenden',
      endWork: 'Arbeitsende',
    },
    menu: {
      csvExport: 'CSV Export',
      pdfExport: 'PDF Export',
      about: 'Über diese App',
      support: 'Unterstützen',
      language: 'Sprache',
    },
    list: {
      entries: 'Einträge',
      totalTime: 'Gesamtarbeitszeit:',
      hours: 'Stunden',
      noEntries: 'Keine Einträge vorhanden',
      running: 'läuft',
      pause: 'Pause:',
      workingTime: 'Arbeitszeit:',
    },
    dialog: {
      edit: 'Eintrag bearbeiten',
      new: 'Neuer Eintrag',
      date: 'Datum',
      startTime: 'Startzeit',
      endTime: 'Endzeit',
      breakDuration: 'Pausendauer (Minuten)',
      project: 'Projekt',
      notes: 'Notizen',
      workingTime: 'Arbeitszeit (ohne Pausen):',
      cancel: 'Abbrechen',
      save: 'Speichern',
      required: 'ist erforderlich',
    },
    export: {
      title: 'Arbeitszeitnachweis',
      exportDate: 'Export vom:',
      date: 'Datum',
      start: 'Start',
      end: 'Ende',
      pause: 'Pause (Min)',
      project: 'Projekt',
      notes: 'Notizen',
      workingTime: 'Arbeitszeit',
      totalTime: 'Gesamtzeit:',
      fileName: 'Arbeitszeiten',
      pdfFileName: 'Arbeitszeitnachweis',
    },
    about: {
      title: 'Über WorkTime',
      description1: 'Das ist eine App die ich gemacht habe um meine Arbeitszeit festzuhalten, ohne dass man jedesmal extra wo mitschreiben muss. Ich bin mir sicher, dass es schon so eine App gibt, aber wie es meistens so ist ist bei anderen Apps etwas zu zahlen oder man bekommt ständig popups die nervig sind.',
      description2: 'Ich möchte hiermit jedem Menschen die Möglichkeit geben seine Arbeitszeit festzuhalten daher ich der Meinung bin, dass es eine essenzielle Notwendigkeit ist seine Arbeitszeit in Hinsicht auf Betrug durch den Arbeitgeber selbst festzuhalten. Vor allem in kleinen Betrieben wo Korruption nicht gerade so unwirklich ist.',
      version: 'Version 1.0.0',
      close: 'Schließen',
    },
  },
  en: {
    appName: 'WorkTime',
    dateFormat: 'eeee, MMMM dd, yyyy',
    clock: {
      pausedSince: '⏸️ Paused since',
      workingTime: '⏱️ Working time:',
      start: 'Start:',
      pause: 'min. break',
    },
    buttons: {
      startWork: 'Start Work',
      startBreak: 'Start Break',
      endBreak: 'End Break',
      endWork: 'End Work',
    },
    menu: {
      csvExport: 'CSV Export',
      pdfExport: 'PDF Export',
      about: 'About this App',
      support: 'Support',
      language: 'Language',
    },
    list: {
      entries: 'Entries',
      totalTime: 'Total working time:',
      hours: 'hours',
      noEntries: 'No entries available',
      running: 'running',
      pause: 'Break:',
      workingTime: 'Working time:',
    },
    dialog: {
      edit: 'Edit Entry',
      new: 'New Entry',
      date: 'Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      breakDuration: 'Break Duration (minutes)',
      project: 'Project',
      notes: 'Notes',
      workingTime: 'Working time (excluding breaks):',
      cancel: 'Cancel',
      save: 'Save',
      required: 'is required',
    },
    export: {
      title: 'Working Time Report',
      exportDate: 'Export date:',
      date: 'Date',
      start: 'Start',
      end: 'End',
      pause: 'Break (Min)',
      project: 'Project',
      notes: 'Notes',
      workingTime: 'Working Time',
      totalTime: 'Total Time:',
      fileName: 'WorkingTimes',
      pdfFileName: 'WorkingTimeReport',
    },
    about: {
      title: 'About WorkTime',
      description1: 'This is an app I created to track my working hours, without having to manually record them elsewhere. I\'m sure similar apps exist, but as is often the case, other apps require payment or display annoying popups.',
      description2: 'With this app, I want to give everyone the opportunity to track their working hours, as I believe it is essential to keep your own records to protect yourself from potential employer fraud. This is especially important in small businesses where corruption is not uncommon.',
      version: 'Version 1.0.0',
      close: 'Close',
    },
  }
};

// Dark Mode Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  // Lade gespeicherte Daten aus dem LocalStorage beim Start
  const loadFromLocalStorage = (key: string, defaultValue: any) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      try {
        const parsed = JSON.parse(savedValue);
        
        // Spezieller Fall für timeEntries: Konvertiere String-Daten zu Date-Objekten
        if (key === 'timeEntries' && Array.isArray(parsed)) {
          return parsed.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : null
          }));
        }
        
        // Spezieller Fall für currentSession: Konvertiere String-Daten zu Date-Objekten
        if (key === 'currentSession') {
          return {
            ...parsed,
            startTime: parsed.startTime ? new Date(parsed.startTime) : null,
            breakStart: parsed.breakStart ? new Date(parsed.breakStart) : null,
          };
        }
        
        return parsed;
      } catch (e) {
        console.error(`Fehler beim Parsen von ${key}:`, e);
        return defaultValue;
      }
    }
    return defaultValue;
  };
  
  // State Variablen
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isWorking, setIsWorking] = useState<boolean>(
    loadFromLocalStorage('isWorking', false)
  );
  const [currentSession, setCurrentSession] = useState<CurrentSession>(
    loadFromLocalStorage('currentSession', {
      startTime: null,
      breakStart: null,
      totalBreakTime: 0
    })
  );
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(
    loadFromLocalStorage('timeEntries', [])
  );
  
  // Sprache
  const [language, setLanguage] = useState<AppLanguage>(
    loadFromLocalStorage('language', 'de')
  );
  
  // Aktuelle Übersetzungen
  const t = translations[language];
  
  // State für Menüs und Dialoge
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [languageMenuAnchorEl, setLanguageMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentEditEntry, setCurrentEditEntry] = useState<TimeEntry | null>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState<boolean>(false);

  // Speichere Daten im LocalStorage nach jeder Änderung
  const saveToLocalStorage = () => {
    localStorage.setItem('isWorking', JSON.stringify(isWorking));
    localStorage.setItem('currentSession', JSON.stringify(currentSession));
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    localStorage.setItem('language', language);
  };

  // Aktualisiere die Zeit jede Sekunde
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Speichern der Daten nach Änderungen
  useEffect(() => {
    saveToLocalStorage();
  }, [isWorking, currentSession, timeEntries, language]);

  // Sprache ändern
  const handleLanguageChange = (newLanguage: AppLanguage) => {
    setLanguage(newLanguage);
    setLanguageMenuAnchorEl(null);
    handleMenuClose();
  };

  // Menü öffnen/schließen
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchorEl(event.currentTarget);
    // handleMenuClose();
  };
  
  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchorEl(null);
  };

  // Arbeitszeitfunktionen
  const handleStartWork = () => {
    const now = new Date();
    setIsWorking(true);
    setCurrentSession({
      startTime: now,
      breakStart: null,
      totalBreakTime: 0
    });
    saveToLocalStorage();
  };

  const handleStopWork = () => {
    if (currentSession.startTime) {
      const now = new Date();
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        startTime: currentSession.startTime,
        endTime: now,
        breakDuration: currentSession.totalBreakTime,
        project: "",
        notes: ""
      };
      setTimeEntries([...timeEntries, newEntry]);
      setIsWorking(false);
      setCurrentSession({
        startTime: null,
        breakStart: null,
        totalBreakTime: 0
      });
      saveToLocalStorage();
    }
  };

  const handleBreak = () => {
    const now = new Date();
    if (currentSession.breakStart) {
      // Pause beenden
      const breakTime = Math.floor((now.getTime() - currentSession.breakStart.getTime()) / 60000);
      setCurrentSession({
        ...currentSession,
        breakStart: null,
        totalBreakTime: currentSession.totalBreakTime + breakTime
      });
    } else {
      // Pause starten
      setCurrentSession({
        ...currentSession,
        breakStart: now
      });
    }
    saveToLocalStorage();
  };

  // Eintrag bearbeiten
  const handleEditEntry = (entry: TimeEntry) => {
    setCurrentEditEntry(entry);
    setEditDialogOpen(true);
  };

  // Eintrag löschen
  const handleDeleteEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    saveToLocalStorage();
  };

  // Eintrag speichern
  const handleSaveEntry = (editedEntry: TimeEntry) => {
    if (currentEditEntry) {
      setTimeEntries(timeEntries.map(entry => 
        entry.id === editedEntry.id ? editedEntry : entry
      ));
    } else {
      setTimeEntries([...timeEntries, { ...editedEntry, id: Date.now().toString() }]);
    }
    setEditDialogOpen(false);
    setCurrentEditEntry(null);
    saveToLocalStorage();
  };

  // Export als CSV
  const handleExportCSV = () => {
    if (timeEntries.length === 0) return;

    const headers = `${t.export.date},${t.export.start},${t.export.end},${t.export.pause},${t.export.project},${t.export.notes},${t.export.workingTime}\n`;
    const csvContent = timeEntries.reduce((acc, entry) => {
      const startTime = format(entry.startTime, 'HH:mm');
      const endTime = entry.endTime ? format(entry.endTime, 'HH:mm') : '';
      const date = format(entry.date, 'dd.MM.yyyy');
      
      // Berechne Arbeitszeit in Stunden
      let workHours = 0;
      if (entry.endTime) {
        const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
        const diffMins = diffMs / 60000;
        const workMins = diffMins - entry.breakDuration;
        workHours = parseFloat((workMins / 60).toFixed(2));
      }
      
      return acc + `${date},${startTime},${endTime},${entry.breakDuration},"${entry.project}","${entry.notes}",${workHours}\n`;
    }, headers);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${t.export.fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export als PDF
  const handleExportPDF = () => {
    if (timeEntries.length === 0) return;

    const doc = new jsPDF();
    
    // Titel
    doc.setFontSize(18);
    doc.text(t.export.title, 14, 20);
    
    // Datum
    doc.setFontSize(10);
    doc.text(`${t.export.exportDate} ${format(new Date(), 'dd.MM.yyyy')}`, 14, 30);
    
    // Gesamtarbeitszeit berechnen
    const totalWorkHours = timeEntries.reduce((total, entry) => {
      if (entry.endTime) {
        const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
        const diffMins = diffMs / 60000;
        const workMins = diffMins - entry.breakDuration;
        return total + workMins / 60;
      }
      return total;
    }, 0);
    
    // Tabelle erstellen
    const tableData = timeEntries.map(entry => {
      const startTime = format(entry.startTime, 'HH:mm');
      const endTime = entry.endTime ? format(entry.endTime, 'HH:mm') : '';
      const date = format(entry.date, 'dd.MM.yyyy');
      
      // Berechne Arbeitszeit in Stunden
      let workHours = 0;
      if (entry.endTime) {
        const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
        const diffMins = diffMs / 60000;
        const workMins = diffMins - entry.breakDuration;
        workHours = parseFloat((workMins / 60).toFixed(2));
      }
      
      return [date, startTime, endTime, entry.breakDuration, entry.project, entry.notes, `${workHours.toFixed(2)} h`];
    });
    
    // Füge die Tabelle zum PDF hinzu
    autoTable(doc, {
      head: [[t.export.date, t.export.start, t.export.end, t.export.pause, t.export.project, t.export.notes, t.export.workingTime]],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66]
      },
      footStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0]
      },
      foot: [['', '', '', '', '', t.export.totalTime, `${totalWorkHours.toFixed(2)} h`]]
    });
    
    // PDF speichern
    doc.save(`${t.export.pdfFileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Berechne Arbeitszeit für die aktuelle Session
  const calculateCurrentSessionTime = () => {
    if (!isWorking || !currentSession.startTime) return '00:00:00';
    
    const now = new Date();
    let diffMs = now.getTime() - currentSession.startTime.getTime();
    
    // Ziehe Pausen ab
    diffMs -= currentSession.totalBreakTime * 60000;
    
    // Ziehe laufende Pause ab, falls vorhanden
    if (currentSession.breakStart) {
      diffMs -= (now.getTime() - currentSession.breakStart.getTime());
    }
    
    // Verhindere negative Werte
    diffMs = Math.max(0, diffMs);
    
    // Formatiere als HH:MM:SS
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
  };

  // "Über diese App" Dialog
  const handleAboutOpen = () => {
    setAboutDialogOpen(true);
    handleMenuClose();
  };

  const handleAboutClose = () => {
    setAboutDialogOpen(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* AppBar */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t.appName}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Menu */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleExportCSV(); handleMenuClose(); }}>
                <DownloadIcon sx={{ mr: 1 }} />
                {t.menu.csvExport}
              </MenuItem>
              <MenuItem onClick={() => { handleExportPDF(); handleMenuClose(); }}>
                <DownloadIcon sx={{ mr: 1 }} />
                {t.menu.pdfExport}
              </MenuItem>
              <MenuItem onClick={handleLanguageMenuOpen}>
                <TranslateIcon sx={{ mr: 1 }} />
                {t.menu.language}
              </MenuItem>
              <MenuItem onClick={handleAboutOpen}>
                <InfoIcon sx={{ mr: 1 }} />
                {t.menu.about}
              </MenuItem>
              <MenuItem onClick={() => { window.open('https://paypal.me/K0rnix1', '_blank'); handleMenuClose(); }}>
                <PaymentIcon sx={{ mr: 1 }} />
                {t.menu.support}
              </MenuItem>
            </Menu>
            
            {/* Language Menu */}
            <Menu
              anchorEl={languageMenuAnchorEl}
              open={Boolean(languageMenuAnchorEl)}
              onClose={handleLanguageMenuClose}
            >
              <MenuItem 
                onClick={() => handleLanguageChange('de')}
                selected={language === 'de'}
              >
                🇩🇪 Deutsch
              </MenuItem>
              <MenuItem 
                onClick={() => handleLanguageChange('en')}
                selected={language === 'en'}
              >
                🇬🇧 English
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Main Content */}
        <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          {/* Clock */}
          <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', fontFamily: 'monospace', mb: 1 }}>
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 3 }}>
            {format(currentTime, t.dateFormat, { locale: language === 'de' ? de : enUS })}
          </Typography>
          
          {/* Working Status */}
          {isWorking && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" align="center">
                {currentSession.breakStart 
                  ? `${t.clock.pausedSince} ${format(currentSession.breakStart, 'HH:mm:ss')}`
                  : `${t.clock.workingTime} ${calculateCurrentSessionTime()}`}
              </Typography>
              
              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                {t.clock.start} {currentSession.startTime ? format(currentSession.startTime, 'HH:mm:ss') : ''} 
                {currentSession.totalBreakTime > 0 ? ` (${currentSession.totalBreakTime} ${t.clock.pause})` : ''}
              </Typography>
            </Box>
          )}
          
          {/* Control Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {!isWorking ? (
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleStartWork}
                sx={{ minWidth: 200, py: 1.5 }}
              >
                {t.buttons.startWork}
              </Button>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color={currentSession.breakStart ? "primary" : "secondary"}
                  onClick={handleBreak}
                  sx={{ minWidth: 150 }}
                >
                  {currentSession.breakStart ? t.buttons.endBreak : t.buttons.startBreak}
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={handleStopWork}
                  sx={{ minWidth: 150 }}
                >
                  {t.buttons.endWork}
                </Button>
              </>
            )}
          </Box>
          
          {/* Time Entries List */}
          <TimeList 
            timeEntries={timeEntries} 
            onEditEntry={handleEditEntry} 
            onDeleteEntry={handleDeleteEntry}
            language={language}
            translations={translations[language].list}
            dateLocale={language === 'de' ? de : enUS}
          />
        </Box>
        
        {/* Edit Dialog */}
        <TimeEntryDialog 
          open={editDialogOpen}
          entry={currentEditEntry}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEntry}
          language={language}
          translations={translations[language].dialog}
          dateLocale={language === 'de' ? de : enUS}
        />
        
        {/* About Dialog */}
        <Dialog open={aboutDialogOpen} onClose={handleAboutClose}>
          <DialogTitle>{t.about.title}</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              {t.about.description1}
            </Typography>
            <Typography paragraph>
              {t.about.description2}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.about.version} | © 2025
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAboutClose}>{t.about.close}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App; 
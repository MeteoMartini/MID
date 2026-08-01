import {readFileSync} from 'node:fs';
const backup=readFileSync(new URL('../src/iCloudBackup.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/ICloudBackupSettings.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ["const BACKUP_SCHEMA='mid-icloud-drive-backup'",'exportForecastVerificationArchive','importForecastVerificationArchive','crypto.subtle.digest','shareNavigator.share','Dateien','SENSITIVE_PREFIXES','TRANSIENT_PREFIXES'])if(!backup.includes(token))failures.push(`Backup-Engine fehlt: ${token}`);
for(const token of ['iCloud-Drive-Sicherung','In iCloud Drive sichern','Sicherung wiederherstellen','.midbackup','Zugangsschlüssel'])if(!ui.includes(token))failures.push(`Backup-UI fehlt: ${token}`);
if(!app.includes('<ICloudBackupSettings advancedMode={layoutMode===\'advanced\'}/>'))failures.push('iCloud-Sicherung ist nicht in den Einstellungen eingebunden.');
if(failures.length){console.error('iCloud-Backup-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('iCloud-Drive-Sicherung für lokale Daten und Wetterzwillingarchiv geprüft.');

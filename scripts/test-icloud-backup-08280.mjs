import {readFileSync} from 'node:fs';
const backup=readFileSync(new URL('../src/iCloudBackup.ts',import.meta.url),'utf8');
const filePlatform=readFileSync(new URL('../src/filePlatform.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/ICloudBackupSettings.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const policy=readFileSync(new URL('../src/portableUserData.ts',import.meta.url),'utf8');
const failures=[];
for(const token of ["const BACKUP_SCHEMA='mid-icloud-drive-backup'","const BACKUP_VERSION=3",'exportForecastVerificationArchive','importForecastVerificationArchive','crypto.subtle.digest','shareOrExportMidFile','collectPortableUserData','replacePortableUserData'])if(!backup.includes(token))failures.push(`Backup-Engine fehlt: ${token}`);
for(const token of ['Share.share(','shareNavigator.share','URL.createObjectURL(file)'])if(!filePlatform.includes(token))failures.push(`Datei-Plattformadapter fehlt: ${token}`);
for(const token of ['Manuelle iCloud-Sicherheitskopie','Sicherheitskopie erstellen','Sicherheitskopie einspielen','.midbackup','Eine Sicherungsdatei ist kein laufender Geräteabgleich'])if(!ui.includes(token))failures.push(`Backup-UI fehlt: ${token}`);
for(const token of ['PORTABLE_USER_DATA_INCLUDED','PORTABLE_USER_DATA_EXCLUDED','isPortableUserDataKey','Stationspasswörter'])if(!policy.includes(token))failures.push(`Portable-Datenrichtlinie fehlt: ${token}`);
if(!app.includes('<ICloudBackupSettings advancedMode={layoutMode===\'advanced\'}/>'))failures.push('iCloud-Sicherheitskopie ist nicht in den Einstellungen eingebunden.');
if(failures.length){console.error('iCloud-Backup-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Manuelle iCloud-Sicherheitskopie und gemeinsame portable Datenrichtlinie geprüft.');

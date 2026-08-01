import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
const guard=readFileSync(new URL('../src/StartupGuard.tsx',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const persistence=readFileSync(new URL('../src/persistence.ts',import.meta.url),'utf8');
const failures=[];
for(const token of ['timeout(restorePersistentState(),4500)','timeout(restoreDeviceSyncState(),6500)','<StartupGuard><App/></StartupGuard>','void start().catch(nativeFailure)','mid:runtime:boot-marker:v1'])if(!main.includes(token))failures.push(`Startschutz fehlt: ${token}`);
for(const token of ['class StartupGuard','App-Cache reparieren','Abgesichert neu starten','Daten sichern','saveICloudBackup'])if(!guard.includes(token))failures.push(`Recovery-UI fehlt: ${token}`);
for(const token of ['mid-boot-shell','mid-boot-recovery','App-Cache reparieren','Persönliche Daten werden dabei nicht gelöscht'])if(!html.includes(token))failures.push(`HTML-Startschutz fehlt: ${token}`);
for(const token of ['mid-state-backup-v1','mid-persistent-state','restorePersistentState','persistStateNow'])if(!persistence.includes(token))failures.push(`Lokale Datenrettung fehlt: ${token}`);
if(failures.length){console.error('Start-/Datenrettungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Startschutz, Cache-Reparatur und lokale Datenrettung geprüft.');

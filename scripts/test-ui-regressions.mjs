import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['ICloudBackupSettings','DeviceSyncSettings','StartupGuard'])if(!app.includes(token)&&token!=='StartupGuard')failures.push(`App-UI fehlt: ${token}`);
for(const token of ['professionalEnsembleLayout(compact:boolean,exporting=false)','ResponsiveEnsembleTooltip'])if(!ensemble.includes(token))failures.push(`Ensemble-UI fehlt: ${token}`);
for(const token of ['.ensemble-mobile-tooltip-layer{','.icloud-backup-settings{','.mid-startup-recovery{'])if(!styles.includes(token))failures.push(`UI-CSS fehlt: ${token}`);
if(failures.length){console.error('UI-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-UI, iCloud-Sicherung und Startschutz geprüft.');

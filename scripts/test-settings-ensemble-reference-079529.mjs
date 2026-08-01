import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['TemperatureLegend','RainLegend','WindLegend','ModeExplanation','ResponsiveEnsembleTooltip','P10–P90','P25–P75','ENS-Mittel','Klimamittel'])if(!panel.includes(token))failures.push(`Ensemble-Referenz fehlt: ${token}`);
for(const token of ['ICloudBackupSettings','Daten & Synchronisation','Geräteübergreifender Abgleich'])if(!app.includes(token))failures.push(`Einstellungsreferenz fehlt: ${token}`);
if(failures.length){console.error('Einstellungs-/Ensemble-Referenzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einstellungs- und Ensemble-Referenzfunktionen geprüft.');

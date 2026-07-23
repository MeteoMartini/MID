import fs from 'node:fs';

const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=fs.readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const [name,source] of [['7-Tage-Vorhersage',app],['Ensemble-Tooltip',ensemble]]){
 for(const token of ["Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:1})"]){
  if(!source.includes(token))failures.push(`${name}: deutsche variable Dezimaldarstellung fehlt: ${token}`);
 }
}
for(const token of ['format(seconds/3600)','sunshineDurationLabel(d.sunshineDuration,true)'])if(!app.includes(token))failures.push(`7-Tage-Sonnenscheindauer fehlt: ${token}`);
for(const token of ['formatSunshineHours(row.bestSunshineHours)','formatSunshineHours(row.sunshineLowHours)','formatSunshineHours(row.sunshineHighHours)'])if(!ensemble.includes(token))failures.push(`Ensemble-Sonnenscheindauer fehlt: ${token}`);

if(!ensemble.includes('P10–P90: {formatSunshineHours(row.sunshineLowHours)} bis {formatSunshineHours(row.sunshineHighHours)} h'))failures.push('Ensemble-Tooltip: P10–P90-Bezeichnung der Sonnenscheindauer fehlt');
if(ensemble.includes('(Bandbreite von {formatSunshineHours(row.sunshineLowHours)}'))failures.push('Ensemble-Tooltip verwendet noch die alte Bezeichnung „Bandbreite“');


const formatter=new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:1});
if(formatter.format(8.5)!=='8,5')failures.push('Intl-Regression: 8.5 wird nicht als 8,5 formatiert');
if(formatter.format(15)!=='15')failures.push('Intl-Regression: 15 wird fälschlich mit Dezimalstelle formatiert');
if(formatter.format(0)!=='0')failures.push('Intl-Regression: 0 wird fälschlich mit Dezimalstelle formatiert');

if(failures.length){console.error('Sonnenscheindauer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonnenscheindauer geprüft: volle Stunden ohne Dezimalstelle, sonst deutsches Dezimalkomma mit maximal einer Nachkommastelle.');

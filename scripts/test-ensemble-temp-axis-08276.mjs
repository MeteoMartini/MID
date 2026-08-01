import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function professionalEnsembleLayout(','xAxisHeight:compact?58:64','leftAxisWidth:compact?48:62','rightAxisWidth:compact?42:58','height:exporting?318:324','xAxisHeight={layout.xAxisHeight}'])if(!panel.includes(token))failures.push(`Gemeinsame Temperaturachse fehlt: ${token}`);
for(const token of ['.ensemble-temp-chart-core,.ensemble-rain-chart-core,.ensemble-wind-chart-core{','.ensemble-temp-axis-title-bottom,.ensemble-rain-axis-title-bottom,.ensemble-wind-axis-title-bottom{'])if(!css.includes(token))failures.push(`Gemeinsame Achsen-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Temperaturachsen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gemeinsame Ensemble-Achsenbreiten, Höhen und Titelzeilen geprüft.');

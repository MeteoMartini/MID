import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function useCompactEnsembleChart()','professionalEnsembleLayout(compact:boolean,exporting=false)','xAxisHeight:compact?58:64','axisFontSize:compact?8.5:10.5'])if(!panel.includes(token))failures.push(`Hochformat-Layout fehlt: ${token}`);
for(const token of ['@media(max-width:620px){','.ensemble-chart-export{--ensemble-axis-left:48px;--ensemble-axis-right:42px;--ensemble-axis-title:38px}','@media(max-width:390px){'])if(!css.includes(token))failures.push(`Hochformat-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Hochformat-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einheitliches Hochformat-Layout für Temperatur, Niederschlag und Wind geprüft.');

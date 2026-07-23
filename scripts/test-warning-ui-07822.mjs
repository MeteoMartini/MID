import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,ensemble,warnings,styles]=await Promise.all([
  read('src/App.tsx'),read('src/EnsemblePanel.tsx'),read('src/dwdWarnings.ts'),read('src/styles.css')
]);
const failures=[];
for(const token of ['Keine Warnhinweise','no-hazard'])if(!(app+styles).includes(token))failures.push(`Warnfreier 7-Tage-Hinweis fehlt: ${token}`);
for(const token of ['EnsembleHazardShape','ReferenceDot','y={11}','ensemble-hazard-marker','DWD_WARNING_COLORS'])if(!(ensemble+styles).includes(token))failures.push(`Ensemble-Warnmarker fehlt: ${token}`);
for(const token of ['Best-Match-Warnhinweise','row.hazards.map'])if(!ensemble.includes(token))failures.push(`Ensemble-Warnungen fehlen im Tooltip: ${token}`);
for(const token of ['.trend-tooltip,.trend-tooltip *','.trend-tooltip>strong','.tooltip-group span'])if(!styles.includes(token))failures.push(`Vereinheitlichte Tooltip-Schrift fehlt: ${token}`);
for(const forbidden of ['DWD-Warnstufe','DWD-Hitzewarnstufe'])if((app+ensemble+warnings).includes(forbidden))failures.push(`Warntexte enthalten weiterhin „${forbidden}“.`);
if(failures.length){console.error('Warn-UI-Prüfung v0.7.82.2 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Warn-UI v0.7.82.2 geprüft: warnfreie Tage, kompakte Ensemble-Marker, einheitlicher Tooltip und Warntexte ohne Stufenhinweise.');

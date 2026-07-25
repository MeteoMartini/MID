import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
  "const tooltipPlacement=narrowChart?'place-center':xAt(selectedHour)<=left+plotW*.36?'place-right':xAt(selectedHour)>=left+plotW*.64?'place-left':'place-center';",
  'className={`hour-chart-tooltip detail-overlay ${tooltipPlacement}`}',
  '{currentPrecip.label} · {windDirectionDescription(currentHour.direction)}',
  '<small>Temperatur</small><b>{Math.round(currentHour.temperature)}° · gefühlt {Math.round(currentHour.apparent)}°</b>',
  '<small>Bewölkung</small><b>{cloudOktas(currentHour.cloud)}/8 · {cloudOktasText(currentHour.cloud).split('
]) if(!app.includes(token)) failures.push(`Tooltip-Overlay fehlt: ${token}`);

for(const token of [
  '.hour-chart-tooltip.detail-overlay{',
  '.hour-chart-tooltip.detail-overlay.place-right{left:12px;right:auto;transform:none}',
  '.hour-chart-tooltip.detail-overlay.place-left{left:auto;right:12px;transform:none}',
  '.hour-chart-tooltip.detail-overlay.place-center{left:50%;right:auto;transform:translateX(-50%)}',
  '.hour-tooltip-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
  '@media(max-width:390px){.hour-tooltip-grid.compact{grid-template-columns:1fr}}'
]) if(!styles.includes(token)) failures.push(`Tooltip-CSS fehlt: ${token}`);

if(app.includes('hour-chart-tooltip persistent')) failures.push('Alte persistente Detailkarten-Ausgabe ist noch aktiv.');

if(failures.length){
  console.error('Detail-Tooltip-Overlay-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Detail-Tooltip-Overlay geprüft: Die Detailansicht nutzt ein kompaktes Overlay im Diagramm statt darunterliegender Karten und bleibt auf kleinen Displays einspaltig lesbar.');

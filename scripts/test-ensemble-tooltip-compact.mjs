import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
  'const hasSunRange=Number.isFinite(row.sunshineLowHours)&&Number.isFinite(row.sunshineHighHours),temperatureRows=[',
  "showClimatology&&isFiniteNumber(row.climateMin)&&isFiniteNumber(row.climateMax)?{label:'Klima 91–20'",
  'className="charttooltip trend-tooltip compact-trend-tooltip"',
  'className="trend-tooltip-head"',
  'className="trend-tooltip-matrix" role="table" aria-label="Temperaturwerte"',
  'Best Match: {formatSunshineHours(row.bestSunshineHours)} h',
  'className="tooltip-meta-block ensemble-hazard-tooltip"'
]) if(!panel.includes(token)) failures.push(`Kompakter Ensemble-Tooltip fehlt: ${token}`);

for(const token of [
  '.compact-trend-tooltip{',
  '.compact-trend-tooltip .trend-tooltip-head{',
  '.compact-trend-tooltip .trend-tooltip-matrix{',
  '.compact-trend-tooltip .trend-tooltip-meta{',
  '@media(max-width:520px){',
  '@media(max-width:390px){'
]) if(!styles.includes(token)) failures.push(`Tooltip-Stil fehlt: ${token}`);

if(panel.includes('Tmin: {formatDecimalFixed(row.minLow,1)} bis {formatDecimalFixed(row.minHigh,1)} °C')) failures.push('Altes breites Fließtext-Layout des Ensemble-Tooltips ist noch vorhanden.');

if(failures.length){
  console.error('Ensemble-Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Tooltip geprüft: kompakte Matrixdarstellung für Tmin/Tmax und schmale Displays ist vorhanden.');

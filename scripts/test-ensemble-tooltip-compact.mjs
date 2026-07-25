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
  'className="trend-tooltip-matrix" role="table" aria-label="Temperaturwerte in Grad Celsius"',
  'className="matrix-head value-head" role="columnheader">Tmax °C</span>',
  'className="matrix-value" role="cell">{item.max}</span>',
  'position={compactTrendTooltip?{x:0}:undefined}',
  'allowEscapeViewBox={{x:false,y:true}}',
  'className="tooltip-meta-line sunshine-tooltip-line"',
  'className="tooltip-meta-block ensemble-hazard-tooltip"'
]) if(!panel.includes(token)) failures.push(`Kompakter Ensemble-Tooltip fehlt: ${token}`);

for(const token of [
  '.compact-trend-tooltip{',
  'width:min(286px,calc(100vw - 24px))',
  'white-space:nowrap;',
  '.compact-trend-tooltip .trend-tooltip-matrix>.matrix-value,.compact-trend-tooltip .trend-tooltip-matrix>.value-head{',
  '.compact-trend-tooltip .trend-tooltip-matrix>.matrix-value,.compact-trend-tooltip .trend-tooltip-matrix>.value-head{',
  '@media(max-width:520px){',
  '@media(max-width:360px){'
]) if(!styles.includes(token)) failures.push(`Tooltip-Stil fehlt: ${token}`);

if(panel.includes('Tmin: {formatDecimalFixed(row.minLow,1)} bis {formatDecimalFixed(row.minHigh,1)} °C')) failures.push('Altes breites Fließtext-Layout des Ensemble-Tooltips ist noch vorhanden.');

if(failures.length){
  console.error('Ensemble-Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Ensemble-Tooltip geprüft: Matrix, verdichtete Handy-Darstellung und feste linke Tooltip-Position auf schmalen Displays sind vorhanden.');

import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
  "[selectedId,setSelectedId]=useState('')",
  'className="cockpit-short-matrix-shell"',
  'className="cockpit-short-matrix-grid"',
  "className={`cockpit-short-matrix-slot${selectedPoint.id===point.id?' active':''}${precipStrong?' wet':''}${point.isDay?' day':' night'}`}",
  "className={`cockpit-now90-slot${item.precipitation>=.01?' wet':''}${selectedPoint.id===item.id?' active':''}`}",
  'onClick={()=>activatePoint(point)}',
  'aria-controls="cockpit-shortterm-selected-detail"',
  'ecmwfTemperatureTone(point.temperature)',
  'id="cockpit-shortterm-selected-detail"',
  "className={`cockpit-hourly-chip${point.precipitation>=.05||point.probability>=45?' wet':''}${point.isDay?' day':' night'}${selectedPoint.id===point.id?' active':''}`}"
])need('Kurzfrist-Interaktion',cockpit,token);

for(const token of [
  '.cockpit-short-matrix-shell{',
  '.cockpit-short-matrix-grid{display:grid;grid-auto-flow:column;',
  '.cockpit-short-matrix-slot{display:grid;',
  '.cockpit-short-matrix-temp{display:grid;',
  '.cockpit-now90-slot.active,.cockpit-hourly-chip.active,.cockpit-short-matrix-slot.active{',
  '@media(max-width:620px){.cockpit-short-matrix-shell{padding:11px}.cockpit-short-matrix-grid{grid-auto-flow:row;',
  '.cockpit-hourly-preview{grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:1fr;overflow-x:visible;scroll-snap-type:none}',
  '.cockpit-focus-card.short-term-focus{grid-template-columns:minmax(200px,1.3fr) auto minmax(145px,1fr) minmax(165px,1.05fr) minmax(165px,1.05fr)}'
])need('Kurzfrist-CSS',styles,token);

reject('Altes Kurzfrist-SVG',cockpit,'className="cockpit-short-chart"');
for(const token of ['Gauge size={13}','Navigation size={13}','function windSignalColor(gustKt:number)','windSignalColor(point.gust)','function SvgWindDirectionArrow(','<SvgWindDirectionArrow'])need('Verwendete ForecastCockpit-Helfer',cockpit,token);
reject('Entfernte ungenutzte CloudRain-Deklaration',cockpit,'CloudRain');
need('Package-Test',pkg,'test:cockpit-shortterm-interaction');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-interaction-09173.mjs');
need('Version',pkg,'"version": "0.9.17.3"');
need('Version',baseline,'"releaseVersion": "0.9.17.3"');

if(failures.length){
  console.error('Interaktive Kurzfristmatrix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Interaktive Kurzfristmatrix mit ECMWF-Farbtemperaturen und mobilen Flachfeldern erfolgreich geprüft.');

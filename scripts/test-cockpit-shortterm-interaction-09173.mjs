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
  'className="cockpit-short-diagram-shell"',
  'className="cockpit-short-diagram-grid"',
  'className="cockpit-short-diagram-labels"',
  "className={`cockpit-short-diagram-column${selectedPoint.id===point.id?' active':''}${precipStrong?' wet':''}${point.isDay?' day':' night'}`}",
  "className={`cockpit-now90-slot${item.precipitation>=.01?' wet':''}${selectedPoint.id===item.id?' active':''}`}",
  'onClick={()=>activatePoint(point)}',
  'aria-controls="cockpit-shortterm-selected-detail"',
  'ecmwfTemperatureTone(point.temperature)',
  'id="cockpit-shortterm-selected-detail"',
  'cockpit-short-diagram-temp-track',
  'cockpit-short-diagram-bar-track',
  'cockpit-short-diagram-wind-track',
  "className={`cockpit-hourly-chip${point.precipitation>=.05||point.probability>=45?' wet':''}${point.isDay?' day':' night'}${selectedPoint.id===point.id?' active':''}`}"
])need('Kurzfrist-Interaktion',cockpit,token);

for(const token of [
  '.cockpit-short-diagram-shell{',
  '.cockpit-short-diagram-grid{display:grid;grid-auto-flow:column;',
  '.cockpit-short-diagram-column{display:grid;grid-template-rows:auto repeat(5,minmax(0,1fr));',
  '.cockpit-short-diagram-temp-indicator{',
  '.cockpit-short-diagram-wind-meta{display:flex;',
  '.cockpit-now90-slot.active,.cockpit-hourly-chip.active,.cockpit-short-matrix-slot.active,.cockpit-short-diagram-column.active{',
  '@media(max-width:860px){.cockpit-short-diagram-board{grid-template-columns:1fr}.cockpit-short-diagram-labels{display:none}',
  '.cockpit-focus-card.short-term-focus{grid-template-columns:minmax(200px,1.3fr) auto minmax(145px,1fr) minmax(165px,1.05fr) minmax(165px,1.05fr)}'
])need('Kurzfrist-CSS',styles,token);

reject('Alte Kurzfristmatrix',cockpit,'className="cockpit-short-matrix-shell"');
for(const token of ['Gauge size={13}','Navigation size={13}','function windSignalColor(gustKt:number)','windSignalColor(point.gust)','function SvgWindDirectionArrow(','<SvgWindDirectionArrow'])need('Verwendete ForecastCockpit-Helfer',cockpit,token);
reject('Entfernte ungenutzte CloudRain-Deklaration',cockpit,'CloudRain');
need('Package-Test',pkg,'test:cockpit-shortterm-interaction');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-interaction-09173.mjs');
need('Version',pkg,'"version": "0.9.17.4"');
need('Version',baseline,'"releaseVersion": "0.9.17.4"');

if(failures.length){
  console.error('Interaktive Kurzfristdiagrammansicht fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Interaktive Kurzfristdiagrammansicht mit ECMWF-Farbtemperaturen und kompakter mobiler 24-h-Leiste erfolgreich geprüft.');

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
  'className="cockpit-short-diagram-canvas"',
  'className="cockpit-short-diagram-hitlayer"',
  'className="cockpit-short-diagram-tooltip"',
  "className={`cockpit-short-diagram-hotspot${selectedVisualPoint?.point.id===item.point.id?' active':''}${item.point.isDay?' day':' night'}${item.point.precipitation>=.05||item.point.probability>=45?' wet':''}`}",
  "className={`cockpit-now90-slot${item.precipitation>=.01?' wet':''}${selectedPoint.id===item.id?' active':''}`}",
  'onClick={()=>activatePoint(item.point)}',
  'aria-controls="cockpit-shortterm-selected-detail"',
  'ecmwfTemperatureTone(item.point.temperature)',
  'id="cockpit-shortterm-selected-detail"',
  'function buildShortTermChartPath(points:{x:number;y:number}[])',
  'className="cockpit-short-diagram-overlay wind"',
  "className={`cockpit-hourly-chip${point.precipitation>=.05||point.probability>=45?' wet':''}${point.isDay?' day':' night'}${selectedPoint.id===point.id?' active':''}`}"
])need('Kurzfrist-Interaktion',cockpit,token);

for(const token of [
  '.cockpit-short-diagram-shell{display:grid;gap:14px;',
  '.cockpit-short-diagram-grid{display:grid;gap:12px}',
  '.cockpit-short-diagram-hitlayer{position:absolute;inset:0}',
  '.cockpit-short-diagram-hotspot{position:absolute;top:0;bottom:0;border:0;background:transparent;',
  '.cockpit-short-diagram-hotspot.active{background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(54,101,153,.08));',
  '.cockpit-now90-slot.active,.cockpit-hourly-chip.active,.cockpit-short-matrix-slot.active,.cockpit-short-diagram-column.active{',
  '.cockpit-focus-card.short-term-focus{grid-template-columns:minmax(200px,1.3fr) auto minmax(145px,1fr) minmax(165px,1.05fr) minmax(165px,1.05fr)}'
])need('Kurzfrist-CSS',styles,token);

reject('Alte Kurzfristmatrix',cockpit,'className="cockpit-short-matrix-shell"');
reject('Alte Kurzfristspalten',cockpit,'cockpit-short-diagram-column');
for(const token of ['Gauge size={13}','Navigation size={13}','function windSignalColor(gustKt:number)','windSignalColor(point.gust)','function SvgWindDirectionArrow(','<SvgWindDirectionArrow'])need('Verwendete ForecastCockpit-Helfer',cockpit,token);
reject('Entfernte ungenutzte CloudRain-Deklaration',cockpit,'CloudRain');
need('Package-Test',pkg,'test:cockpit-shortterm-interaction');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-interaction-09173.mjs');
need('Version',pkg,'"version": "0.9.17.5"');
need('Version',baseline,'"releaseVersion": "0.9.17.5"');

if(failures.length){
  console.error('Interaktive Kurzfristdiagrammansicht fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Interaktive Kurzfristdiagrammansicht mit Meteogramm-Overlay und mobiler Tooltip-Anpassung erfolgreich geprüft.');

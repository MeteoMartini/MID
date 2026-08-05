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
  'timelinePoints=hourlyPoints.slice(0,Math.min(24,hourlyPoints.length))',
  'className="cockpit-short-insight-grid premium"',
  'className="cockpit-short-diagram-head"',
  'Kompakte Meteogramm-Ansicht im Direktvergleich',
  'Temperaturmittel mit ECMWF-Farbskala',
  'className="cockpit-short-diagram-tooltip"',
  'auch auf schmalen Displays lesbar',
  'className="cockpit-hourly-preview-shell"',
  'Kompakte 24-h-Zeitachse',
  'Seitlich wischbar – mobil flach verdichtet',
  'className="cockpit-hourly-day-marker"',
  "className={`cockpit-hourly-chip${point.precipitation>=.05||point.probability>=45?' wet':''}${point.isDay?' day':' night'}${selectedPoint.id===point.id?' active':''}`}",
  'shortTermTrendLabel(previewPoints)'
])need('Kurzfrist-Premium-Cockpit',cockpit,token);

for(const token of [
  '.cockpit-short-diagram-head{display:flex;',
  '.cockpit-short-diagram-tooltip{position:absolute;',
  '.cockpit-short-diagram-labels{display:flex;',
  '.cockpit-hourly-preview-shell{',
  '.cockpit-hourly-preview-head>span>strong{',
  '.cockpit-hourly-preview{display:grid;grid-auto-flow:column;',
  '@media(max-width:920px){.cockpit-short-diagram-shell{padding:14px}.cockpit-short-diagram-tooltip{top:auto;bottom:58px;left:14px!important;right:14px;transform:none;max-width:none}',
  ".cockpit-hourly-chip{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;grid-template-areas:'day day day day' 'time temp main wind' 'rain rain rain rain'"
])need('CSS',styles,token);

reject('Frühere Kartenmatrix',cockpit,'Innovative Parametertimeline im direkten Zeitvergleich');
need('Package-Test',pkg,'test:cockpit-shortterm-premium');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-premium-09172.mjs');
need('Version',pkg,'"version": "0.9.17.5"');
need('Version',baseline,'"releaseVersion": "0.9.17.5"');

if(failures.length){
  console.error('Kurzfrist-Premium-Layout fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Professioneller Kurzfristbereich mit Meteogramm, Tooltip-Overlay und flacher 24-h-Zeitachse erfolgreich geprüft.');

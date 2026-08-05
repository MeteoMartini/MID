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
  'className="cockpit-hourly-preview-shell"',
  'className="cockpit-hourly-day-marker"',
  "cockpit-hourly-chip${point.precipitation>=.05||point.probability>=45?\' wet\':\'\'}${point.isDay?\' day\':\' night\'}",
  'formatDate(dateOnlyFromEpoch(timelineLead.epoch,timezone)',
  'shortTermTrendLabel(previewPoints)'
])need('Kurzfrist-Premium-Cockpit',cockpit,token);

for(const token of [
  '.cockpit-short-insight-grid.premium{grid-template-columns:repeat(4,minmax(0,1fr))}',
  '.cockpit-hourly-preview-shell{',
  '.cockpit-hourly-preview{display:grid;grid-auto-flow:column;',
  '.cockpit-hourly-day-marker{',
  '@media(max-width:620px){.cockpit-short-insight-grid.premium{grid-template-columns:1fr}',
  '@media(max-width:760px){.cockpit-hourly-preview-head{flex-direction:column;align-items:flex-start}.cockpit-hourly-preview-head>em{white-space:normal}.cockpit-hourly-preview{grid-auto-columns:minmax(132px,68vw)}}'
])need('CSS',styles,token);

reject('Zweispaltige mobile Stundenvorschau',styles,'.cockpit-hourly-preview{grid-template-columns:repeat(2,minmax(0,1fr))}');
need('Package-Test',pkg,'test:cockpit-shortterm-premium');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-premium-09172.mjs');
need('Version',pkg,'"version": "0.9.17.2"');
need('Version',baseline,'"releaseVersion": "0.9.17.2"');

if(failures.length){
  console.error('Kurzfrist-Premium-Layout fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Professioneller Kurzfristbereich mit 24h-Timeline und responsiver Geräteanpassung erfolgreich geprüft.');

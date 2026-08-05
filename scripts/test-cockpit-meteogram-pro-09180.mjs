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
  'function ecmwfTemperatureLineColor(value:number)',
  'chartSourcePoints=points.slice(0,Math.min(points.length,resolution===\'1h\'?24:16))',
  'chartWidth=Math.max(720,',
  'className="cockpit-meteogram-pro__svg"',
  '<linearGradient id={temperatureGradientId}',
  'className="temperature-line"',
  'className="apparent-line"',
  'className="cockpit-meteogram-pro__legend"',
  'Temperatur (ECMWF)'
])need('Meteogramm',cockpit,token);

for(const token of [
  '--mg-shell:#0a1727',
  '--mg-plot:#102238',
  ':root[data-theme=light] .cockpit-meteogram-pro{',
  '--mg-shell:#ffffff',
  '--mg-plot:#f7f8f8',
  '.cockpit-meteogram-pro__canvas{position:relative;min-width:720px;',
  '.cockpit-meteogram-pro__svg .plot-bg{fill:var(--mg-plot)',
  '.cockpit-meteogram-pro__legend i.temperature{width:24px;height:4px;border-radius:999px;background:linear-gradient',
  '@media(max-width:760px){'
])need('Theme/Responsive-CSS',styles,token);

reject('Alte zweispaltige Diagrammgrid im neuen Markup',cockpit,'className="cockpit-short-diagram-grid"');
reject('Hartcodierte weiße Meteogrammfläche',styles,'.cockpit-meteogram-pro__svg .plot-bg{fill:#fff');
need('Package-Script',pkg,'test:cockpit-meteogram-pro');
need('Baseline-Test',baseline,'scripts/test-cockpit-meteogram-pro-09180.mjs');
need('Version',pkg,'"version": "0.9.18.0"');
need('Version',baseline,'"releaseVersion": "0.9.18.0"');
if(failures.length){console.error('Professionelles Meteogramm fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hochauflösendes, Dark-/Light-Mode-fähiges Kurzfrist-Meteogramm erfolgreich geprüft.');

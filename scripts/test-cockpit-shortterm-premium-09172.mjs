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
  'className="cockpit-meteogram-pro"',
  'Professionelles 24-h-Meteogramm',
  'Temperaturmittel mit ECMWF-Farbverlauf',
  'className="cockpit-meteogram-pro__tooltip desktop"',
  'className="cockpit-meteogram-pro__tooltip mobile"',
  'className="cockpit-hourly-preview-shell"',
  'Kompakte 24-h-Zeitachse',
  'shortTermTrendLabel(previewPoints)'
])need('Kurzfrist-Premium-Cockpit',cockpit,token);

for(const token of [
  '.cockpit-meteogram-pro{',
  ':root[data-theme=light] .cockpit-meteogram-pro{',
  '.cockpit-meteogram-pro__stage{width:100%;max-width:100%;overflow-x:auto;',
  '.cockpit-meteogram-pro__tooltip.desktop{position:absolute;',
  '.cockpit-meteogram-pro__tooltip.mobile{display:none}',
  '@media(max-width:760px){',
  '.cockpit-meteogram-pro__tooltip.mobile{display:block;'
])need('CSS',styles,token);

reject('Altes konfliktanfälliges Diagramm-Markup',cockpit,'className="cockpit-short-diagram-shell"');
need('Package-Test',pkg,'test:cockpit-shortterm-premium');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-premium-09172.mjs');
need('Version',pkg,'"version": "0.9.18.0"');
need('Version',baseline,'"releaseVersion": "0.9.18.0"');
if(failures.length){console.error('Kurzfrist-Premium-Layout fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Eigenständiges professionelles Kurzfrist-Meteogramm mit Desktop-Overlay und mobiler Detailbox erfolgreich geprüft.');

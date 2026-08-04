import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'function compactGustLabel(gustKt:number,unit:WindUnit)',
  "return`G${Math.round(gustKt)} kt`",
  'className="cockpit-day-main-icon"',
  'className="cockpit-day-night-glyph"',
  'size={40}',
  'size={21}',
  'compactGustLabel(day.gust,unit)'
])need('ForecastCockpit.tsx',cockpit,token);

for(const token of [
  'MID v0.9.13.4 – Forecast-Cockpit',
  '.cockpit-day-main-icon{',
  '.cockpit-day-night-icon{position:absolute',
  'background:transparent',
  'box-shadow:none',
  '.cockpit-day-night-glyph{',
  '.cockpit-day-wind{display:grid!important',
  '.cockpit-day-wind small{justify-self:end'
])need('styles.css',styles,token);

need('package.json',pkg,'test:forecast-cockpit-daynight-wind');
need('MID_BASELINE.json',baseline,'scripts/test-forecast-cockpit-daynight-wind-09134.mjs');

if(failures.length){
  console.error('Forecast-Cockpit-Tag/Nacht/Böen-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Forecast-Cockpit-Tag/Nacht-Piktogramme und kompakte Böenangabe geprüft.');

import assert from 'node:assert/strict';
import vm from 'node:vm';
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
  'size={42}',
  'size={24}',
  'compactGustLabel(day.gust,unit)'
])need('ForecastCockpit.tsx',cockpit,token);

for(const token of [
  'MID v0.9.14.5 – besser lesbare Nachtpiktogramme',
  '.cockpit-day-main-icon{',
  '.cockpit-day-night-icon{position:static',
  'background:transparent',
  'box-shadow:none',
  '.cockpit-day-night-glyph{',
  '.cockpit-day-wind{display:grid!important',
  '.cockpit-day-wind small{justify-self:end;max-width:none;white-space:nowrap;overflow:visible'
])need('styles.css',styles,token);

need('package.json',pkg,'test:forecast-cockpit-daynight-wind');
need('MID_BASELINE.json',baseline,'scripts/test-forecast-cockpit-daynight-wind-09134.mjs');

const {transformSync}=await import('esbuild');
const functions=['validForecastWindValue','validForecastDirection'].map(name=>{
 const start=cockpit.indexOf('function '+name+'('),end=cockpit.indexOf('\n}',start);
 assert.ok(start>=0&&end>start,'Forecast original helper missing: '+name);
 return cockpit.slice(start,end+2);
}).join('\n');
const context={};vm.runInNewContext(transformSync(functions+'\nglobalThis.__wind={speed:validForecastWindValue,direction:validForecastDirection};',{loader:'ts',format:'iife',target:'es2022'}).code,context);
for(const value of [undefined,null,false,'',NaN,Infinity,-1]){assert.ok(Number.isNaN(context.__wind.speed(value)));assert.ok(Number.isNaN(context.__wind.direction(value)));}
for(const value of [0,5,35,180,360]){assert.equal(context.__wind.speed(value),value);assert.equal(context.__wind.direction(value),value);}
assert.ok(Number.isNaN(context.__wind.direction(361)),'Out-of-range wind direction must not silently become north');
assert.ok(cockpit.includes('direction:validForecastDirection(hour.direction)')&&cockpit.includes('wind:validForecastWindValue(hour.wind)')&&cockpit.includes('gust:validForecastWindValue(hour.gust)'),'Hourly fallback must preserve NoData for wind, gust and direction');
if(failures.length){
  console.error('Forecast-Cockpit-Tag/Nacht/Böen-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Forecast-Cockpit-Tag/Nacht-Piktogramme und kompakte Böenangabe geprüft.');

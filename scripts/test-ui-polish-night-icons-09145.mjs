import {readFile} from 'node:fs/promises';

const [cockpit,app,pictogram,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/WeatherPictogram.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'function compactGustLabel(gustKt:number,unit:WindUnit)',
  "return`G${Math.round(gustKt*.514444)} m/s`",
  'size={24} compact title={nightVisual.title}',
  'className="cockpit-day-night-glyph"'
])need('ForecastCockpit.tsx',cockpit,token);

for(const token of [
  'function WeatherPeriodIcons({dayVisual,nightVisual,daySize=44,nightSize=25}',
  'daySize={46} nightSize={26}',
  'daySize={36} nightSize={23}',
  'daySize={40} nightSize={24}'
])need('App.tsx',app,token);

for(const token of [
  'nightCloudGradient=`mid-cloud-night-${rawId}`',
  'nightStormGradient=`mid-storm-night-${rawId}`',
  "const darkCloud=['thunder','thunder-hail','squall','funnel-cloud'].includes(kind),cloudFillGradient=day?cloudGradient:nightCloudGradient,stormFillGradient=day?stormGradient:nightStormGradient;",
  '<linearGradient id={nightCloudGradient}',
  '<linearGradient id={nightStormGradient}'
])need('WeatherPictogram.tsx',pictogram,token);

for(const token of [
  'MID v0.9.14.5 – besser lesbare Nachtpiktogramme',
  '.weather-period-icons{position:relative;display:inline-flex!important;align-items:center',
  '.cockpit-day-night-icon{position:static',
  '.cockpit-day-wind small{justify-self:end;max-width:none;white-space:nowrap;overflow:visible',
  '.forecast-inline-detail-weather small{max-width:100%;color:var(--text);font-size:9px;font-weight:750;line-height:1.22;text-align:center;white-space:normal',
  '.forecast-inline-detail-temp{display:grid;align-content:center;justify-items:center;gap:3px;padding:9px 8px;border:1px solid color-mix(in srgb,#e4a949 42%,var(--border));border-radius:16px;',
  '.mid-weather-pictogram[data-day-part="night"] .mid-weather-moon{filter:drop-shadow(0 0 3px rgba(255,239,170,.28))}'
])need('styles.css',styles,token);

need('package.json',pkg,'test:ui-polish-night-icons');
need('MID_BASELINE.json',baseline,'scripts/test-ui-polish-night-icons-09145.mjs');

if(failures.length){
  console.error('UI-Polish-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('UI-Polish für Nachtpiktogramme, Böenlayout und klassische Stundenliste geprüft.');

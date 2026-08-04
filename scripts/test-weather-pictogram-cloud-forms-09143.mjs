import {readFile} from 'node:fs/promises';

const [pictogram,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/WeatherPictogram.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "export type CloudFormKind='clear'|'stratus'|'altostratus'|'cirrus'|'cumulus'|'cumulonimbus'|'layered'|'generic'",
  'export function cloudFormKind(code:number,profile:WeatherPictogramCloudProfile={})',
  "if(['fog','rime-fog','drizzle','freezing-drizzle'].includes(weatherKind))return'stratus'",
  "if(layer==='mid')return'altostratus'",
  "if(layer==='high')return'cirrus'",
  "return'cumulus'",
  'function CumulusCloud(',
  'function AltostratusCloud(',
  'function CumulonimbusCloud(',
  'data-cloud-form={form}',
  "data-day-part={day?'day':'night'}",
  '<SkyPlate day={day} kind={kind} form={form}/>'
])need('WeatherPictogram.tsx',pictogram,token);

for(const token of [
  'MID v0.9.14.3 – cloud-form sharpening',
  '.mid-weather-pictogram.cloud-form-stratus',
  '.mid-weather-pictogram.cloud-form-altostratus',
  '.mid-weather-pictogram.cloud-form-cirrus',
  '.mid-weather-pictogram.cloud-form-cumulus',
  '.mid-weather-pictogram.cloud-form-cumulonimbus',
  '.mid-weather-pictogram[data-day-part="night"]'
])need('styles.css',styles,token);

need('package.json',pkg,'test:weather-pictogram-cloud-forms');
need('MID_BASELINE.json',baseline,'scripts/test-weather-pictogram-cloud-forms-09143.mjs');

if(failures.length){
  console.error('Wolkenform-/Tag-Nacht-Piktogramm-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Wolkenformen, Wolkenstockwerke und Tag/Nacht-Hintergründe geprüft.');

import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};

for(const token of [
  'sultry=Number(point.dewPoint)>=17',
  'Schwülegrenze erreicht',
  'Td ≥ 17 °C',
  '≈ 18,8 hPa Dampfdruck',
  "'keine signifikanten Wettergefahren'",
  "reason:'Gewitterrisiko'",
  'reason:fog.reason',
  'Nebel/Sicht',
  'Sichtweite + Nebelrisiko',
  "'kein signifikantes Risiko'",
  'rate>=15?90:rate>=10?72:rate>=5?50:0',
  'chartHeight=446'
])need('24-h-Wetterprofil',cockpit,token);

for(const token of [
  'prägend:',
  '<dt><i className="dew"/>Feuchte</dt>',
  "kind==='rain'?64",
  "reason:'Sicht / Nebel'"
])reject('24-h-Wetterprofil',cockpit,token);

for(const token of [
  '--profile-low:#50697c',
  '--profile-mid:#849eae',
  '--profile-high:#e0e8ed',
  ':root[data-theme=light] .cockpit-weather-profile{--profile-low:#52697a;--profile-mid:#7d94a5;--profile-high:#a9b9c5}',
  'gap:7px',
  '.cockpit-weather-profile .cockpit-meteogram-pro__stage{padding:0}',
  '.cockpit-weather-profile .cockpit-meteogram-pro__legend{margin-top:-1px}',
  'filter:contrast(1.18)'
])need('Wetterprofil-Styles',styles,token);

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion}/${baselineVersion}`);
if(failures.length){console.error(`MID v0.9.32.1 Thermik-/Hazard-Klarheit fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.32.1: Schwüle, klare Hazards, kompaktere Abstände und kontrastreichere Wolken geprüft.');

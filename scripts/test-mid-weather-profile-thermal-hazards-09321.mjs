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
  'function shortTermSultryAssessment(point:ShortTermForecastPoint)',
  'shortTermSaturationVaporPressureHpa',
  'coreMoisture=vaporPressure>=18.8',
  'windRelief=clamp((windMs-1.5)/6.5,0,1)',
  'radiationLoad=point.isDay?',
  'sultryAssessment=shortTermSultryAssessment(point)',
  '18,8 hPa',
  'Strahlungsproxy aus Sonnenscheindauer und Bewölkung',
  "'keine signifikanten Wettergefahren'",
  "reason:'Gewitterrisiko'",
  'reason:fog.reason',
  'Nebel/Sicht',
  'Sichtweite + Nebelrisiko',
  "{selectedThermal.sultry?'Taupunkt + Schwüle':'Taupunkt'}",
  "{selectedThermal.sultry?' · schwül':''}",
  "replace('kein signifikantes Risiko','kein Risiko')",
  "'keine Wettergefahren'",
  "'kein signifikantes Risiko'",
  'rate>=15?90:rate>=10?72:rate>=5?50:0',
  'chartHeight=446'
])need('24-h-Wetterprofil',cockpit,token);

for(const token of [
  'prägend:',
  '<dt><i className="dew"/>Feuchte</dt>',
  "kind==='rain'?64",
  "reason:'Sicht / Nebel'",
  'sultry=Number(point.dewPoint)>=17',
  "'Schwülegrenze erreicht'",
  "'nicht schwül'"
])reject('24-h-Wetterprofil',cockpit,token);

for(const token of [
  '--profile-low:#50697c',
  '--profile-mid:#849eae',
  '--profile-high:#e0e8ed',
  ':root[data-theme=light] .cockpit-weather-profile{--profile-low:#52697a;--profile-mid:#7d94a5;--profile-high:#a9b9c5}',
  'gap:7px',
  '.cockpit-weather-profile .cockpit-meteogram-pro__stage{padding:0}',
  '.cockpit-weather-profile .cockpit-meteogram-pro__legend{margin-top:-1px}',
  '.cockpit-weather-profile .cloud-band{stroke:color-mix(in srgb,var(--mg-text) 12%,transparent);stroke-width:.4;shape-rendering:geometricPrecision}'
])need('Wetterprofil-Styles',styles,token);

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion}/${baselineVersion}`);
if(failures.length){console.error(`MID Thermik-/Hazard-Klarheit fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: Mehrfaktoren-Schwüle, klare Hazards und wolkengetriebene Kontraste ohne Zusatzhintergrund geprüft.');

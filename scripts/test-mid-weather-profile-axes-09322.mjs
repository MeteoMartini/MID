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
  'chartPaddingLeft=96,chartPaddingRight=58',
  'className="profile-axis temperature-axis"',
  'className="profile-axis precipitation-axis"',
  'className="profile-axis wind-axis"',
  'className="profile-time-axis"',
  'profile-time-tick',
  '>°C</text>',
  '>mm</text>',
  "unit==='kmh'?'km/h':unit==='ms'?'m/s':unit==='mph'?'mph':'kt'",
  'textAnchor="end" x={chartPaddingLeft-10}',
  '100 %'
])need('24-h-Wetterprofil',cockpit,token);

for(const token of [
  '.cockpit-weather-profile .profile-axis-spine',
  '.cockpit-weather-profile .profile-axis-tick',
  '.cockpit-weather-profile .profile-axis-unit',
  '.cockpit-weather-profile .profile-time-axis',
  '.cockpit-weather-profile .profile-time-tick.major',
  '.cockpit-weather-profile .cockpit-meteogram-pro__overlay.time>span{top:5px',
  'background:color-mix(in srgb,var(--mg-shell) 72%,transparent)',
  '.cockpit-weather-profile .cockpit-meteogram-pro__svg .day-separator'
])need('Achsen-Styles',styles,token);

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion}/${baselineVersion}`);
if(packageVersion!=='0.9.32.2')failures.push(`unerwartete Version ${packageVersion}`);
if(failures.length){console.error(`MID v0.9.32.2 Achsen-Politur fehlgeschlagen:
- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.32.2: 24-h-Achsen mit Skalen, Tickmarken, Einheiten und ruhiger Zeitachse geprüft.');

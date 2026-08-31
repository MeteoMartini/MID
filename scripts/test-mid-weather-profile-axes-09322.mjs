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
  'chartPaddingLeft=compactProfile?82:chartViewportWidth<=860?90:104',
  'chartPaddingRight=compactProfile?44:chartViewportWidth<=860?50:58',
  'className="profile-axis temperature-axis"',
  'className="profile-axis precipitation-axis"',
  'className="profile-axis wind-axis"',
  'className="profile-axis pressure-axis"',
  'className="profile-time-axis"',
  'className="profile-time-axis bottom"',
  'profile-time-tick',
  'profile-lane-unit-label',
  '>°C</text>',
  '>mm</text>',
  '>hPa</text>',
  "unit==='kmh'?'km/h':unit==='ms'?'m/s':unit==='mph'?'mph':'kt'",
  'textAnchor="end" x={chartPaddingLeft-10}',
  '[chartRainMax,chartRainMax/2,0].map',
  '[100,50,0].map',
  '[chartWindMax,chartWindMax/2,0].map'
])need('24-h-Wetterprofil',cockpit,token);

for(const token of [
  '.cockpit-weather-profile .profile-axis-spine',
  '.cockpit-weather-profile .profile-axis-tick',
  '.cockpit-weather-profile .profile-axis-unit',
  '.cockpit-weather-profile .profile-time-axis',
  '.cockpit-weather-profile .profile-time-tick.major',
  '.cockpit-weather-profile .cockpit-meteogram-pro__overlay.time>span{top:3px',
  'background:color-mix(in srgb,var(--mg-shell) 76%,transparent)',
  '.cockpit-weather-profile .cockpit-meteogram-pro__svg .day-separator'
])need('Achsen-Styles',styles,token);

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion}/${baselineVersion}`);
if(failures.length){console.error(`MID 24-h-Achsen-Politur fehlgeschlagen:
- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Achsen mit Skalen, Tickmarken, Einheiten und ruhiger Zeitachse geprüft.');

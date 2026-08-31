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
  'chartPaddingLeft=compactProfile?60:chartViewportWidth<=860?70:82',
  'chartPaddingRight=compactProfile?24:chartViewportWidth<=860?28:34',
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
  'x={leftScaleLabelX}',
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
  '.cockpit-weather-profile .cockpit-meteogram-pro__overlay.time>span{top:24px',
  'background:color-mix(in srgb,var(--mg-shell) 54%,transparent)',
  '.cockpit-weather-profile .cockpit-meteogram-pro__svg .day-separator',
  '.cockpit-weather-profile .profile-bottom-date{',
  '.cockpit-weather-profile .profile-axis .axis-label{fill:var(--mg-muted);font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;paint-order:stroke fill;'
])need('Achsen-Styles',styles,token);

if(cockpit.includes('cockpit-meteogram-pro__overlay calendar'))failures.push('24-h-Wetterprofil: dominante obere Kalenderzeile muss entfernt bleiben');

const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
if(packageVersion!==baselineVersion)failures.push(`Versionen nicht synchron: ${packageVersion}/${baselineVersion}`);
if(failures.length){console.error(`MID 24-h-Achsen-Politur fehlgeschlagen:
- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Achsen mit Skalen, Tickmarken, Einheiten und ruhiger Zeitachse geprüft.');

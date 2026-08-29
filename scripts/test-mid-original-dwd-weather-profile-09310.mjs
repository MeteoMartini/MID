import {readFile} from 'node:fs/promises';

const [radar,cockpit,styles]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};

for(const token of [
  "buildWorkerUrl(base,'dwd-precipitation-type-image',{slot})",
  "response.headers.get('x-mid-radar-at')",
  "response.headers.get('x-mid-satellite-at')",
  'dwd-precip-type-radar__zoom-toolbar',
  'dwd-precip-type-radar__original-viewport',
  'dwd-precip-type-radar__original-image',
  'const changeZoom=',
  'const resetZoom=',
  "fetchWorkerJson<RadarPointInfo>('dwd-precipitation-type-info'"
])need('DWD-Originalprodukt',radar,token);
for(const token of ['./DwdPrecipitationMap','./HymecNgOverlay','./HymecNgSource','./CompositeData'])reject('DWD-Originalprodukt',radar,token);

for(const token of [
  '24-h-Wetterprofil',
  'function shortTermImpactForInterval(signals:DwdWarningSignal[],startEpoch:number,endEpoch:number)',
  'function shortTermPressureTrend(',
  'chartWidth=Math.max(chartMinimumWidth,chartViewportWidth)',
  'className="dewpoint-line"',
  'className="wind-line"',
  'className="gust-line"',
  'className="cloud-cell-frame high"',
  'className="cloud-cell-frame mid"',
  'className="cloud-cell-frame low"',
  'impact-band',
  'cockpit-weather-profile__signals',
  'selectedImpact.summary'
])need('24-h-Wetterprofil',cockpit,token);
for(const token of ['shortTermCloudBaseApprox','Wolkenbasis*'])reject('24-h-Wetterprofil',cockpit,token);
for(const token of [
  '.dwd-precip-type-radar__zoom-toolbar',
  '.dwd-precip-type-radar__original-viewport',
  '.dwd-precip-type-radar__original-image',
  '.cockpit-weather-profile__signals',
  '.cloud-cell-frame',
  '.impact-band'
])need('Styles',styles,token);

const hourlyIndex=cockpit.indexOf('cockpit-hourly-preview-shell');
const insightIndex=cockpit.indexOf('cockpit-short-insight-grid premium');
if(hourlyIndex<0||insightIndex<0||insightIndex<hourlyIndex)failures.push('Reihenfolge: Tageseckdaten müssen nach der 24-h-Liste bleiben.');

if(failures.length){
  console.error('MID v0.9.31.0 Original-DWD-/Wetterprofil-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('MID v0.9.31.0: amtliches zoombares DWD-Originalprodukt und neues 24-h-Wetterprofil erfolgreich geprüft.');

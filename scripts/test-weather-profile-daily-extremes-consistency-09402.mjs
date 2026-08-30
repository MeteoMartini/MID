import {readFile} from 'node:fs/promises';
const [cockpit,app,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 'function ShortTermRibbon({hours,minutes15,timezone',
 'const temperatureCurvePoints=profileTemperatureSource.map',
 "const visibleTemperatureExtreme=(kind:'max'|'min')",
 "kind==='max'?(current.point.temperature>best.point.temperature?current:best)",
 "label:`${Math.round(item.point.temperature)}°`",
 "temperatureExtremes=[visibleTemperatureExtreme('max'),visibleTemperatureExtreme('min')]",
 '<ShortTermRibbon hours={hours} minutes15={minutes15} timezone={timezone}'
])need('24-h-Profil',cockpit,token);
for(const token of [
 'nightSegments=hours.reduce',
 'nightMinMarkers=nightSegments.flatMap',
 'label:`${Math.round(maximum.temperature)}°`',
 'label:`${Math.round(minimum.temperature)}°`'
])reject('24-h-Profil Altlogik',cockpit,token);
need('App zentrale Prognosedaten',app,'days={displayDays}');
need('App zentrale Prognosedaten',app,'hours={displayHours}');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('24-h-Tmin/Tmax-Konsistenzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('24-h-Wetterprofil markiert Maximum und Minimum robust direkt aus der kanonischen stündlichen 24-h-Kurve; Tageswerte bleiben separat appweit konsistent.');

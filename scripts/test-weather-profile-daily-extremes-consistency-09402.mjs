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
 'function ShortTermRibbon({hours,minutes15,days,timezone',
 'profileDayByDate=useMemo(()=>new Map(days.map(day=>[day.date,day])),[days])',
 'dailyMaxMarkers=chartDayBands.flatMap',
 'dailyMinMarkers=chartDayBands.flatMap',
 'label:`${Math.round(day.max)}°`',
 'label:`${Math.round(day.min)}°`',
 'maximumProxy=dayHours.reduce',
 'minimumProxy=dayHours.reduce',
 'item=matchChartExtreme(maximumProxy.epoch)',
 'item=matchChartExtreme(minimumProxy.epoch)',
 'temperatureExtremes=[...dailyMaxMarkers,...dailyMinMarkers]',
 '<ShortTermRibbon hours={hours} minutes15={minutes15} days={days} timezone={timezone}'
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
console.log('24-h-Wetterprofil verwendet für Tmin/Tmax dieselben zentralen Tageswerte wie der Rest der App; Stundenwerte bestimmen nur die Markerposition im sichtbaren Intervall.');

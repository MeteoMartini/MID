import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(token)=>{if(!cockpit.includes(token))failures.push(`ForecastCockpit fehlt: ${token}`)};const reject=(token)=>{if(cockpit.includes(token))failures.push(`Altvertrag noch vorhanden: ${token}`)};
for(const token of [
 'function shortTermProfileHourlyPoints(hours:Hour[],adjusted:ShortTermForecastPoint[],timezone:string,now=Date.now())',
 'const windowEnd=now+PROFILE_WINDOW_MS',
 'precipitationPresentationHours(hours).filter(hour=>hour.epoch<windowEnd&&hour.epoch+HOUR_MS>now)',
 'precipitationIntervalStartEpoch:start',
 'precipitationIntervalEndEpoch:end',
 "durationMinutes>=55?'1 h':`${durationMinutes} min`",
 'const chartSourcePoints=profileDisplayPoints.length?profileDisplayPoints:hourlyPoints.slice(0,25)',
 'chartStartEpoch=profileNow',
 'chartEndEpoch=profileNow+PROFILE_WINDOW_MS',
 'chartTimeSpan=Math.max(1,chartEndEpoch-chartStartEpoch)',
 'const profileXForEpoch=(epoch:number)=>',
 'precipitationMidX=(precipitationStartX+precipitationEndX)/2'
])need(token);
reject('chartSourcePoints=adjusted.filter(point=>point.offsetMinutes<=24*60)');
reject('chartSourcePoints=points.slice(0,Math.min(points.length,25))');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID 24-h-Wetterprofil Vollfenster-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Wetterprofil läuft exakt von jetzt bis +24 h; Niederschlag nutzt rückblickende Intervallenden und finalisierte 15-Minuten-Daten im ersten Nowcastfenster.');

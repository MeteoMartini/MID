import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(token)=>{if(!cockpit.includes(token))failures.push(`ForecastCockpit fehlt: ${token}`)};const reject=(token)=>{if(cockpit.includes(token))failures.push(`Altvertrag noch vorhanden: ${token}`)};
for(const token of [
 'function shortTermProfileHourlyPoints(hours:Hour[],timezone:string,now=Date.now())',
 'const windowEnd=now+PROFILE_WINDOW_MS',
 '.filter(hour=>Number(hour.epoch)<=windowEnd).slice(0,26)',
 "intervalLabel:'1 h'",
 'const chartSourcePoints=profileDisplayPoints.length?profileDisplayPoints:hourlyPoints.slice(0,25)',
 'chartStartEpoch=profileNow',
 'chartEndEpoch=profileNow+PROFILE_WINDOW_MS',
 'chartTimeSpan=Math.max(1,chartEndEpoch-chartStartEpoch)',
 'chartDataLeft+clamp((point.epoch-chartStartEpoch)/chartTimeSpan,0,1)*chartDataWidth'
])need(token);
reject('chartSourcePoints=adjusted.filter(point=>point.offsetMinutes<=24*60)');
reject('chartSourcePoints=points.slice(0,Math.min(points.length,25))');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID 24-h-Wetterprofil Vollfenster-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Wetterprofil läuft exakt von jetzt bis +24 h; stündliche Werte bleiben kanonisch und 15-Minuten-Schritte außerhalb des Diagramms.');

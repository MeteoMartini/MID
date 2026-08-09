import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(token)=>{if(!cockpit.includes(token))failures.push(`ForecastCockpit fehlt: ${token}`)};const reject=(token)=>{if(cockpit.includes(token))failures.push(`Altvertrag noch vorhanden: ${token}`)};
for(const token of [
 'function shortTermProfileHourlyPoints(hours:Hour[],timezone:string,now=Date.now())',
 'hours.slice(startIndex,startIndex+24)',
 "intervalLabel:'1 h'",
 'const chartSourcePoints=profileHourlyPoints',
 'chartStartEpoch=chartSourcePoints[0]?.epoch??0',
 'chartEndEpoch=chartSourcePoints.at(-1)?.epoch??chartStartEpoch',
 'chartTimeSpan=Math.max(1,chartEndEpoch-chartStartEpoch)',
 'chartPaddingLeft+((point.epoch-chartStartEpoch)/chartTimeSpan)*chartPlotWidth'
])need(token);
reject('chartSourcePoints=adjusted.filter(point=>point.offsetMinutes<=24*60)');
reject('chartSourcePoints=points.slice(0,Math.min(points.length,25))');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID 24-h-Wetterprofil Vollfenster-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Wetterprofil verwendet exakt 24 einstündige Werte ab aktueller Stunde; 15-Minuten-Schritte bleiben außerhalb des Diagramms.');

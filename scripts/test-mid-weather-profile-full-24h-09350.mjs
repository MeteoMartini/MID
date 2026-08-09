import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(token)=>{if(!cockpit.includes(token))failures.push(`ForecastCockpit fehlt: ${token}`)};const reject=(token)=>{if(cockpit.includes(token))failures.push(`Altvertrag noch vorhanden: ${token}`)};
for(const token of [
 'chartSourcePoints=adjusted.filter(point=>point.offsetMinutes<=24*60)',
 'chartStartEpoch=chartSourcePoints[0]?.epoch??0',
 'chartEndEpoch=chartSourcePoints.at(-1)?.epoch??chartStartEpoch',
 'chartTimeSpan=Math.max(1,chartEndEpoch-chartStartEpoch)',
 'chartPaddingLeft+((point.epoch-chartStartEpoch)/chartTimeSpan)*chartPlotWidth',
 'timeLabelStepMs=(chartViewportWidth<=560?6:chartViewportWidth<=860?4:3)*3600000',
 'point.epoch-lastTimeLabelEpoch>=timeLabelStepMs-5*60000'
])need(token);
reject('chartSourcePoints=points.slice(0,Math.min(points.length,25))');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID 24-h-Wetterprofil Vollfenster-Regressionsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: 24-h-Wetterprofil beginnt im ersten verfügbaren Kurzfrist-Zeitschritt und verwendet das vollständige 24-h-Fenster mit zeitproportionaler X-Achse.');

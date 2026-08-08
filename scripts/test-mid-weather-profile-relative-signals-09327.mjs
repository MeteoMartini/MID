import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 "relativePointTime=(point:ShortTermForecastPoint)=>`${dateOnlyFromEpoch(point.epoch,timezone)===todayDate?'heute':'morgen'} ${point.timeLabel}`",
 'const formatProfilePointTime=relativePointTime',
 'formatProfilePointTime(maxFogPoint)',
 'formatProfilePointTime(maxImpactPoint)',
 "label:'Stärkste Einschränkung'"
])need('24-h-Signalkarten',cockpit,token);
reject('Alte Signal-Zeitformatierung',cockpit,"pointDate&&pointDate!==chartPoints[0]?.dateValue?`${point.timeLabel} · ${formatDate(pointDate,{day:'2-digit',month:'2-digit'})}`:point.timeLabel");
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);if(pv!=='0.9.32.7')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.32.7 Relative Signalzeiten fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.7: 24-h-Signalkarten verwenden heute/morgen statt Datum hinter der Uhrzeit.');

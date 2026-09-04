import {readFile} from 'node:fs/promises';
const [cockpit,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 'DWD_WARNING_COLORS',
 'hazards,label as weatherCodeLabel',
 'type HazardItem',
 "function shortTermHazardSignals(hours:Hour[],elevation=0,unit:WindUnit='kn'){return hazards(hours,undefined,elevation,unit)}",
 'function shortTermImpactForInterval(signals:HazardItem[],startEpoch:number,endEpoch:number)',
 'color=DWD_WARNING_COLORS[level]',
 "label:'Stärkste Einschränkung'",
 "className:`impact-level-${maxImpact.level}`",
 "selectedImpact.level>0?selectedImpact.summary:'keine Wettergefahren'",
 'Sichtweite + Nebelrisiko',
 'chartHeight=632'
])need('24-h-Wetterprofil',cockpit,token);
for(const token of [
 'candidates=[{value:thunder',
 "windScore=gustKmh>=105",
 "rate>=15?90:rate>=10?72:rate>=5?50:0",
 'Max. Wetter-Hazard',
 'Wetterberuhigung'
])reject('Eigene Hazard-Sonderlogik',cockpit,token);
for(const token of [
 '.cockpit-weather-profile__signals .impact-level-1{border-color:#e6c229}',
 '.cockpit-weather-profile__signals .impact-level-2{border-color:#ef8d32}',
 '.cockpit-weather-profile__signals .impact-level-3{border-color:#e74a4a}',
 '.cockpit-weather-profile__signals .impact-level-4{border-color:#9b59c6}',
 'linear-gradient(90deg,#48a96f,#e6c229,#ef8d32,#e74a4a,#9b59c6)'
])need('Warnfarben',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID appweite Hazard-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: 24-h-Hazards verwenden appweite DWD/MID-Warnschwellen, Gültigkeitsintervalle und Warnfarben.');

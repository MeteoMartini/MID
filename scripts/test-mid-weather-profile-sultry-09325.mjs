import {readFile} from 'node:fs/promises';
const [cockpit,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: unerwartet ${token}`)};
for(const token of [
 'type ShortTermSultryAssessment=',
 'function shortTermSaturationVaporPressureHpa',
 'function shortTermSultryAssessment(point:ShortTermForecastPoint)',
 'vaporPressure>=18.8',
 'sunshine/3600',
 '1-cloud/100',
 'windMs=Math.max(0,Number(point.wind)||0)*0.514444',
 'windRelief=clamp((windMs-1.5)/6.5,0,1)',
 'felt=Number.isFinite(Number(point.apparent))',
 'borderlineMoisture=vaporPressure>=17.8',
 'windSuppressed=!strongMoisture&&windMs>=7',
 '&&score>=28',
 "{selectedThermal.sultry?'Taupunkt + Schwüle':'Taupunkt'}",
 "{selectedThermal.sultry?' · schwül':''}",
 "replace('kein signifikantes Risiko','kein Risiko')",
 "'keine Wettergefahren'"
])need('Schwüle-/Einzeldatenvertrag',cockpit,token);
for(const token of ['sultry=Number(point.dewPoint)>=17',"'Schwülegrenze erreicht'","'nicht schwül'"])reject('Altvertrag',cockpit,token);
const start=cockpit.indexOf('<div className="cockpit-meteogram-pro__datafield"'),end=cockpit.indexOf('</section>',start),datafield=start>=0&&end>start?cockpit.slice(start,end):'';
if(!datafield)failures.push('Einzeldatenblock nicht gefunden');
if(datafield.includes('kein signifikantes Risiko')&&!datafield.includes("replace('kein signifikantes Risiko','kein Risiko')"))failures.push('Einzeldaten zeigen weiterhin „signifikant“');
if(datafield.includes('keine signifikanten Wettergefahren'))failures.push('Einzeldaten zeigen weiterhin „signifikanten Wettergefahren“');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID v0.9.32.5 Schwüle-/Einzeldatenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.5: Mehrfaktoren-Schwüle und fillerfreie Einzeldaten geprüft.');

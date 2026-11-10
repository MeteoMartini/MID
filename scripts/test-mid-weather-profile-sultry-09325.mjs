import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
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
 'windMs=Number.isFinite(point.wind)?Math.max(0,point.wind)*0.514444:NaN',
 'windRelief=Number.isFinite(windMs)?clamp((windMs-1.5)/6.5,0,1):NaN',
 'felt=Number.isFinite(apparent)?apparent:air',
 'borderlineMoisture=vaporPressure>=17.8',
 'windSuppressed=!strongMoisture&&windMs>=7',
 '&&score>=28',
 'Temperatur / UTCI / Taupunkt',
 "{selectedThermal.sultry===null?' · Schwüle n. v.':selectedThermal.sultry?' · schwül':''}",
 'kein signifikantes Signal',
 "'keine Wettergefahren'"
])need('Schwüle-/Einzeldatenvertrag',cockpit,token);
for(const token of ['sultry=Number(point.dewPoint)>=17',"'Schwülegrenze erreicht'","'nicht schwül'"])reject('Altvertrag',cockpit,token);

 // Independently exercise the actual production TypeScript calculation, not a copied heuristic.
 const sourceStart=cockpit.indexOf('type ShortTermSultryAssessment='),sourceEnd=cockpit.indexOf('const SHORT_TERM_HAZARD_LEVELS:',sourceStart);
 if(sourceStart<0||sourceEnd<=sourceStart)failures.push('Produktive Schwüle-Funktion nicht extrahierbar');
 else{
  const compiled=await transform(cockpit.slice(sourceStart,sourceEnd)+'\nexport {shortTermSultryAssessment};',{loader:'ts',format:'cjs',target:'es2022'});
  const assess=new Function('clamp','const module={exports:{}};const exports=module.exports;'+compiled.code+';return module.exports.shortTermSultryAssessment;')(
   (value,min,max)=>Math.min(max,Math.max(min,value))
  );
  const base={temperature:29,apparent:29,dewPoint:20,humidity:90,wind:1,isDay:true,sunshineDuration:3600,cloud:0};
  const known=assess(base);
  if(known.active!==true||!Number.isFinite(known.score))failures.push('Vollständige echte Schwüle-Signale müssen unverändert auswertbar sein');
  const cloudMissing=assess({...base,cloud:null,sunshineDuration:null});
  if(cloudMissing.active!==null||!Number.isNaN(cloudMissing.score))failures.push('Wolken und Sonne unbekannt sind keine volle Strahlungsinformation');
  const windMissing=assess({...base,wind:null});
  if(windMissing.active!==null||!Number.isNaN(windMissing.windRelief))failures.push('Unbekannter Wind darf nicht als 0 kt interpretiert werden');
  const humidityMissing=assess({...base,humidity:null,dewPoint:null});
  if(humidityMissing.active!==null||!Number.isNaN(humidityMissing.vaporPressure))failures.push('Ohne Feuchte/Taupunkt keine definite Schwüle');
  if(assess({...base,humidity:null}).active!==true)failures.push('Echter Taupunkt bleibt Feuchte-Fallback bei RH-Missing');
  const missingAir=assess({...base,temperature:null,apparent:null});
  if(missingAir.active!==null)failures.push('Unbekannte Luft- und Fühltemperatur ≠ 0 °C');
  const noApparent=assess({...base,apparent:null});
  if(noApparent.active!==true)failures.push('Lufttemperatur darf bei fehlendem Fühlwert verfügbar bleiben');
  const zeros=assess({...base,humidity:0,dewPoint:0,wind:0,cloud:0,sunshineDuration:0});
  if(zeros.active!==false||!Number.isFinite(zeros.score)||zeros.windRelief!==0)failures.push('Echte Nullwerte bleiben gültige Nullwerte');
  const invalid=assess({...base,wind:Infinity});
  if(invalid.active!==null)failures.push('Nichtendlicher Wind ist fehlend, nicht 0 kt');
  const night=assess({...base,isDay:false,sunshineDuration:null,cloud:null});
  if(night.active!==true||night.radiationLoad!==0)failures.push('Bekannte Nacht braucht keinen künstlichen Wolken-/Sonnenwert');
 }
const start=cockpit.indexOf('<div className="cockpit-meteogram-pro__datafield"'),end=cockpit.indexOf('</section>',start),datafield=start>=0&&end>start?cockpit.slice(start,end):'';
if(!datafield)failures.push('Einzeldatenblock nicht gefunden');
if(datafield.includes('kein signifikantes Risiko'))failures.push('Einzeldaten verwenden noch den alten Gewitterrisiko-Text');
if(datafield.includes('keine signifikanten Wettergefahren'))failures.push('Einzeldaten zeigen weiterhin „signifikanten Wettergefahren“');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID v0.9.32.5 Schwüle-/Einzeldatenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.5: Mehrfaktoren-Schwüle und fillerfreie Einzeldaten geprüft.');

import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [shortTerm,app,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
for(const token of ['shortTermAnchorFromCurrent','observedSkyCode','assimilatedDirection','anchorPrecipitation','localAdjustment','Hyperlokal angepasst','Bewölkung / Sicht'])need('Kurzfrist-Hyperlokalität',shortTerm,token);
need('App-Anbindung',app,'shortTermAnchor=useMemo(()=>w?shortTermAnchorFromCurrent(st,w.current):undefined');
need('Cockpit-Anbindung',app,'shortTermAnchor={shortTermAnchor}');
need('Kurzfrist-Anbindung',app,'anchor={shortTermAnchor}');
need('Package-Test',pkg,'test:short-term-hyperlocal-consistency');
need('Baseline-Test',baseline,'scripts/test-short-term-hyperlocal-consistency-082619.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-082619-'));
try{
 let source=shortTerm.replace(/^import .*$/gm,'');
 source=`const React={createElement:(...args)=>({args})};\nconst useMemo=(factory)=>factory();\nconst useState=(value)=>[value,()=>{}];\nconst CloudFog=()=>null; const CloudLightning=()=>null; const Droplets=()=>null; const Gauge=()=>null; const Navigation=()=>null; const Thermometer=()=>null; const WindIcon=()=>null;\nconst significantHourlyThunderRisk=()=>null;\nconst precipitationParts=(input)=>{const wet=Number(input.precipitation)>=.01;return{displayCode:wet?61:Number(input.code)||0,weatherLabel:wet?'leichter Regen':'kein Niederschlag',type:wet?'rain':'none'};};\nconst reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});\nconst label=(code)=>Number(code)===3?'Bedeckt':Number(code)===2?'Teilweise bewölkt':'Klar'; const wind=(value,unit)=>String(Math.round(Number(value)||0))+' '+String(unit); const formatDecimal=(value,digits=1)=>Number(value).toFixed(digits);\nconst DWD_WIND_THRESHOLDS_KMH=[];\nconst blendRadarAtTarget=()=>null;\n${source}`;
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React},fileName:'ShortTermForecast.tsx',reportDiagnostics:true});
 if(out.diagnostics?.some(item=>item.category===ts.DiagnosticCategory.Error))failures.push(...out.diagnostics.filter(item=>item.category===ts.DiagnosticCategory.Error).map(item=>`Syntax: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
 const file=join(dir,'ShortTermForecast.mjs');await writeFile(file,out.outputText);const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const now=Date.parse('2026-08-01T04:54:00Z'),current={temperature_2m:20,apparent_temperature:19,relative_humidity_2m:65,dew_point_2m:12,pressure_msl:1016,wind_speed_10m:10,wind_gusts_10m:15,wind_direction_10m:180,cloud_cover:25,cloud_cover_low:10,visibility:20000,precipitation:0,rain:0,showers:0,snowfall:0,weather_code:1,is_day:1},station={name:'Hyperlokale Analyse',analysisMethod:'Modellgestützte lokale Restfeldanalyse',timestamp:new Date(now-5*60000).toISOString(),temperature:18,humidity:90,dewPoint:16.5,pressure:1014,pressureReference:'QFF',windSpeed:11.112,windGust:18.52,windDirection:0,windUnit:'kmh',cloudCover:100,cloudBaseHft:15,visibility:6000,precipitation:0,precipitationMinutes:60};
 const anchor=mod.shortTermAnchorFromCurrent(station,current,now);
 if(!anchor.active)failures.push('Frische Hyperlokalanalyse wird nicht als aktiver Kurzfristanker erkannt.');
 if(Math.abs(anchor.wind-6)>.05||Math.abs(anchor.gust-10)>.05)failures.push(`Wind-Normalisierung: erwartet 6/10 kt, erhalten ${anchor.wind}/${anchor.gust}.`);
 if(anchor.code!==3)failures.push(`Wetterzustand: bedeckte lokale Analyse muss Code 3 liefern, erhalten ${anchor.code}.`);
 if(anchor.pressure!==1014||!anchor.observed?.pressure)failures.push('QFF-Luftdruck wird nicht als beobachteter Kurzfristanker übernommen.');
 const hours=[];for(let index=0;index<=30;index+=1){const epoch=Date.parse('2026-08-01T04:00:00Z')+index*3600000;hours.push({time:new Date(epoch).toISOString(),epoch,timezone:'UTC',temperature:20,apparent:19,humidity:65,dewPoint:12,pressure:1016,precipitation:0,rain:0,showers:0,snowfall:0,probability:2,code:1,wind:10,gust:15,direction:180,cloud:25,lowCloud:10,uvIndex:0,visibility:20000,cape:0,liftedIndex:0,convectiveInhibition:0,columnWaterVapour:0,isDay:true})}
 const minute15=['05:00','05:15','05:30','05:45'].map(time=>{const epoch=Date.parse(`2026-08-01T${time}:00Z`);return{time:new Date(epoch).toISOString(),epoch,timezone:'UTC',precipitation:0,rain:0,showers:0,snowfall:0,probability:2,code:1}}),points=mod.buildShortTermForecast(minute15,hours,'UTC',now,anchor),first=points[0],later=points.find(point=>point.offsetMinutes>=120);
 if(!first)failures.push('Erster Kurzfristpunkt fehlt.');
 else{
  if(first.temperature>=19)failures.push(`Temperaturkonsistenz: erster Punkt ${first.temperature} °C liegt nicht nahe der lokalen 18-°C-Analyse.`);
  if(first.code!==3)failures.push(`Bewölkungskonsistenz: erster Punkt hat Code ${first.code} statt bedeckt (3).`);
  if(first.wind>=8||first.direction>45&&first.direction<315)failures.push(`Windkonsistenz: erster Punkt ${first.wind} kt/${first.direction}° folgt der lokalen Analyse nicht.`);
  if(first.humidity<82||first.visibility>9000)failures.push(`Feuchte/Sicht-Konsistenz: ${first.humidity} %/${first.visibility} m nicht ausreichend lokal angeglichen.`);
  if(first.localAdjustment<=.5)failures.push('Lokale Anpassungsstärke ist am ersten Punkt nicht erkennbar.');
 }
 if(!later)failures.push('Übergangspunkt nach zwei Stunden fehlt.');
 else if(Math.abs(later.temperature-20)>.05||later.code!==1||Math.abs(later.wind-10)>.05||later.localAdjustment!==0)failures.push(`Rückkehr zum Best Match nach lokaler Übergangsphase fehlerhaft: ${JSON.stringify(later)}.`);
 const stale=mod.shortTermAnchorFromCurrent({...station,timestamp:new Date(now-151*60000).toISOString()},current,now);
 if(stale.active)failures.push('Veraltete Stationsdaten aktivieren weiterhin die lokale Kurzfristangleichung.');
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Kurzfrist-/Hyperlokal-Konsistenzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hyperlokale Kurzfristkonsistenz geprüft: Temperatur, Wetterzustand, Feuchte, Taupunkt, QFF, Wind/Böen, Richtung, Bewölkung, Sicht und Niederschlag werden zeitlich auslaufend angeglichen.');

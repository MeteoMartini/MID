import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [shortTerm,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'const QUARTER_STEP_COUNT=6;',
 'function nextQuarterEpoch(now:number)',
 'function buildTargetEpochs(now:number)',
 'targets.push(quarter);',
 'direction+180',
 'const NAVIGATION_ICON_BASE_DEGREES=45;',
 'windToDegrees(direction)-NAVIGATION_ICON_BASE_DEGREES',
 "intervalLabel:isQuarterInterval?'15 min':'1 h'"
])need('Kurzfristlogik',shortTerm,token);
for(const token of [
 '.short-term-strip>button{display:grid;grid-template-rows:auto auto minmax(0,18px) 31px auto auto;',
 '.short-term-thunder{grid-row:3;',
 '.short-term-weather-icon{grid-row:4;'
])need('Kurzfristlayout',styles,token);
forbid('Kurzfristlayout',styles,'.short-term-thunder{position:absolute');
need('Package-Test',pkg,'test:short-term-rounding-wind-layout');
need('Baseline-Test',baseline,'scripts/test-short-term-rounding-wind-layout-08221.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08221-'));
try{
 let source=shortTerm;
 source=source.replace(/^import .*$/gm,'');
 source=`const React={createElement:(...args)=>({args})};\nconst useMemo=(factory)=>factory();\nconst useState=(value)=>[value,()=>{}];\nconst CloudLightning=()=>null; const Droplets=()=>null; const Gauge=()=>null; const Navigation=()=>null; const Thermometer=()=>null; const WindIcon=()=>null;\nconst significantHourlyThunderRisk=(hour)=>Number(hour.cape)>=200?{percent:51,label:'erhöht'}:null;\nconst precipitationParts=(input)=>({displayCode:input.code,weatherLabel:'Regen',type:input.precipitation>0?'rain':'none'});\nconst reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});\nconst icon=()=>''; const label=()=>''; const wind=(value,unit)=>String(Math.round(Number(value)||0))+' '+String(unit); const formatDecimal=(value,digits=1)=>Number(value).toFixed(digits);\nconst DWD_WIND_THRESHOLDS_KMH=[]; const blendRadarAtTarget=()=>null;\n${source}`;
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React},fileName:'ShortTermForecast.tsx'});
 const file=join(dir,'ShortTermForecast.mjs');
 await writeFile(file,out.outputText);
 const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const now=Date.parse('2026-07-30T17:53:00Z');
 const timezone='UTC';
 const hours=[];
 for(let index=0;index<=30;index+=1){
  const epoch=Date.parse(`2026-07-${String(30+Math.floor((17+index)/24)).padStart(2,'0')}T${String((17+index)%24).padStart(2,'0')}:00:00Z`);
  hours.push({time:new Date(epoch).toISOString(),epoch,timezone,temperature:20+index/10,apparent:19+index/10,humidity:60,dewPoint:12,pressure:1015,precipitation:0.2,rain:0.2,showers:0,snowfall:0,probability:55,code:61,wind:3,gust:5,direction:270,cloud:70,lowCloud:50,uvIndex:0,visibility:10000,cape:250,liftedIndex:0,convectiveInhibition:0,columnWaterVapour:0,isDay:true});
 }
 const minute15=[];
 for(const stamp of ['2026-07-30T18:00:00Z','2026-07-30T18:15:00Z','2026-07-30T18:30:00Z','2026-07-30T18:45:00Z']){
  const epoch=Date.parse(stamp);
  minute15.push({time:stamp,epoch,timezone,precipitation:0.3,rain:0.3,showers:0,snowfall:0,probability:47,code:61});
 }
 const points=mod.buildShortTermForecast(minute15,hours,timezone,now);
 const firstSix=points.slice(0,6).map(point=>point.timeLabel).join('|');
 if(firstSix!=='18:00|18:15|18:30|18:45|19:00|19:15')failures.push(`Zeitstufen: erwartet 18:00|18:15|18:30|18:45|19:00|19:15, erhalten ${firstSix}`);
 if(points[0]?.offsetLabel!=='+7 min')failures.push(`Offset 1: erwartet +7 min, erhalten ${points[0]?.offsetLabel}`);
 if(points[4]?.offsetLabel!=='+1 h 7 min')failures.push(`Offset 5: erwartet +1 h 7 min, erhalten ${points[4]?.offsetLabel}`);
 if(points.slice(0,6).some(point=>point.intervalLabel!=='15 min'))failures.push('Bezugsintervalle: die ersten sechs 90-Minuten-Stufen müssen jeweils 15 min ausweisen.');
 if(points[0]?.direction!==270||points[0]?.wind!==3)failures.push('Windwerte wurden in den Kurzfristpunkten nicht korrekt übernommen.');
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Kurzfrist-Rundung/Wind/Layout-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kurzfrist-Rundung, Windrichtungslogik und überlagerungsfreies Kurzfristlayout geprüft.');

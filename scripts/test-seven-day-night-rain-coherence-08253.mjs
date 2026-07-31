import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [app,nightSource,warningSource,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastNight.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
for(const token of [
 "import {followingNightIsTropical} from './forecastNight';",
 'sevenDayPoint(day:Day,nextDay:Day|undefined',
 'tropicalNight:followingNightIsTropical(day,nextDay,allHours)',
 'forecastDays[index+1]'
])need('7-Tage-Trend',app,token);
for(const token of [
 'FOLLOWING_NIGHT_START_HOUR=20',
 'FOLLOWING_NIGHT_END_HOUR=8',
 'const fallback=Number(nextDay.min)',
 'minimum>=20'
])need('Folgenacht',nightSource,token);
for(const token of [
 'function dailyWarningHasMatchingPrecipitation',
 "signal.kind!=='heavyRain'&&signal.kind!=='continuousRain'",
 'total<.05||wetHours===0',
 "signal.kind==='continuousRain'&&total<1&&wetHours<2",
 '.filter(signal=>dailyWarningHasMatchingPrecipitation(signal,daySamples))'
])need('Warnkonsistenz',warningSource,token);
need('Package-Test',pkg,'test:seven-day-night-rain-coherence');
need('Baseline-Test',baseline,'scripts/test-seven-day-night-rain-coherence-08253.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08253-'));
try{
 const compile=async(name,source)=>{
  const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:`${name}.ts`});
  const file=join(dir,`${name}.mjs`);await writeFile(file,out.outputText);return import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 };
 const night=await compile('forecastNight',nightSource);
 const friday={date:'2026-07-31',min:21,max:31},saturday={date:'2026-08-01',min:18,max:29};
 const nightHours=[];
 for(const [date,start,end,base] of [['2026-07-31',20,23,22],['2026-08-01',0,8,19]])for(let hour=start;hour<=end;hour++)nightHours.push({time:`${date}T${String(hour).padStart(2,'0')}:00`,temperature:hour===6?18:base});
 const minimum=night.followingNightMinimum(friday,saturday,nightHours);
 if(minimum!==18)failures.push(`Folgenacht-Minimum: erwartet 18 °C, erhalten ${minimum}`);
 if(night.followingNightIsTropical(friday,saturday,nightHours))failures.push('Tropennacht wurde fälschlich aus dem Freitag-Tagesminimum statt aus der Nacht Freitag/Samstag abgeleitet.');
 const warmHours=nightHours.map(hour=>({...hour,temperature:21}));
 if(!night.followingNightIsTropical(friday,{...saturday,min:21},warmHours))failures.push('Echte Folgenacht mit mindestens 20 °C wurde nicht als Tropennacht erkannt.');

 const warnings=await compile('dwdWarnings',warningSource);
 const samples=[];
 const start=Date.parse('2026-08-06T00:00:00Z');
 for(let index=0;index<96;index++){
  const epoch=start+index*3600000,date=new Date(epoch),dry=index<24,rain=dry?0:1;
  samples.push({time:date.toISOString().slice(0,13)+':00',epoch,temperature:20,apparent:20,precipitation:rain,rain,showers:0,snowfall:0,gust:5,code:dry?0:61,visibility:10000,isDay:index%24>=6&&index%24<=20});
 }
 const dryDay=warnings.summarizeDwdWarningsForDay(samples,'2026-08-06',50);
 if(dryDay.some(signal=>signal.kind==='heavyRain'||signal.kind==='continuousRain'))failures.push('Trockener Donnerstag erhält weiterhin eine aus späterem Niederschlag vorgezogene Regenwarnung.');
 const wetDay=warnings.summarizeDwdWarningsForDay(samples,'2026-08-07',50);
 if(!wetDay.some(signal=>signal.kind==='continuousRain'))failures.push('Tatsächlich nasser Folgetag verliert die berechtigte Dauerregenwarnung.');
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('7-Tage-Nacht-/Regenkonsistenz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('7-Tage-Trend geprüft: Tropennacht bezieht sich auf die folgende Nacht; Regenwarnungen bleiben mit dem angezeigten Kalendertag konsistent.');

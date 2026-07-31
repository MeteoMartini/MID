import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const source=await readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8');
const pkg=await readFile(new URL('../package.json',import.meta.url),'utf8');
const baseline=await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8');
const failures=[];
const need=(text,token)=>{if(!text.includes(token))failures.push(`fehlt: ${token}`)};
for(const token of [
 'function tideSeriesForDate(data:MarineForecast|undefined,date:string)',
 'fullDay=minutes.length>0&&Math.min(...minutes)<=60&&Math.max(...minutes)>=1380',
 'primary=tideSeriesForDate(data,date)',
 'Gezeiten werden unabhängig vom angezeigten Aktivitätszeitfenster für den gesamten jeweiligen Kalendertag aufgeführt.'
])need(source,token);
need(pkg,'test:water-tides-full-calendar-day');
need(baseline,'scripts/test-water-tides-full-calendar-day-08254.mjs');

const start=source.indexOf("type TideEvent=");
const endToken='function tideAnalysis(';
const end=source.indexOf(endToken);
if(start<0||end<0)failures.push('Hilfslogik konnte nicht für den dynamischen Test isoliert werden.');
else{
 const isolated=`type MarineForecast={hourly:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};\n${source.slice(start,end)}\nexport {tideEventsForDate};\n`;
 const dir=await mkdtemp(join(tmpdir(),'mid-tides-08254-'));
 try{
  const output=ts.transpileModule(isolated,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'tides.ts'}).outputText;
  const file=join(dir,'tides.mjs');await writeFile(file,output);
  const {tideEventsForDate}=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
  const date='2026-08-06';
  const hourlyTimes=[],hourlyLevels=[];
  for(let hour=0;hour<24;hour+=1){
   hourlyTimes.push(`${date}T${String(hour).padStart(2,'0')}:00`);
   hourlyLevels.push(Math.cos((hour-3)*Math.PI/6));
  }
  const minuteTimes=[],minuteLevels=[];
  for(let minute=12*60;minute<24*60;minute+=15){
   minuteTimes.push(`${date}T${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`);
   minuteLevels.push(Math.cos((minute/60-15)*Math.PI/6));
  }
  const data={hourly:{time:hourlyTimes,sea_level_height_msl:hourlyLevels},minutely_15:{time:minuteTimes,sea_level_height_msl:minuteLevels}};
  const events=tideEventsForDate(data,date);
  if(events.length<3)failures.push(`Ganztagsauswertung: zu wenige Wendepunkte (${events.length}).`);
  if(!events.some(event=>event.time<`${date}T12:00`))failures.push('Ganztagsauswertung: Wendepunkte vor dem verkürzten Aktivitäts-/Minutely-Zeitfenster fehlen.');
  if(events.some(event=>event.time.slice(0,10)!==date))failures.push('Ganztagsauswertung: Ereignis eines anderen Kalendertags enthalten.');
 }finally{await rm(dir,{recursive:true,force:true})}
}

if(failures.length){console.error('Ganztägige Gezeitenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gezeiten im Wasserwetter-Verlauf werden für den vollständigen jeweiligen Kalendertag und unabhängig vom dargestellten Zeitfenster ermittelt.');

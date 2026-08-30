import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript-strada')

const [water,weather,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};
for(const token of [
 'function movingAverage(values:number[],radius:number)',
 'minimumProminence=Math.max(.0005,Math.min(.02,range*.0125))',
 'function tideSeriesSelectionsForDate(data:MarineForecast|undefined,date:string)',
 'for(const selection of selections.slice(1))'
])need('Gezeitenlogik',water,token);
for(const token of [
 "forecast_minutely_15:String(8*24*4)",
 "minutely_15:'sea_level_height_msl'"
])need('Marineabruf',weather,token);
need('Package-Test',pkg,'test:water-tide-turning-points');
need('Baseline-Test',baseline,'scripts/test-water-tide-turning-points-08264.mjs');

const start=water.indexOf('type TideEvent=');
const end=water.indexOf('function tideAnalysis(');
if(start<0||end<0)failures.push('Gezeiten-Hilfslogik konnte nicht isoliert werden.');
else{
 const isolated=`type MarineForecast={hourly:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};\n${water.slice(start,end)}\nexport {tideEventsForDate};\n`;
 const dir=await mkdtemp(join(tmpdir(),'mid-tides-08264-'));
 try{
  const output=ts.transpileModule(isolated,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'tides.ts'}).outputText;
  const file=join(dir,'tides.mjs');await writeFile(file,output);
  const {tideEventsForDate}=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
  const date='2026-08-06',startMs=Date.parse('2026-08-05T18:00:00Z'),endMs=Date.parse('2026-08-07T06:00:00Z');
  const minuteTimes=[],minuteLevels=[];
  for(let ms=startMs;ms<=endMs;ms+=15*60000){const d=new Date(ms),hours=(ms-Date.parse('2026-08-06T00:00:00Z'))/3600000;minuteTimes.push(d.toISOString().slice(0,16));minuteLevels.push(.12+.08*Math.cos((hours-3)*2*Math.PI/12.42));}
  const hourlyTimes=[],hourlyLevels=[];
  for(let ms=startMs;ms<=endMs;ms+=60*60000){const d=new Date(ms),hours=(ms-Date.parse('2026-08-06T00:00:00Z'))/3600000;hourlyTimes.push(d.toISOString().slice(0,16));hourlyLevels.push(.12+.08*Math.cos((hours-3)*2*Math.PI/12.42));}
  const data={hourly:{time:hourlyTimes,sea_level_height_msl:hourlyLevels},minutely_15:{time:minuteTimes,sea_level_height_msl:minuteLevels}};
  const events=tideEventsForDate(data,date);
  if(events.length<3)failures.push(`Niedrige Tidenamplitude: nur ${events.length} Wendepunkte erkannt.`);
  if(!events.some(event=>event.kind==='high')||!events.some(event=>event.kind==='low'))failures.push('Niedrige Tidenamplitude: Flut- oder Ebbe-Wendepunkt fehlt.');
  if(events.some(event=>event.time.slice(0,10)!==date))failures.push('Niedrige Tidenamplitude: Ereignis außerhalb des Tages enthalten.');

  const flatMinute={...data,minutely_15:{time:minuteTimes,sea_level_height_msl:minuteTimes.map(()=>.1)}};
  const fallback=tideEventsForDate(flatMinute,date);
  if(fallback.length<3)failures.push(`Stundenfallback: nur ${fallback.length} Wendepunkte erkannt.`);
 }finally{await rm(dir,{recursive:true,force:true})}
}

if(failures.length){console.error('Gezeiten-Wendepunktprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gezeiten-Wendepunkte werden auch bei flachen 15-Minuten-Kurven erkannt; bei ungeeigneten Feindaten greift der Stundenfallback.');

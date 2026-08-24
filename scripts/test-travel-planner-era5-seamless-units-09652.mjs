import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const [app,panel,logic,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),readFile('src/TravelPlannerPanel.tsx','utf8'),readFile('src/travelPlanner.ts','utf8'),readFile('package.json','utf8'),readFile('MID_BASELINE.json','utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerwünscht ${token}`)};

for(const token of [
 "const BASE_CACHE_PREFIX='mid:travel-climate:1991-2020:v3:'",
 "models:'era5_seamless'",
 "temperature_unit:'celsius'",
 "precipitation_unit:'mm'",
 "wind_speed_unit:'kn'",
 "source:'Open-Meteo ERA5-Seamless · ERA5-Land + ERA5'",
 'assertTravelHistoricalPayload(payload)',
 'Historische Sonnenscheindauer ist für diese Quelle unplausibel',
 'Historische Windreihe ist für diese Quelle unplausibel',
 "if(raw===null||raw===undefined||raw==='')return Number.NaN"
])need('Klimadatenquelle',logic,token);
const baseRequest=logic.slice(logic.indexOf("const request=sharedRequest<TravelClimateDataset>(baseKey"),logic.indexOf("if(!includeSnowDepth)return dataset"));
forbid('Basisabruf',baseRequest,"models:'era5_land'");
need('Schneehöhe bleibt ERA5-Land',logic,"hourly:'snow_depth',timezone:'auto',models:'era5_land'");

for(const token of [
 "type Props={initialLocation:Location;advancedMode:boolean;unit:WindUnit}",
 "import {label,searchLocations,wind,type Location,type WindUnit} from './weather'",
 'maxWindKt:windInputToKnots(windLimit,unit)',
 'wind(active.summary.windMaxMean,unit)',
 'ERA5-Seamless · 1991–2020',
 'ERA5-Seamless kombiniert die feinere ERA5-Land-Temperatur mit ERA5 für Niederschlag, Sonne und Wind'
])need('Einheiten/Anzeige',panel,token);
need('App-Einheitenweitergabe',app,"<MemoLazyTravelPlanner initialLocation={loc!} advancedMode={layoutMode==='advanced'} unit={unit}/>");

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const versionAtLeast=(value,minimum)=>{const current=String(value).split('.').map(Number),floor=String(minimum).split('.').map(Number),length=Math.max(current.length,floor.length);for(let index=0;index<length;index++){const delta=(current[index]||0)-(floor[index]||0);if(delta)return delta>0}return true};
if(!versionAtLeast(pkg.version,'0.9.65.2'))failures.push(`Version erwartet mindestens 0.9.65.2, ist ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push('Baseline-Version nicht synchron.');
if(!(baseline.requiredRegressionTests||[]).includes('scripts/test-travel-planner-era5-seamless-units-09652.mjs'))failures.push('Neue Reiseplaner-Regression fehlt in der Baseline.');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-seamless-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/travelPlanner.ts')],{cwd:root,encoding:'utf8'});
 if(compile.status!==0)failures.push(`TypeScript: ${compile.stdout||compile.stderr}`);
 else{
  const compiledPath=path.join(compileDir,'travelPlanner.js');
  const compiledSource=(await readFile(compiledPath,'utf8')).replace("from './cachePolicy'","from './cachePolicy.js'").replace("from './openMeteoGuard'","from './openMeteoGuard.js'");
  await writeFile(compiledPath,compiledSource);
  const module=await import(`${pathToFileURL(compiledPath).href}?v=${Date.now()}`);
  const daily={time:[],weather_code:[],temperature_2m_max:[],temperature_2m_min:[],precipitation_sum:[],sunshine_duration:[],daylight_duration:[],wind_speed_10m_max:[],snowfall_sum:[]};
  for(let year=1991;year<=2020;year++)for(let day=18;day<=27;day++){
   daily.time.push(`${year}-10-${day}`);daily.weather_code.push(1);daily.temperature_2m_max.push(23);daily.temperature_2m_min.push(17);daily.precipitation_sum.push(day===23?2:0);daily.sunshine_duration.push(6.5*3600);daily.daylight_duration.push(11*3600);daily.wind_speed_10m_max.push(12);daily.snowfall_sum.push(0);
  }
  const dataset=module.aggregateTravelClimate({latitude:35.4,longitude:24.65,elevation:10,timezone:'Europe/Athens',daily});
  const summary=module.summarizeTravelPeriod(module.travelPeriod(dataset,'2026-10-18','2026-10-27'));
  const narrative=module.travelNarrative(summary,'balanced',false);
  if(!narrative.includes('sonnig')||narrative.includes('sonnenarm'))failures.push(`Sonnen-Narrativ unplausibel: ${narrative}`);
  if(Math.abs(summary.windMaxMean-12)>.01)failures.push(`Wind ist nicht in kanonischen Knoten erhalten: ${summary.windMaxMean}`);
  const nullable={...daily,sunshine_duration:daily.sunshine_duration.map(()=>null),wind_speed_10m_max:daily.wind_speed_10m_max.map(()=>null)};
  const nullableDataset=module.aggregateTravelClimate({latitude:35.4,longitude:24.65,elevation:10,timezone:'Europe/Athens',daily:nullable});
  if(nullableDataset.days['10-18']?.sunshineMeanHours===0||nullableDataset.days['10-18']?.windMaxMean===0)failures.push('API-Nullwerte werden erneut als meteorologische 0 interpretiert.');
  const constrained=module.bestTravelWindows(dataset,'2026-10-18','2026-10-27',5,'balanced',{maxWindKt:10,maxWindLabel:'10 kt'},1)[0];
  if(!constrained?.unmet.some(text=>text.includes('10 kt')))failures.push(`Wind-Grenzwert nicht in gewählter Einheit beschrieben: ${JSON.stringify(constrained?.unmet)}`);
 }
}finally{await rm(compileDir,{recursive:true,force:true})}

if(failures.length){console.error('Reiseplaner ERA5-Seamless/Einheiten fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Reiseplaner geprüft: ERA5-Seamless-Basis, ERA5-Land-Schneehöhe, Plausibilitätsguards, Cache-Migration und appweite Windeinheit sind konsistent.');

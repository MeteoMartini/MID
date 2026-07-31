import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [logic,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/travelPlanner.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/TravelPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const CACHE_MAX_AGE=3*365*86400000;",
 "const CLIMATE_GRID_DEGREES=.1;",
 "const CLIMATE_ELEVATION_STEP=250;",
 "const memoryCache=new Map<string,unknown>();",
 "const inFlightRequests=new Map<string,Promise<unknown>>();",
 "async function sharedRequest<T>",
 "async function waitForShared<T>",
 "daily:DAILY_VARIABLES",
 "if(!includeSnowDepth)return dataset;"
])need('Abrufbudget-Logik',logic,token);
for(const forbidden of ['temperature_2m_mean','precipitation_hours','cloud_cover_mean'])if(logic.includes(`DAILY_VARIABLES=[`)&&logic.slice(logic.indexOf('DAILY_VARIABLES=['),logic.indexOf('].join',logic.indexOf('DAILY_VARIABLES=['))).includes(forbidden))failures.push(`Unnötige Basisvariable weiterhin aktiv: ${forbidden}`);
for(const token of [
 "const SNOW_DETAIL_KEY='mid:travel-planner:detailed-snow'",
 'Detaillierte Schneehöhe laden',
 'Optionaler zusätzlicher Abruf',
 "const includeSnowDepth=mode==='flexible'&&(detailedSnow||Number.isFinite(constraints.minSnowDepthCm))",
 'Pro etwa 10-km-Klimaraster erfolgt höchstens ein direkter Basisabruf',
 'Der MID-Worker wird dafür nicht verwendet.'
])need('Abrufbudget-Oberfläche',panel,token);
need('Abrufbudget-Design',styles,'.travel-preference .travel-snow-detail{');
need('Package-Test',pkg,'test:travel-request-budget');
need('Baseline-Test',baseline,'scripts/test-travel-planner-request-budget-08191.mjs');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-budget-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/travelPlanner.ts')],{cwd:path.resolve('.'),encoding:'utf8'});
 if(compile.status!==0)failures.push(`TypeScript: ${compile.stdout||compile.stderr}`);
 else{
  const compiledPath=path.join(compileDir,'travelPlanner.js');
  const compiledSource=(await readFile(compiledPath,'utf8')).replace("from './cachePolicy'","from './cachePolicy.js'");
  await writeFile(compiledPath,compiledSource);
  const module=await import(`${pathToFileURL(compiledPath).href}?v=${Date.now()}`);
  let fetchCount=0,lastUrl='';
  globalThis.fetch=async url=>{
   fetchCount++;lastUrl=String(url);
   const daily={time:[],weather_code:[],temperature_2m_max:[],temperature_2m_min:[],precipitation_sum:[],sunshine_duration:[],daylight_duration:[],wind_speed_10m_max:[],snowfall_sum:[]};
   for(let year=1991;year<=2020;year++){
    daily.time.push(`${year}-07-01`);daily.weather_code.push(1);daily.temperature_2m_max.push(25);daily.temperature_2m_min.push(15);daily.precipitation_sum.push(0);daily.sunshine_duration.push(8*3600);daily.daylight_duration.push(16*3600);daily.wind_speed_10m_max.push(18);daily.snowfall_sum.push(0);
   }
   return{ok:true,status:200,json:async()=>({latitude:50.8,longitude:7,elevation:0,timezone:'Europe/Berlin',daily})};
  };
  const first={latitude:50.81,longitude:7.04,elevation:110},nearby={latitude:50.82,longitude:7.03,elevation:120};
  const [a,b]=await Promise.all([module.fetchTravelClimatology(first,false),module.fetchTravelClimatology(first,false)]);
  if(fetchCount!==1)failures.push(`Parallele identische Abrufe nicht entdoppelt (${fetchCount})`);
  await module.fetchTravelClimatology(nearby,false);
  if(fetchCount!==1)failures.push(`Nahes Ziel nutzte Klimaraster-Cache nicht (${fetchCount})`);
  if(!a.days['07-01']||!b.days['07-01'])failures.push('Klimadatensatz aus Sparabruf unvollständig.');
  const query=new URL(lastUrl).searchParams.get('daily')||'';
  for(const forbidden of ['temperature_2m_mean','precipitation_hours','cloud_cover_mean','relative_humidity_2m_mean'])if(query.includes(forbidden))failures.push(`Unnötige Variable tatsächlich angefordert: ${forbidden}`);
 }
}finally{await rm(compileDir,{recursive:true,force:true})}

if(failures.length){console.error('Reisewetter-Abrufbudget fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Reisewetter-Abrufbudget geprüft: keine Worker-Nutzung, ein Basisabruf je Klimaraster, In-Flight-Entdopplung, Dreijahrescache und optionale Schneehöhe.');

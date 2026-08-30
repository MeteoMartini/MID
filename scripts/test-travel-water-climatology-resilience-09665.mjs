import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const [travel,panel,worker,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/travelPlanner.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('worker-src/40-aviation-router.js','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

assert.ok(travel.includes("const WATER_CACHE_PREFIX='mid:travel-water-climate:noaa-oisst-1991-2020:v5:'"),'Defekter ERA5-Ocean-/Negativcache wird nicht sicher invalidiert.');
assert.ok(travel.includes("fetchWorkerJson<TravelWaterWorkerPayload>('travel-water-climate'"),'CORS-sicherer Workerpfad für NOAA OISST fehlt.');
assert.ok(travel.includes("payload.schema!=='mid.travel-water-climate.v1'"),'Ein veralteter Worker kann unbemerkt als gültiger SST-Pfad durchgehen.');
assert.ok(!travel.includes('WATER_REFERENCE_YEARS')&&!travel.includes("models:'era5_ocean'")&&!travel.includes('MARINE_ARCHIVE_ENDPOINT'),'Der real vollständig leere ERA5-Ocean-SST-Pfad ist weiterhin aktiv.');
assert.ok(travel.includes('if(!payload.available){return')&&travel.includes('writeCache(key,value)'),'Nur positive NOAA-SST-Ergebnisse dürfen langfristig gespeichert werden.');
assert.ok(panel.includes("[waterError,setWaterError]=useState('')"),'Technische SST-Fehler bleiben in der Oberfläche unsichtbar.');
assert.ok(panel.includes('MID versucht die SST beim nächsten Abruf erneut.'),'SST-Wiederholungs-/Fehlerhinweis fehlt.');
assert.ok(worker.includes('const NOAA_OISST_MAX_DISTANCE_KM=80;'),'Küstenradius für das NOAA-0,25°-Raster fehlt.');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-water-resilience-'));
try{
 const tsc=path.resolve('node_modules','.bin',process.platform==='win32'?'tsc.cmd':'tsc'),compile=spawnSync(tsc,['--ignoreConfig','--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/vite-env.d.ts'),path.resolve('src/travelPlanner.ts')],{cwd:root,encoding:'utf8'});
 assert.equal(compile.status,0,`TypeScript travelPlanner: ${compile.stdout||compile.stderr}`);
 const compiledPath=path.join(compileDir,'travelPlanner.js');
 const compiledSource=(await readFile(compiledPath,'utf8')).replace("from './cachePolicy'","from './cachePolicy.js'").replace("from './openMeteoGuard'","from './openMeteoGuard.js'").replace("from './workerClient'","from './workerClientMock.js'");
 await writeFile(compiledPath,compiledSource);
 await writeFile(path.join(compileDir,'workerClientMock.js'),"export async function fetchWorkerJson(){globalThis.__midWaterFetchCount=(globalThis.__midWaterFetchCount||0)+1;const value=globalThis.__midWaterPayload;if(value instanceof Error)throw value;return value;}\n");
 const module=await import(`${pathToFileURL(compiledPath).href}?v=${Date.now()}`);
 globalThis.__midWaterFetchCount=0;
 globalThis.__midWaterPayload={schema:'mid.travel-water-climate.v1',available:true,temperature:22.66,gridDistanceKm:3.6,grid:{latitude:35.375,longitude:24.625},days:10,referencePeriod:'1991–2020',source:'NOAA OISST v2.1'};
 const coastal=await module.fetchTravelWaterClimatology({latitude:35.4,longitude:24.65},'2026-10-18','2026-10-27');
 assert.deepEqual(coastal,{temperature:22.66,gridDistanceKm:3.6,referencePeriod:'1991–2020',days:10,source:'NOAA OISST v2.1'},'Valider NOAA-OISST-Workerwert wird nicht unverändert in die Reiseauswertung übernommen.');

 globalThis.__midWaterPayload={schema:'mid.travel-water-climate.v1',available:false,temperature:null,gridDistanceKm:null,grid:null,days:10,referencePeriod:'1991–2020',source:'NOAA OISST v2.1'};
 const unavailable=await module.fetchTravelWaterClimatology({latitude:48.1,longitude:11.6},'2026-10-18','2026-10-27');
 assert.equal(unavailable,null,'Binnenland darf keine erfundene Wassertemperatur erhalten.');
 const afterNegative=globalThis.__midWaterFetchCount;
 globalThis.__midWaterPayload={schema:'mid.travel-water-climate.v1',available:true,temperature:19.4,gridDistanceKm:8.1,grid:{latitude:48.125,longitude:11.625},days:10,referencePeriod:'1991–2020',source:'NOAA OISST v2.1'};
 const recovered=await module.fetchTravelWaterClimatology({latitude:48.1,longitude:11.6},'2026-10-18','2026-10-27');
 assert.ok(recovered&&recovered.temperature===19.4,'Ein vorheriges negatives Ergebnis wurde weiterhin langfristig gecacht und blockiert die Erholung.');
 assert.equal(globalThis.__midWaterFetchCount,afterNegative+1,'Nach sauber negativem Ergebnis wurde der Datenweg nicht erneut geprüft.');

 globalThis.__midWaterPayload={schema:'legacy.worker',available:true,temperature:22,gridDistanceKm:4,grid:{latitude:35.4,longitude:24.6},days:10};
 await assert.rejects(()=>module.fetchTravelWaterClimatology({latitude:34.4,longitude:23.65},'2026-10-18','2026-10-27'),/aktuellen MID-Datendienst noch nicht verfügbar/,'Veralteter Worker wird nicht verständlich diagnostiziert.');
}finally{delete globalThis.__midWaterPayload;delete globalThis.__midWaterFetchCount;await rm(compileDir,{recursive:true,force:true})}

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-travel-water-climatology-resilience-09665.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(a.length,b.length);index++){const x=a[index]??0,y=b[index]??0;if(x!==y)return x>y}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.66.7'),`NOAA-OISST-Regression benötigt mindestens MID 0.9.66.7, gefunden ${pkg.version}.`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Version nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: NOAA-OISST-Workervertrag, Küstenradius, reine Positivpersistenz, Erholung und sichtbare Altworker-Diagnose geprüft.`);

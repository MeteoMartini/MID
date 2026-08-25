import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve('.');
const [travel,panel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/travelPlanner.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

assert.ok(travel.includes("const WATER_CACHE_PREFIX='mid:travel-water-climate:1991-2020:v4:'"),'SST-v3-Negativcache wird nicht sicher invalidiert.');
assert.ok(travel.includes('const COASTAL_WATER_MAX_DISTANCE_KM=80;'),'ERA5-Ocean-Küstenradius ist nicht an das native 0,5°-Raster angepasst.');
assert.ok(travel.includes('Promise.allSettled(WATER_REFERENCE_YEARS.map(loadYear))'),'Nicht alle SST-Referenzjahre werden unabhängig geprüft.');
assert.ok(!travel.includes('first=await loadYear(WATER_REFERENCE_YEARS[0])'),'1991 ist weiterhin ein harter SST-Gatekeeper.');
assert.ok(!travel.includes('writeCache(key,unavailable)'),'Negative SST-Ergebnisse werden weiterhin langfristig persistiert.');
assert.ok(panel.includes("[waterError,setWaterError]=useState('')"),'Technische SST-Fehler bleiben in der Oberfläche unsichtbar.');
assert.ok(panel.includes('MID versucht die SST beim nächsten Abruf erneut.'),'SST-Wiederholungs-/Fehlerhinweis fehlt.');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-travel-water-resilience-'));
try{
 const tsc=path.resolve('node_modules','.bin',process.platform==='win32'?'tsc.cmd':'tsc'),compile=spawnSync(tsc,['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/travelPlanner.ts')],{cwd:root,encoding:'utf8'});
 assert.equal(compile.status,0,`TypeScript travelPlanner: ${compile.stdout||compile.stderr}`);
 const compiledPath=path.join(compileDir,'travelPlanner.js');
 const compiledSource=(await readFile(compiledPath,'utf8')).replace("from './cachePolicy'","from './cachePolicy.js'").replace("from './openMeteoGuard'","from './openMeteoGuard.js'");
 await writeFile(compiledPath,compiledSource);
 const module=await import(`${pathToFileURL(compiledPath).href}?v=${Date.now()}`);

 let secondLocationHasData=false,fetchCount=0;
 const makePayload=(parsed,withData,gridLatOffset=.5)=>{
  const start=String(parsed.searchParams.get('start_date')),end=String(parsed.searchParams.get('end_date')),lat=Number(parsed.searchParams.get('latitude')),lon=Number(parsed.searchParams.get('longitude'));
  const time=[],sea_surface_temperature=[];
  if(withData)for(let date=new Date(`${start}T12:00:00Z`),stop=new Date(`${end}T12:00:00Z`);date<=stop;date.setUTCDate(date.getUTCDate()+1)){time.push(`${date.toISOString().slice(0,10)}T12:00`);sea_surface_temperature.push(23.5+date.getUTCMonth()*.08)}
  return{latitude:lat+gridLatOffset,longitude:lon,hourly:{time,sea_surface_temperature}};
 };
 globalThis.fetch=async url=>{
  fetchCount++;const parsed=new URL(String(url)),year=Number(String(parsed.searchParams.get('start_date')).slice(0,4)),lat=Number(parsed.searchParams.get('latitude'));
  // First coastal case: 1991 deliberately has no SST, all seven later reference years do.
  // Returned ocean cell is ~56 km away: valid for native 0.5° ERA5-Ocean, rejected by the old 45-km cutoff.
  const firstLocation=Math.abs(lat-35.4)<.01;
  const withData=firstLocation?year!==1991:secondLocationHasData;
  return{ok:true,status:200,json:async()=>makePayload(parsed,withData)};
 };

 const coastal=await module.fetchTravelWaterClimatology({latitude:35.4,longitude:24.65},'2026-10-18','2026-10-27');
 assert.ok(coastal,'Ein fehlendes Referenzjahr darf die übrigen gültigen ERA5-Ocean-Jahre nicht mehr unterdrücken.');
 assert.match(coastal.referencePeriod,/7 Referenzjahre/,'Erfolgreiche SST-Referenzjahre werden nicht korrekt ausgewiesen.');
 assert.ok(coastal.gridDistanceKm>45&&coastal.gridDistanceKm<80,`Native ERA5-Ocean-Küstenzelle wird nicht akzeptiert: ${coastal.gridDistanceKm} km`);
 assert.ok(coastal.temperature>23&&coastal.temperature<25,`SST-Klimamittel unplausibel: ${coastal.temperature}`);

 const beforeNegative=fetchCount;
 const unavailable=await module.fetchTravelWaterClimatology({latitude:36.4,longitude:25.65},'2026-10-18','2026-10-27');
 assert.equal(unavailable,null,'Sauber fehlende SST-Daten müssen ohne erfundene Wassertemperatur enden.');
 const afterNegative=fetchCount;
 assert.ok(afterNegative-beforeNegative>=8,'Erster negativer SST-Versuch hat nicht alle Referenzjahre geprüft.');
 secondLocationHasData=true;
 const recovered=await module.fetchTravelWaterClimatology({latitude:36.4,longitude:25.65},'2026-10-18','2026-10-27');
 assert.ok(recovered,'Ein vorheriges negatives SST-Ergebnis wurde weiterhin gecacht und blockiert die Erholung.');
 assert.ok(fetchCount-afterNegative>=8,'Nach negativem SST-Ergebnis erfolgte kein neuer Referenzjahr-Abruf.');
}finally{await rm(compileDir,{recursive:true,force:true})}

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-travel-water-climatology-resilience-09665.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let index=0;index<Math.max(a.length,b.length);index++){const x=a[index]??0,y=b[index]??0;if(x!==y)return x>y}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.66.5'),`Regression benötigt mindestens MID 0.9.66.5, gefunden ${pkg.version}.`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Version nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: Reise-SST ohne 1991-Gate, ohne Langzeit-Negativcache, mit ERA5-Ocean-Küstenradius und sichtbarer Fehlerdiagnose geprüft.`);

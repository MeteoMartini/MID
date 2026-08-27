import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [worker,directBuild,data,panel,pkgRaw,baselineRaw,changelog,implementation]=await Promise.all([
 read('worker-src/25-dach-extreme-outlook.js'),read('scripts/build-maintenance-aggregates.mjs'),read('src/extremeWeatherOutlook.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.67.8.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-resilience-096678.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.67.8'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-resilience'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.67.8.md'));
for(const token of [
 "const DACH_EXTREME_GRID_PROFILES={full:{rows:13,cols:23,batchSize:32,concurrency:2",
 "fallback:{rows:11,cols:19,batchSize:32,concurrency:1",
 'const DACH_EXTREME_MIN_DATA_COVERAGE=.65',
 'const DACH_EXTREME_BATCH_CACHE_MS=6*60*60*1000',
 'const DACH_EXTREME_BATCH_RETRIES=2',
 'async function dachExtremeFetchBatchResilient(points)',
 'dachExtremeBatchCache.set(key',
 'if(dataCoverage<DACH_EXTREME_MIN_DATA_COVERAGE)',
 'availablePointCount:cells.length',
 'dataCoveragePct:coveragePct'
])assert.ok(worker.includes(token),`Resilienzvertrag fehlt: ${token}`);
assert.ok(directBuild.includes("dachExtremeOutlookData('fallback')"),'Browser-Direktpfad muss das lastärmere Vollgebietsprofil verwenden.');
assert.ok(data.includes("OUTLOOK_PAYLOAD_PREFIX}v5"));
assert.ok(data.includes("cacheKey:'dach-extreme-outlook:v5'"));
assert.ok(data.includes('coverage>=60'),'Lokaler Fallback darf keine fast leeren Teilpayloads akzeptieren.');
assert.ok(panel.includes('Datenabdeckung'));
assert.ok(panel.includes('data.partial&&!data.stale'));
assert.ok(changelog.includes('## 0.9.67.8'));
for(const token of ['vollständige ICON-D2-Gebiet','13×23','11×19','Teilcache','Einzelne fehlgeschlagene Batches'])assert.ok(implementation.includes(token),`Implementierungsnachweis fehlt: ${token}`);

// Functional degraded-mode check: one complete EPS batch may fail after all retries,
// while the remaining full-domain fallback grid still produces a usable partial outlook.
const direct=await read('src/extremeWeatherOutlookDirect.generated.js');
const hours=Array.from({length:49},(_,index)=>new Date(Date.UTC(2026,7,27,index)).toISOString().slice(0,16)),values=value=>Array(49).fill(value);
const ensembleRow=()=>({elevation:120,hourly:{time:hours,precipitation:values(0),precipitation_spread:values(0),snowfall:values(0),snowfall_spread:values(0),wind_gusts_10m:values(15),wind_gusts_10m_spread:values(1),temperature_2m:values(16),temperature_2m_spread:values(1),wet_bulb_temperature_2m:values(13),wet_bulb_temperature_2m_spread:values(1),cape:values(0),cape_spread:values(0),convective_inhibition:values(100),convective_inhibition_spread:values(5),freezing_level_height:values(2600),freezing_level_height_spread:values(100)}});
const diagnosticRow=()=>({elevation:120,hourly:{temperature_500hPa:values(-20),temperature_850hPa:values(0),relative_humidity_700hPa:values(55),wind_speed_850hPa:values(20),wind_direction_850hPa:values(240),wind_speed_500hPa:values(35),wind_direction_500hPa:values(250),freezing_level_height:values(2600),wet_bulb_temperature_2m:values(13),lightning_potential:values(0),updraft:values(0),convective_inhibition:values(100),cape:values(0),weather_code:values(0),precipitation:values(0),snowfall:values(0),wind_gusts_10m:values(15)}});
const originalFetch=globalThis.fetch;let epsFailures=0;
globalThis.fetch=async(input,init={})=>{const url=new URL(String(input));if(url.pathname.endsWith('/meta.json'))return Response.json({last_run_initialisation_time:1_777_000_000});const count=String(url.searchParams.get('latitude')||'').split(',').filter(Boolean).length;if(url.hostname==='ensemble-api.open-meteo.com'){if(epsFailures<3){epsFailures++;return Response.json({error:true,reason:'rate limit test'},{status:429})}return Response.json(Array.from({length:count},ensembleRow))}if(url.pathname==='/v1/dwd-icon')return Response.json(Array.from({length:count},diagnosticRow));return Response.json({error:true},{status:404})};
try{const executable=direct.replace("import {guardedOpenMeteoFetch} from './openMeteoGuard';","const guardedOpenMeteoFetch=(url,init)=>fetch(url,init);").replace("import {MID_VERSION} from './version';",`const MID_VERSION='${pkg.version}';`),module=await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`),result=await module.loadDirectDachExtremeOutlook();assert.equal(epsFailures,3);assert.equal(result.partial,true);assert.ok(result.quality.dataCoveragePct>=65&&result.quality.dataCoveragePct<100);assert.ok(result.cells.length>0&&result.cells.length<result.grid.pointCount);assert.match(result.partialReason,/Raster/i)}finally{globalThis.fetch=originalFetch}

console.log('MID v0.9.67.8: Mitteleuropa-Extremwetter bleibt vollflächig, reduziert Abruflast und toleriert einzelne Batch-Ausfälle.');

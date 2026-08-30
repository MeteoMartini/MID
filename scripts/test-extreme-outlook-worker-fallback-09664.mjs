import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [client,direct,workerSource,router,panel,styles,pkgRaw,baselineRaw,changelog,implementation,workerCore]=await Promise.all([
 read('src/extremeWeatherOutlook.ts'),read('src/extremeWeatherOutlookDirect.generated.js'),read('worker-src/25-dach-extreme-outlook.js'),read('worker-src/40-aviation-router.js'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.66.4.md'),read('worker-src/00-core-observations.js')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-worker-fallback-09664.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]??0,y=b[i]??0;if(x!==y)return x>y}return true};

assert.ok(versionAtLeast(pkg.version,'0.9.66.4'),`Version muss mindestens 0.9.66.4 sein: ${pkg.version}`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-worker-fallback'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Worker-Fallback-Regression ist nicht verbindlich registriert.');
for(const file of[test,'src/extremeWeatherOutlookDirect.generated.js','src/extremeWeatherOutlookDirect.generated.d.ts','MID_IMPLEMENTATION_0.9.66.4.md'])assert.ok(baseline.requiredFiles?.includes(file),`Baseline-Datei fehlt: ${file}`);
assert.ok(workerCore.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Version sind nicht gekoppelt.');

for(const token of ["loadDirectDachExtremeOutlook","OUTLOOK_FRESH_MS=20*60*1000","OUTLOOK_STALE_MS=12*60*60*1000","dailyWorkerLimit","rememberWorkerLimit","delivery:'browser-direct'","delivery:'local-cache'","readOutlookCache(OUTLOOK_STALE_MS)","cacheKey:'dach-extreme-outlook:v5'"])assert.ok(client.includes(token),`Client-Fallbackvertrag fehlt: ${token}`);
assert.ok(client.indexOf("fetchWorkerJson<ExtremeWeatherOutlook>('dach-extreme-outlook'")<client.indexOf('loadDirectDachExtremeOutlook(signal)'),'Der Worker muss bevorzugt und der Direktabruf erst als Fallback verwendet werden.');
assert.ok(!client.includes('Browser-, DNS-, CORS- oder Netzwerkblockade möglich.'),'Die generische Worker-Fehlermeldung darf im Modul nicht als Endzustand erscheinen.');
assert.ok(direct.includes(workerSource.trim()),'Direktberechnung muss bytegleich aus der kanonischen Worker-Fachlogik erzeugt werden.');
for(const token of ["headers.delete('User-Agent')","guardedOpenMeteoFetch","priority:'normal'","maxRetries:0","delivery:'browser-direct'"])assert.ok(direct.includes(token),`Direktabruf-Härtung fehlt: ${token}`);
assert.ok(router.includes("delivery:'worker'"));
assert.ok(router.includes("'cache-control':'public, max-age=1800, stale-while-revalidate=21600'"));
assert.ok(workerSource.includes('storedAt<30*60000'),'Worker-Fachcache reduziert die externen Modellabrufe nicht ausreichend.');
assert.ok(panel.includes("data.delivery==='browser-direct'"));
assert.ok(panel.includes('Direktberechnung im Browser'));
assert.ok(panel.includes('data.staleReason||'));
assert.ok(styles.includes('.extreme-direct{'));

const hours=Array.from({length:49},(_,index)=>new Date(Date.UTC(2026,7,25,index)).toISOString().slice(0,16));
const values=value=>Array(49).fill(value);
function ensembleRow(){return{elevation:180,hourly:{time:hours,precipitation:values(0),precipitation_spread:values(0),snowfall:values(0),snowfall_spread:values(0),wind_gusts_10m:values(12),wind_gusts_10m_spread:values(1),temperature_2m:values(15),temperature_2m_spread:values(1),wet_bulb_temperature_2m:values(12),wet_bulb_temperature_2m_spread:values(1),cape:values(0),cape_spread:values(0),convective_inhibition:values(120),convective_inhibition_spread:values(5),freezing_level_height:values(2600),freezing_level_height_spread:values(100)}}}
function diagnosticRow(){return{elevation:180,hourly:{temperature_500hPa:values(-20),temperature_850hPa:values(0),relative_humidity_700hPa:values(55),wind_speed_850hPa:values(18),wind_direction_850hPa:values(240),wind_speed_500hPa:values(35),wind_direction_500hPa:values(250),freezing_level_height:values(2600),wet_bulb_temperature_2m:values(12),lightning_potential:values(0),updraft:values(0),convective_inhibition:values(120),cape:values(0),weather_code:values(0),precipitation:values(0),snowfall:values(0),wind_gusts_10m:values(12)}}}
const originalFetch=globalThis.fetch,calls=[];
globalThis.fetch=async(input,init={})=>{const url=new URL(String(input)),headers=new Headers(init.headers||{});calls.push({url,init,headers});assert.equal(headers.has('user-agent'),false,'Browser-Direktabruf darf keinen verbotenen User-Agent-Header setzen.');assert.ok(init.signal instanceof AbortSignal,'Jeder Direktabruf benötigt ein Abbruchsignal.');assert.equal('cf' in init,false,'Cloudflare-spezifische Fetch-Optionen dürfen nicht an den Browser gelangen.');if(url.pathname.endsWith('/meta.json'))return Response.json({last_run_initialisation_time:1_777_000_000});const count=String(url.searchParams.get('latitude')||'').split(',').filter(Boolean).length;assert.ok(count>0&&count<=60,'Direktabrufe müssen das 60-Punkte-Budget einhalten.');if(url.hostname==='ensemble-api.open-meteo.com')return Response.json(Array.from({length:count},ensembleRow));if(url.pathname==='/v1/dwd-icon')return Response.json(Array.from({length:count},diagnosticRow));return Response.json({error:true,reason:'unerwartete Test-URL'},{status:404})};
try{
 const executable=direct.replace("import {guardedOpenMeteoFetch} from './openMeteoGuard';","const guardedOpenMeteoFetch=(url,init)=>fetch(url,init);").replace("import {MID_VERSION} from './version';",`const MID_VERSION='${pkg.version}';`),module=await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`),result=await module.loadDirectDachExtremeOutlook();
 assert.equal(result.scope,'Mitteleuropa');assert.equal(result.delivery,'browser-direct');assert.equal(result.grid.pointCount,233);assert.equal(result.cells.length,233);assert.equal(result.periods.length,4);assert.equal(result.thresholds.probability.overviewMin,40);assert.equal(result.thresholds.probability.hazardMin,10);assert.equal(result.quality.ensembleMembers,20);assert.ok(result.cells.every(cell=>Object.keys(cell.periods).length===4));assert.ok(result.cells.every(cell=>Object.values(cell.periods).every(period=>Object.keys(period.probabilityFields||{}).length===5&&Object.values(period.probabilityFields||{}).every(levels=>levels.length===4))),'Direktberechnung muss vollständige I1–I4-Felder für alle Gefahren liefern.');
 assert.equal(calls.filter(call=>call.url.hostname==='ensemble-api.open-meteo.com').length,8);assert.equal(calls.filter(call=>call.url.pathname==='/v1/dwd-icon').length,8);assert.equal(calls.filter(call=>call.url.pathname.endsWith('/meta.json')).length,1);assert.equal(calls.filter(call=>call.url.hostname==='ensemble-api.open-meteo.com').reduce((sum,call)=>sum+call.url.searchParams.get('latitude').split(',').length,0),233);
}finally{globalThis.fetch=originalFetch}

assert.ok(changelog.includes('## 0.9.66.4'),'Changelog-Nachweis für 0.9.66.4 fehlt.');
for(const token of ['Daily API request limit exceeded','meteorologischen Schwellen'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);

console.log(`MID v${pkg.version}: Worker-Tageslimit, kanonische Browser-Direktberechnung, persistenter Stale-Cache, Abrufbudget und verständlicher Datenweg geprüft.`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [client,fallback,direct,workerSource,aggregate,proxy,generator,pkgRaw,baselineRaw]=await Promise.all([
 read('src/extremeWeatherOutlook.ts'),read('src/extremeWeatherOutlookExtendedFallback.ts'),read('src/extremeWeatherOutlookDirect.generated.js'),read('worker-src/25-dach-extreme-outlook.js'),read('worker.js'),read('worker/metar-proxy.js'),read('scripts/build-maintenance-aggregates.mjs'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-extended-resilience-0985154.mjs';
assert.ok(Number(pkg.version.split('.').at(-1))>=154); // Historical release test remains valid for subsequent maintenance releases.
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),test+' fehlt in '+key);
for(const source of [workerSource,aggregate,proxy,direct]){
 assert.ok(source.includes("async function dachExtremeFetchJson(url,label,cacheTtl=600)"),'konfigurierbarer Upstream-Cache fehlt');
 assert.ok(source.includes("const key='extended-v4'"),'Langfrist-Cacheversion fehlt');
 assert.ok(source.includes('cached.storedAt<6*60*60*1000'),'Langfrist-Fachcache muss sechs Stunden halten');
 assert.ok(source.includes("dachExtremeFetchJson(url,'ICON-EPS Langfrist',6*60*60)"),'ICON-EPS-Upstream-Cache muss sechs Stunden halten');
}
const canonicalDirectSource=workerSource.trim().replace(
 'const dachExtremeOutlookCache=new Map(),dachExtremeBatchCache=new Map();',
 'const dachExtremeOutlookCache=directOutlookCache,dachExtremeBatchCache=directBatchCache;'
);
assert.ok(direct.includes(canonicalDirectSource),'Direktpfad muss die kanonische Worker-Fachlogik enthalten.');
assert.ok(generator.includes('export async function loadDirectDachExtendedExtremeOutlook(signal)'),'Generator muss den Langfrist-Direktexport reproduzierbar erzeugen.');
assert.ok(!client.includes("import('./extremeWeatherOutlookExtendedFallback')"),'Langfrist-Worker darf bei fehlendem Zusatzmodul nicht blockiert werden.');
assert.ok(client.includes("fetchWorkerJson<ExtremeWeatherOutlook>('dach-extreme-outlook',{range:'extended'}"),'Langfrist-Worker muss vor dynamischem Direktmodul ohne Import erreichbar sein.');
assert.ok(client.includes('readExtendedOutlookCache(EXTENDED_FRESH_MS)')&&client.includes('readExtendedOutlookCache(EXTENDED_STALE_MS)'),'Vollständiger Langfrist-Cache muss auch ohne Import erreichbar sein.');
assert.ok(client.includes("import('./extremeWeatherOutlookDirect.generated.js')"),'Auch die große kanonische Direktberechnung muss lazy bleiben und darf nicht das Main-Bundle belasten.');
for(const token of ['EXTENDED_FRESH_MS=3*60*60*1000','EXTENDED_STALE_MS=24*60*60*1000',"cacheKey:'dach-extreme-outlook:extended:v4'",'readExtendedOutlookCache(EXTENDED_FRESH_MS)','readExtendedOutlookCache(EXTENDED_STALE_MS)','if(dailyWorkerLimit(error))rememberWorkerLimit()'])assert.ok(client.includes(token),'Langfrist-Resilienzvertrag fehlt: '+token);
assert.ok(client.indexOf("fetchWorkerJson<ExtremeWeatherOutlook>('dach-extreme-outlook',{range:'extended'}")<client.indexOf("import('./extremeWeatherOutlookDirect.generated.js')",client.indexOf('export async function loadExtendedExtremeWeatherOutlook')),'Worker muss vor Browser-Direktabruf versucht werden.');
assert.ok(client.includes('Der regionale MID-Datendienst und der direkte Ersatzabruf sind derzeit nicht verfügbar. Bitte erneut laden.'),'Fail-closed-Endzustand fehlt.');
assert.ok(client.includes('function validExtendedOutlook(value:unknown)'),'Langfristprodukt muss eigenes Fachschema prüfen.');
for(const id of ['48-72','72-96','96-120','120-144','144-168'])assert.ok(client.includes(id),'Langfristsegment fehlt: '+id);
assert.ok(client.includes('validExtendedOutlook(data)'),'Datenquelle muss vollständigen Vorhinweis verifizieren.');
assert.ok(fallback.includes('return loadExtendedExtremeWeatherOutlook(signal)'),'Kompatibilitätsimport muss denselben sicheren Datenweg nutzen.');
const panel=await read('src/ExtremeWeatherOutlookPanel.tsx');
assert.ok(panel.includes('isExtremeChunkLoadError(error)')&&panel.includes('window.location.reload()')&&panel.includes('App neu laden'),'Fehlendes JS-Modul muss durch echten Nutzer-Reload statt wiederholten kaputten Import behoben werden.');
assert.ok(panel.includes('Erneut laden'),'Andere Netzwerkfehler müssen regulär wiederholbar bleiben.');

const hours=Array.from({length:169},(_,index)=>new Date(Date.UTC(2026,9,3,16+index)).toISOString().slice(0,16));
const values=value=>Array(169).fill(value);
function row(){return{elevation:90,hourly:{time:hours,rain:values(0),rain_spread:values(0),wind_gusts_10m:values(20),wind_gusts_10m_spread:values(1),snowfall:values(0),snowfall_spread:values(0),...Object.fromEntries(Array.from({length:39},(_,i)=>['rain','wind_gusts_10m','snowfall'].map(field=>[`${field}_member${String(i+1).padStart(2,'0')}`,values(field==='wind_gusts_10m'?20:0)])).flat())}}}
const originalFetch=globalThis.fetch,calls=[];
globalThis.fetch=async(input,init={})=>{const url=new URL(String(input));calls.push(url);if(url.hostname!=='ensemble-api.open-meteo.com')return Response.json({error:true,reason:'unerwartete URL'},{status:404});const count=String(url.searchParams.get('latitude')||'').split(',').filter(Boolean).length;assert.ok(count>0&&count<=16,'Langfrist-Direktabruf überschreitet Batchbudget');assert.equal(url.searchParams.get('models'),'dwd_icon_seamless_eps');assert.equal(url.searchParams.get('forecast_hours'),'169');return Response.json(Array.from({length:count},row))};
try{
 const executable=direct.replace("import {guardedOpenMeteoFetch} from './openMeteoGuard';","const guardedOpenMeteoFetch=(url,init)=>fetch(url,init);").replace("import {MID_VERSION} from './version';","const MID_VERSION='0.9.85.154';"),module=await import('data:text/javascript;base64,'+Buffer.from(executable).toString('base64')),result=await module.loadDirectDachExtendedExtremeOutlook();
 assert.equal(result.scope,'Mitteleuropa');assert.equal(result.delivery,'browser-direct');assert.equal(result.periods.length,5);assert.ok(result.cells.length>0);assert.equal(result.grid.availablePointCount,result.cells.length);assert.equal(result.quality.ensembleMembers,40);assert.ok(calls.length>=2);assert.ok(calls.every(url=>url.searchParams.get('hourly')==='rain,wind_gusts_10m,snowfall'));
}finally{globalThis.fetch=originalFetch}
console.log('MID v0.9.85.154: Langfrist-Extremwetter resilient gegen zentrales Open-Meteo-Tageslimit, mit Browser-Direktpfad und Stale-Cache geschützt.');

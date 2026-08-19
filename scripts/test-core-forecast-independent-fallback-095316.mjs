import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
const [weather,worker,app,eventEngine,twin,guard,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/eventWeatherEngine.ts',root),'utf8'),
 readFile(new URL('src/twinBackgroundLearning.ts',root),'utf8'),
 readFile(new URL('src/openMeteoGuard.ts',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.53.17'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-core-forecast-independent-fallback-095316.mjs'));

// v0.9.53.17 restoration contract: v16's independent provider may never become the standard core forecast.
assert.match(weather,/const useDirectFirst=priority==='foreground'/);
assert.match(weather,/meta\?\.fallback!==true&&!\/MET Norway\/i/);
assert.match(weather,/weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match',weatherBundleKind:'best-match'/);
assert.doesNotMatch(weather,/weatherBundleKind:fallbackSource\?'provider-fallback'/);
assert.doesNotMatch(weather,/provider-no-probability/);
assert.match(guard,/export function registerOpenMeteoCooldown/);
const core=worker.slice(worker.indexOf('async function openMeteoCoreForecast'),worker.indexOf('async function openMeteoEnsembleProxy'));
assert.doesNotMatch(core,/metNorwayCoreForecast|independentFallback|fallback:true/);
assert.match(core,/provider:'Open-Meteo Best Match',fallback:false/);
assert.doesNotMatch(app,/Im unabhängigen Ersatzmodell derzeit nicht verfügbar/);
assert.doesNotMatch(app,/Open-Meteo ist vorübergehend nicht belastbar; Kernvorhersage transparent aus/);
assert.match(app,/Fallback auf Best Match/);
assert.match(eventEngine,/forecast\(location\.latitude,location\.longitude,signal,\{priority:'normal',forceFresh,timeZone:location\.timezone,elevation:location\.elevation\}\)/);
assert.match(twin,/forecast\(location\.latitude,location\.longitude,signal,\{priority:'background',timeZone:location\.timezone,elevation:location\.elevation\}\)/);

// Runtime guard: even if MET Norway would be reachable, a cache-less forecast-core 429 must not return
// a structurally incomplete cross-provider payload. The frontend can keep last full Best Match or show retry state.
const originalFetch=globalThis.fetch,originalCaches=globalThis.caches;
let openMeteoCalls=0,metCalls=0;
globalThis.caches={default:{match:async()=>undefined,put:async()=>undefined}};
globalThis.fetch=async input=>{
 const url=new URL(input instanceof Request?input.url:String(input));
 if(url.protocol==='https:'&&url.hostname==='api.open-meteo.com'){openMeteoCalls++;return new Response(JSON.stringify({error:true,reason:'Too Many Requests'}),{status:429,headers:{'content-type':'application/json','retry-after':'60'}})}
 if(url.protocol==='https:'&&url.hostname==='api.met.no'&&url.pathname==='/weatherapi/locationforecast/2.0/complete'){metCalls++;return new Response(JSON.stringify({properties:{timeseries:[]}}),{status:200,headers:{'content-type':'application/json'}})}
 throw new Error(`unexpected network call: ${url.origin}${url.pathname}`);
};
try{
 const workerPath=new URL('worker/metar-proxy.js',root);
 const module=await import(`${pathToFileURL(workerPath.pathname).href}?test=${Date.now()}`);
 const response=await module.default.fetch(new Request('https://worker.invalid/?mode=forecast-core&lat=50.78&lon=7.06&timezone=Europe%2FBerlin&elevation=53'),{});
 assert.equal(response.status,429);
 const payload=await response.json();
 assert.match(String(payload?.error||''),/Open-Meteo Best Match/);
 assert.ok(openMeteoCalls>=1);
 assert.equal(metCalls,0);
}finally{
 globalThis.fetch=originalFetch;
 if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
}
console.log('MID v0.9.53.16-Kompatibilität: unabhängige Anbieter bleiben ergänzend nutzbar, dürfen aber ab v0.9.53.17 nicht mehr die vollständige Best-Match-Kernprognose und deren Kacheln ersetzen.');

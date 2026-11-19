import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const [weather,worker,baselineRaw,pkgRaw]=await Promise.all([readFile(new URL('src/weather.ts',root),'utf8'),readFile(new URL('worker/metar-proxy.js',root),'utf8'),readFile(new URL('MID_BASELINE.json',root),'utf8'),readFile(new URL('package.json',root),'utf8')]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.53.17'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-core-forecast-resilience-095315.mjs'));
assert.match(weather,/FORECAST_CORE_CACHE_PREFIX='mid:forecast-core:v5:'/);
assert.match(weather,/FORECAST_CORE_LEGACY_CACHE_PREFIXES=\['mid:forecast-core:v4:','mid:forecast-core:v3:','mid:forecast-core:v2:','mid:forecast-core:v1:'\]/);
assert.match(weather,/FORECAST_CORE_NEARBY_FALLBACK_M=2500/);
assert.match(weather,/primaryCoreForecast\(value:unknown\)/);
assert.match(weather,/meta\?\.fallback!==true&&!\/MET Norway\/i/);
assert.match(weather,/workerForecastCore/);
assert.match(weather,/fetchWorkerJson<Weather&\{error\?:string\}>\('forecast-core'/);
assert.match(weather,/const useDirectFirst=priority==='foreground'/);
assert.match(weather,/directOpenMeteoCoreForecast\(lat,lon,signal,priority,options\)/);
assert.match(weather,/guardedOpenMeteoJson<Weather>\(url,\{signal:request\.signal,cache:'no-store'\},\{priority,maxRetries:/);
assert.match(worker,/async function openMeteoCoreForecast\(url\)/);
assert.match(worker,/CORE_FORECAST_EDGE_FRESH_MS=2\*60\*1000/);
assert.match(worker,/CORE_FORECAST_EDGE_STALE_MS=18\*3600000/);
assert.match(worker,/globalThis\.caches\?\.default/);
assert.match(worker,/if\(mode==='forecast-core'\)return openMeteoCoreForecast\(u\)/);
assert.match(worker,/open-meteo-core-forecast-proxy/);
const core=worker.slice(worker.indexOf('async function openMeteoCoreForecast'),worker.indexOf('async function openMeteoEnsembleProxy'));
assert.ok(core.includes("provider:'Open-Meteo Best Match',fallback:false"));
assert.ok(core.includes('if(cached)return cachedResponse({stale:true'));
assert.doesNotMatch(core,/metNorwayCoreForecast|independentFallback|fallback:true/);

// Isolated execution of the actual TypeScript cache functions, not just pattern matching.
const begin=weather.indexOf("const FORECAST_CORE_CACHE_PREFIX=");
const finish=weather.indexOf("function linkedTimeoutSignal(",begin);
assert(begin>0&&finish>begin,'Core cache source boundaries must exist');
const {code}=await transform(weather.slice(begin,finish),{loader:'ts',format:'cjs',target:'es2022'});
const entries=new Map();
const localStorage={
 getItem:key=>entries.get(key)??null,
 setItem:(key,value)=>entries.set(key,String(value)),
 removeItem:key=>entries.delete(key),
 key:index=>[...entries.keys()][index]??null,
 get length(){return entries.size}
};
const haversine=(a,b,c,d)=>{const rad=Math.PI/180,dp=(c-a)*rad,dl=(d-b)*rad,v=Math.sin(dp/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(dl/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))};
const sandbox={localStorage,haversine,writeBoundedStorage:(store,key,value)=>store.setItem(key,JSON.stringify(value)),module:{exports:{}},exports:{}};
vm.createContext(sandbox);
vm.runInContext(code+';globalThis.api={readForecastCoreCache,writeForecastCoreCache,instantCachedCoreForecast,cachedForecastResult,forecastCoreCacheKey};',sandbox);
const api=sandbox.api;
const weatherFixture={latitude:50,longitude:7,utc_offset_seconds:0,current:{temperature_2m:7},hourly:{time:[]},daily:{time:[],precipitation_sum:[null]},_mid_core_proxy:{provider:'Open-Meteo Best Match',fallback:false}};
api.writeForecastCoreCache(50,7,weatherFixture);
assert.equal(api.readForecastCoreCache(50,7)?.spatialMatch,'exact','stamped same-location source is fresh');
assert(api.instantCachedCoreForecast(50,7),'verified exact cache remains usable for instant warm-start');
assert.equal(api.readForecastCoreCache(50.0004,7),null,'same rounded key but 44m away must not be labelled exact');
assert.equal(api.readForecastCoreCache(50.0004,7,{},true)?.spatialMatch,'nearby','same bucket is only an emergency nearby fallback');
assert.equal(api.readForecastCoreCache(50.01,7),null,'neighbor entry must never be an online fresh hit');
const nearby=api.readForecastCoreCache(50.01,7,{},true);
assert.equal(nearby?.spatialMatch,'nearby');
assert(nearby.distance>1000&&nearby.distance<1200,'nearby distance in meters');
assert.equal(api.cachedForecastResult(nearby,'network-fallback-local-cache')._mid_core_proxy.spatialMatch,'nearby');
assert.equal(api.readForecastCoreCache(50.024,7,{},true),null,'2.5 km distance limit');
assert.equal(entries.has(api.forecastCoreCacheKey(50.01,7)),false,'no cross-location copy to exact key');
entries.clear();
entries.set(api.forecastCoreCacheKey(50,7),JSON.stringify({time:Date.now(),value:weatherFixture}));
assert.equal(api.readForecastCoreCache(50,7),null,'legacy unknown origin is not fresh exact');
assert.equal(api.instantCachedCoreForecast(50,7),null,'legacy unknown origin cannot warm-start');
const legacy=api.readForecastCoreCache(50,7,{},true);
assert.equal(legacy?.spatialMatch,'unknown','unknown legacy source remains emergency fallback only');
assert.equal(api.cachedForecastResult(legacy,'offline-local-cache').daily.precipitation_sum[0],null,'missing precipitation remains missing');
entries.clear();
api.writeForecastCoreCache(50,7,{...weatherFixture,daily:{time:[],precipitation_sum:[0]}},Date.now()-18*3600000+1000);
assert(api.readForecastCoreCache(50,7,{},true),'existing 18-hour fallback window retained');
entries.clear();
api.writeForecastCoreCache(50,7,weatherFixture,Date.now()-18*3600000-1000);
assert.equal(api.readForecastCoreCache(50,7,{},true),null,'expired fallback rejected');
assert(weather.includes("const nearby=readForecastCoreCache(lat,lon,options,true)"),'emergency read uses explicit fallback');
assert(weather.includes("if(!options.forceFresh&&cached&&cached.age<=FORECAST_CORE_FRESH_MS)return cachedForecastResult(cached,'fresh-local-cache')"),'online fresh path remains restricted to verified exact cache');

console.log('MID v0.9.53.15-Vertrag fortgeführt: GPS-toleranter letzter Best-Match-Stand und Worker-Edge-Cache bleiben erhalten, ohne unvollständigen Fremdprovider in die Standardprognose einzuspeisen.');

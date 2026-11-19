import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {classifyForecastSpatialCache,forecastSpatialDistanceM} from '../../src/forecastSpatialCacheEvidence';
const read=(p:string)=>readFileSync(fileURLToPath(new URL('../../'+p,import.meta.url)),'utf8');
const part=read('src/weather-src/00-types-models-search.tsfrag');
const berlin={lat:52.52,lon:13.405};
const bucket={lat:52.520,lon:13.405};
describe('MID #935 GPS-cache provenance, exact-vs-nearby-vs-unknown',()=>{
 it('an identical source may be served as fresh, without fabricated age',()=>{expect(classifyForecastSpatialCache(berlin,berlin,bucket)).toEqual({spatialMatch:'exact'})});
 it('nearby 100 m is never exact even with a valid unmodified key',()=>{const near={lat:52.5209,lon:13.405};const value=classifyForecastSpatialCache(near,berlin,bucket);expect(value?.spatialMatch).toBe('nearby');expect(value?.spatialFallbackDistanceM).toBeGreaterThan(90)});
 it('keeps the 2500 m emergency boundary without enlarging it',()=>{const within={lat:52.52+2499/111195,lon:13.405};const beyond={lat:52.52+2501/111195,lon:13.405};expect(classifyForecastSpatialCache(within,berlin,bucket)?.spatialMatch).toBe('nearby');expect(classifyForecastSpatialCache(beyond,berlin,bucket)).toBeNull()});
 it('does not turn legacy v5 storage without source coordinates into exact evidence',()=>{expect(classifyForecastSpatialCache(berlin,undefined,bucket)).toEqual({spatialMatch:'unknown'});expect(classifyForecastSpatialCache({lat:52.55,lon:13.405},undefined,bucket)).toBeNull()});
 it('rejects missing, nonfinite or forged source locations',()=>{for(const x of [{lat:NaN,lon:13.4},{lat:95,lon:13.4},{lat:52.52,lon:13.9}])expect(classifyForecastSpatialCache(berlin,x,bucket)).toBeNull()});
 it('preserves a genuine spatially exact 5 m threshold without treating 100 m as identical',()=>{expect(classifyForecastSpatialCache({lat:52.52003,lon:13.405},berlin,bucket)?.spatialMatch).toBe('exact');expect(forecastSpatialDistanceM(berlin,{lat:52.5209,lon:13.405})).toBeGreaterThan(95)});
 it('retains 18h emergency data while disallowing nearby fresh hit, warm start and alias writes',()=>{expect(part).toContain('FORECAST_CORE_STALE_MS=18*3600000');expect(part).toContain("cached.spatialMatch==='exact'&&cached.age<=FORECAST_CORE_FRESH_MS");expect(part).toContain("if(exact.spatialMatch!=='exact')return null");expect(part).not.toContain('writeForecastCoreCache(lat,lon,best.value,best.time,options)')});
 it('keeps origin private in storage and exposes only match, distance and user-visible explanation',()=>{expect(part).toContain('{time,value,origin:{lat,lon}}');expect(part).toContain('spatialNotice:notice');expect(part).toContain("stale:entry.age>FORECAST_CORE_FRESH_MS||match!=='exact'");expect(part).toContain('forecastCoreDimensionSuffix(options)')});
 it('ensures generated weather.ts is an exact concatenation of the four canonical fragments',()=>{const all=['00-types-models-search.tsfrag','10-observations-specialized.tsfrag','20-mapping-day-character.tsfrag','30-ensemble-climate-hazards.tsfrag'];expect(read('src/weather.ts')).toBe(all.map(p=>read('src/weather-src/'+p)).join(''))});

 it('runs the real cache adapter: online single-key reads, offline nearby, exact A→B→A and data integrity',async()=>{
  const source=read('src/weather.ts'),begin=source.indexOf("const FORECAST_CORE_CACHE_PREFIX="),end=source.indexOf("function linkedTimeoutSignal(",begin);
  expect(begin).toBeGreaterThan(0);expect(end).toBeGreaterThan(begin);
  const {code}=await transform(source.slice(begin,end),{loader:'ts',format:'cjs',target:'es2022'});
  const entries=new Map<string,string>();let reads=0,scans=0;
  const storage={
   getItem:(key:string)=>{reads++;return entries.get(key)??null},
   setItem:(key:string,value:string)=>entries.set(key,String(value)),
   removeItem:(key:string)=>entries.delete(key),
   key:(index:number)=>{scans++;return [...entries.keys()][index]??null},
   get length(){return entries.size}
  };
  const ctx:Record<string,unknown>={localStorage:storage,writeBoundedStorage:(store:typeof storage,key:string,value:unknown)=>store.setItem(key,JSON.stringify(value)),classifyForecastSpatialCache,module:{exports:{}},exports:{}};
  vm.createContext(ctx);
  vm.runInContext(code+';globalThis.cacheApi={readForecastCoreCache,writeForecastCoreCache,instantCachedCoreForecast,cachedForecastResult,forecastCoreCacheKey};',ctx);
  const api=ctx.cacheApi as {readForecastCoreCache:(lat:number,lon:number,opts?:Record<string,unknown>,allowNearby?:boolean)=>any;writeForecastCoreCache:(lat:number,lon:number,value:unknown,time?:number,opts?:Record<string,unknown>)=>void;instantCachedCoreForecast:(lat:number,lon:number,opts?:Record<string,unknown>)=>any;cachedForecastResult:(entry:any,reason:string)=>any;forecastCoreCacheKey:(lat:number,lon:number,opts?:Record<string,unknown>)=>string};
  const weather={latitude:50,longitude:7,utc_offset_seconds:0,current:{temperature_2m:7},hourly:{time:[]},daily:{time:[],precipitation_sum:[null]},_mid_core_proxy:{provider:'Open-Meteo Best Match',fallback:false}};
  api.writeForecastCoreCache(50,7,weather);
  expect(api.readForecastCoreCache(50,7)?.spatialMatch).toBe('exact');
  expect(api.instantCachedCoreForecast(50,7)).not.toBeNull();
  reads=0;scans=0;
  expect(api.readForecastCoreCache(50.01,7)).toBeNull();
  expect(reads).toBe(1);
  expect(scans).toBe(0); // Online should not deserialize all 14 large forecast snapshots.
  expect(api.instantCachedCoreForecast(50.0004,7)).toBeNull();
  const neighbor=api.readForecastCoreCache(50.01,7,{},true);
  expect(neighbor?.spatialMatch).toBe('nearby');
  expect(neighbor?.spatialFallbackDistanceM).toBeGreaterThan(1000);
  expect(api.cachedForecastResult(neighbor,'offline-local-cache')._mid_core_proxy.stale).toBe(true);
  expect(api.cachedForecastResult(neighbor,'offline-local-cache').daily.precipitation_sum[0]).toBeNull();
  expect(entries.has(api.forecastCoreCacheKey(50.01,7))).toBe(false); // No alias write.
  api.writeForecastCoreCache(50.01,7,{...weather,daily:{time:[],precipitation_sum:[0]}});
  expect(api.readForecastCoreCache(50,7)?.spatialMatch).toBe('exact');
  expect(api.readForecastCoreCache(50.01,7)?.spatialMatch).toBe('exact');
  expect(api.instantCachedCoreForecast(50.01,7).daily.precipitation_sum[0]).toBe(0);
  expect(api.readForecastCoreCache(50,7,{timeZone:'UTC'})).toBeNull();
  expect(api.readForecastCoreCache(50,7,{elevation:100})).toBeNull();
  entries.clear();
  entries.set(api.forecastCoreCacheKey(50,7),JSON.stringify({time:Date.now(),value:weather,origin:{lat:60,lon:7}}));
  expect(api.readForecastCoreCache(50,7,{},true)).toBeNull(); // Forged origin is rejected, never "unknown".
  entries.clear();
  entries.set(api.forecastCoreCacheKey(50,7),JSON.stringify({time:Date.now(),value:weather}));
  expect(api.readForecastCoreCache(50,7)).toBeNull();
  const unknown=api.readForecastCoreCache(50,7,{},true);
  expect(unknown?.spatialMatch).toBe('unknown');
  expect(api.cachedForecastResult(unknown,'offline-local-cache')._mid_core_proxy.stale).toBe(true);
  expect(api.instantCachedCoreForecast(50,7)).toBeNull();
  entries.clear();
  api.writeForecastCoreCache(50,7,weather,Date.now()-18*3600000+2000);
  expect(api.readForecastCoreCache(50,7)).not.toBeNull();
  entries.clear();
  api.writeForecastCoreCache(50,7,weather,Date.now()-18*3600000-1000);
  expect(api.readForecastCoreCache(50,7,{},true)).toBeNull();
 });
 it('discloses spatial uncertainty visibly and accessibly without exporting private origin coordinates',()=>{
  const app=read('src/App.tsx');
  expect(app).toContain('forecast-core-cache-hint spatial-unverified');
  expect(app).toContain('w._mid_core_proxy.spatialNotice');
  expect(app).toContain('aria-live="polite"');
  expect(app).toContain('Für diesen Standort konnte kein eigener aktueller Wetterstand geladen werden.');
  expect(part).not.toContain('sourceLatitude:');
  expect(part).not.toContain('sourceLongitude:');
  expect(part).toContain('if(!allowNearby)return null');
  expect(part).toContain('const nearby=readForecastCoreCache(lat,lon,options,true)');
 });

});

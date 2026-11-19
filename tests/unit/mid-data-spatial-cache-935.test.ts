import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
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
});

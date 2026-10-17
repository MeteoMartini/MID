import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const weather=readFileSync('src/weather.ts','utf8');
const app=readFileSync('src/App.tsx','utf8');
const mountain=readFileSync('src/mountainSports.ts','utf8');
const mountainView=readFileSync('src/MountainWeather.tsx','utf8');
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const test='scripts/test-location-mountain-resilience-0985283.mjs';

assert.match(pkg.version,/^0\.9\.85\.\d+$/);assert.ok(Number(pkg.version.split('.')[3])>=283,'Mountain cache must not regress below .283');
assert.equal(baseline.releaseVersion,pkg.version);
for(const list of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])
 assert.ok(baseline[list]?.includes(test),`Missing mandated regression ${list}`);
assert.ok(baseline.requiredFiles?.includes(test),'Missing required file declaration');

// Only exact coordinates, normalized elevation and timezone may warm-start a location.
// The 18-hour network-fallback/nearby cache MUST NOT become instant live weather.
assert.match(weather,/export function instantCachedCoreForecast\(lat:number,lon:number,options:ForecastRequestOptions=\{\}\)/);
assert.match(weather,/parseForecastCoreCache\(localStorage\.getItem\(forecastCoreCacheKey\(lat,lon,options\)\)\)/);
assert.match(weather,/if\(!exact\|\|exact\.age>45\*60\*1000\)return null/);
assert.match(weather,/cachedForecastResult\(exact,'network-fallback-local-cache'\)/);
assert.match(app,/setLocState\(normalized\);setW\(instantCachedCoreForecast\(normalized\.latitude,normalized\.longitude,\{/);
assert.match(app,/timeZone:normalized\.timezone\|\|\(normalized\.autolocated\?/);
assert.match(app,/elevation:normalized\.elevation/);
assert.match(app,/networkOnline&&loading&&w\?\._mid_core_proxy\?\.cached/);
assert.match(app,/Gespeicherte Ortsprognose/);
assert.match(app,/Aktualisierung läuft/);
assert.match(app,/abortAllRequests\(\);seq\.current\+\+/,'Old location requests must be invalidated');

// Normalized Best Match multi-point data is the only immediate mountain core.
// The regional model must never delay its first appearance.
assert.match(mountain,/async function fetchMountainCoreRows\(/);
assert.match(mountain,/\{rows:baseRows,splitRequest\}=await fetchMountainCoreRows\(points,params,signal\)/);
assert.doesNotMatch(mountain,/await Promise\.all\(\[basePromise,regionalPromise\]\)/);
assert.match(mountain,/regionalPlan&&entry\.regionalStatus==='loading'\)void fetchMountainRegionalForecast/);
assert.match(mountain,/enrichment:'regional-forecast',status:'ready',forecast:target\.forecast/);
assert.match(mountain,/mergeMountainRegionalForecast\(row,regionalRows!\[index\]\)/);
assert.match(mountain,/mountainWeatherWithUtci\(mergedWeather\[index\]\)/);
assert.match(mountain,/modelSnowDepthCm:Number\.isFinite\(depth\)/);
assert.match(mountain,/target\.regionalStatus='unavailable'/);
assert.match(mountain,/source\.id===regionalPlan\.id\?\{\.\.\.source,used:true/);

// Internal aborted network batches may fall back to complete independently retrieved
// point forecasts. User abort and rate-limits are never treated as a retryable success.
assert.match(mountain,/const individual=await Promise\.allSettled\(points\.map/);
assert.match(mountain,/query\.set\('latitude',String\(point\.latitude\)\)/);
assert.match(mountain,/query\.set\('elevation',String\(point\.elevation\)\)/);
assert.match(mountain,/row\.timezone===rows\[0\]\.timezone/);
assert.match(mountain,/JSON\.stringify\(row\.hourly\.time\)===JSON\.stringify\(rows\[0\]\.hourly\.time\)/);
assert.match(mountain,/signal\?\.aborted\)throw signal\.reason/);
assert.match(mountain,/response\.status===429/);
assert.match(mountain,/Höhenprognose derzeit nicht verfügbar/);
assert.match(mountainView,/regionalModel:'loading'\|'ready'\|'unavailable'/);
assert.match(mountainView,/retryNonce,setRetryNonce/);
assert.match(mountainView,/Höhenprognose erneut laden/);
assert.match(mountainView,/if\(!controller\.signal\.aborted\)setData\(forecast\)/);
assert.match(mountainView,/if\(!controller\.signal\.aborted\)setError\(/);

console.log('MID '+pkg.version+': exact-location warm start, provenance, independent mountain core, bounded full-schema retry, abort/rate-limit and regional enrichment protected.');

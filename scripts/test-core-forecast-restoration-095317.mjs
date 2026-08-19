import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [weather,app,worker,guard,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('src/openMeteoGuard.ts',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.53.17'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-core-forecast-restoration-095317.mjs'));

// Normal presentation contract: full Best Match data remain the canonical structure for all forecast tiles.
assert.match(weather,/probabilitySource\?:'ensemble-members-dwd'\|'daily-wet-derived'\|'hourly-max-fallback'/);
assert.match(weather,/weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match',weatherBundleKind:'best-match' as const/);
assert.match(weather,/probabilitySource:Number\.isFinite\(derivedDailyProbability\)\?'daily-wet-derived' as const:'hourly-max-fallback' as const/);
assert.doesNotMatch(weather,/provider-no-probability|weatherBundleKind:fallbackSource\?'provider-fallback'/);
assert.match(app,/stationLoading\?'Prüfung läuft':'Best Match'/);
assert.match(app,/Fallback auf Best Match/);
assert.match(app,/örtlichen Best-Match-Hintergrund/);
assert.doesNotMatch(app,/unabhängigen Ersatzmodell|unabhängige Kernvorhersage/);

// Foreground is direct Best Match first, while all requests still share the app-wide guard.
assert.match(weather,/const useDirectFirst=priority==='foreground'/);
assert.match(weather,/if\(useDirectFirst\)\{try\{const value=await directOpenMeteoCoreForecast/);
assert.match(weather,/guardedOpenMeteoJson<Weather>\(url,\{signal,cache:'no-store'\},\{priority,maxRetries:/);
assert.match(guard,/const MAX_ACTIVE=2/);
assert.match(guard,/PRIORITY_WEIGHT:Record<OpenMeteoPriority,number>=\{foreground:0,normal:1,background:2\}/);

// Cached v15/v16 fallback payloads cannot contaminate the restored tiles.
assert.match(weather,/FORECAST_CORE_CACHE_PREFIX='mid:forecast-core:v3:'/);
assert.match(weather,/FORECAST_CORE_LEGACY_CACHE_PREFIXES=\['mid:forecast-core:v2:','mid:forecast-core:v1:'\]/);
assert.match(weather,/meta\?\.fallback!==true&&!\/MET Norway\/i/);
assert.match(weather,/if\(!primaryCoreForecast\(value\)\)return/);

// Worker is only an Open-Meteo Best Match resilience/cache path for the core forecast.
assert.match(worker,/coreForecastCacheRequest\(lat,lon\).*\/v2\//s);
const core=worker.slice(worker.indexOf('async function openMeteoCoreForecast'),worker.indexOf('async function openMeteoEnsembleProxy'));
assert.match(core,/provider:'Open-Meteo Best Match',fallback:false/);
assert.doesNotMatch(core,/metNorwayCoreForecast|independentFallback|fallback:true/);

// DWD-style daily PoP presentation from v0.9.53.14 is intentionally retained.
assert.match(weather,/highest>0&&highest-second>=15&&highest-restMean>=20\?ranked\[0\]:undefined/);
assert.match(weather,/if\(primary<=0\)return'0%'/);
console.log('MID v0.9.53.17: vollständige Best-Match-Prognose und klassische Kacheldarstellung wiederhergestellt; Rate-Limit-/Cache-Schutz bleibt appweit erhalten, ohne Cross-Provider-Downgrade.');

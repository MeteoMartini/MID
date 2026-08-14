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
assert.ok(/^0\.9\.53\.(?:16|1[7-9]|[2-9]\d|\d{3,})$/.test(pkg.version));
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-core-forecast-independent-fallback-095316.mjs'));
assert.match(weather,/const workerConfigured=workerBaseCandidates\('general'\)\.length>0;if\(workerConfigured\)\{/);
assert.doesNotMatch(weather,/const preferWorker=priority==='foreground'/);
assert.match(weather,/timezone:String\(timeZone\|\|''\)\.trim\(\)\|\|undefined/);
assert.match(weather,/registerOpenMeteoCooldown\(Date\.now\(\)\+120_000\)/);
assert.match(weather,/coreForecastUsesIndependentFallback/);
assert.match(weather,/weatherBundleKind:fallbackSource\?'provider-fallback'/);
assert.match(weather,/probabilityUnavailable:!probabilityAvailable/);
assert.match(weather,/provider-no-probability/);
assert.match(guard,/export function registerOpenMeteoCooldown/);
assert.match(worker,/MET_NORWAY_LOCATIONFORECAST='https:\/\/api\.met\.no\/weatherapi\/locationforecast\/2\.0\/complete'/);
assert.match(worker,/User-Agent':`MID-weather-dashboard\/\$\{WORKER_VERSION\} https:\/\/midwx\.app\/`/);
assert.match(worker,/async function metNorwayCoreForecast/);
assert.match(worker,/const independentFallback=async\(upstreamStatus,reason\)=>/);
assert.match(worker,/provider:'MET Norway Locationforecast',fallback:true/);
assert.match(app,/coreForecastSourceLabel,coreForecastUsesIndependentFallback/);
assert.match(app,/timeZone:loc\.timezone\|\|\(loc\.autolocated\?Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone:undefined\),elevation:loc\.elevation/);
assert.match(app,/Open-Meteo ist vorübergehend nicht belastbar; Kernvorhersage transparent aus/);
assert.match(app,/Im unabhängigen Ersatzmodell derzeit nicht verfügbar/);
assert.match(eventEngine,/forecast\(location\.latitude,location\.longitude,signal,\{priority:'normal',forceFresh,timeZone:location\.timezone,elevation:location\.elevation\}\)/);
assert.match(twin,/forecast\(location\.latitude,location\.longitude,signal,\{priority:'background',timeZone:location\.timezone,elevation:location\.elevation\}\)/);

// Runtime: primary provider rate-limited, no edge cache yet, independent provider still yields a valid core forecast.
const originalFetch=globalThis.fetch,originalCaches=globalThis.caches;
const now=Date.now(),hour=3600000;
const timeseries=Array.from({length:60},(_,index)=>{
 const epoch=now-2*hour+index*hour,temp=18+Math.sin(index/8)*4,precip=index%13===0?0.4:0,prob=precip?45:10;
 return{time:new Date(epoch).toISOString(),data:{instant:{details:{air_temperature:Number(temp.toFixed(1)),relative_humidity:68,dew_point_temperature:Number((temp-5).toFixed(1)),air_pressure_at_sea_level:1016,wind_speed:2.5,wind_from_direction:240,wind_speed_of_gust:5.2,cloud_area_fraction:45,cloud_area_fraction_low:25,cloud_area_fraction_medium:12,cloud_area_fraction_high:8}},next_1_hours:{summary:{symbol_code:precip?'rainshowers_day':'partlycloudy_day'},details:{precipitation_amount:precip,}}}};
});
const metPayload={type:'Feature',geometry:{type:'Point',coordinates:[7.06,50.78,53]},properties:{meta:{updated_at:new Date(now).toISOString()},timeseries}};
let openMeteoCalls=0,metCalls=0;
globalThis.caches={default:{match:async()=>undefined,put:async()=>undefined}};
globalThis.fetch=async input=>{
 const url=String(input instanceof Request?input.url:input);
 if(url.includes('api.open-meteo.com')){openMeteoCalls++;return new Response(JSON.stringify({error:true,reason:'Too Many Requests'}),{status:429,headers:{'content-type':'application/json','retry-after':'60'}})}
 if(url.includes('api.met.no/weatherapi/locationforecast/2.0/complete')){metCalls++;return new Response(JSON.stringify(metPayload),{status:200,headers:{'content-type':'application/json'}})}
 throw new Error(`unexpected network call: ${url}`);
};
try{
 const workerPath=new URL('worker/metar-proxy.js',root);
 const module=await import(`${pathToFileURL(workerPath.pathname).href}?test=${Date.now()}`);
 const response=await module.default.fetch(new Request('https://worker.invalid/?mode=forecast-core&lat=50.78&lon=7.06&timezone=Europe%2FBerlin&elevation=53'),{});
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload?._mid_core_proxy?.provider,'MET Norway Locationforecast');
 assert.equal(payload?._mid_core_proxy?.fallback,true);
 assert.equal(payload?._mid_core_proxy?.upstreamStatus,429);
 assert.equal(payload?._mid_core_proxy?.precipitationProbabilityAvailable,false);
 assert.equal(payload?.timezone,'Europe/Berlin');
 assert.ok(Array.isArray(payload?.hourly?.time)&&payload.hourly.time.length>=18);
 assert.ok(Array.isArray(payload?.daily?.time)&&payload.daily.time.length>=2);
 assert.ok(Number.isFinite(Number(payload?.current?.temperature_2m)));
 assert.ok(openMeteoCalls>=1);
 assert.equal(metCalls,1);
}finally{
 globalThis.fetch=originalFetch;
 if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
}
console.log('MID v0.9.53.16: Kernvorhersage bleibt bei Open-Meteo-429 ohne Vorcache über unabhängigen MET-Norway-Workerfallback verfügbar; alle Core-Abrufe sind worker-first.');

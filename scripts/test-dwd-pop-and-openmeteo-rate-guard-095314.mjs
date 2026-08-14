import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [guard,weather,app,twin,verification,aviation,meteogram,mountain,seasonal,travel,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('src/openMeteoGuard.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/twinBackgroundLearning.ts',root),'utf8'),
 readFile(new URL('src/forecastVerification.ts',root),'utf8'),
 readFile(new URL('src/eventAviation.ts',root),'utf8'),
 readFile(new URL('src/MeteogramPanel.tsx',root),'utf8'),
 readFile(new URL('src/mountainSports.ts',root),'utf8'),
 readFile(new URL('src/seasonalForecast.ts',root),'utf8'),
 readFile(new URL('src/travelPlanner.ts',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
assert.ok(/^0\.9\.53\.(?:1[4-9]|[2-9]\d|\d{3,})$/.test(pkg.version),`Unerwartete Version ${pkg.version}; erwartet wird mindestens 0.9.53.14 innerhalb der stabilen 0.9.53-Reihe.`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-dwd-pop-and-openmeteo-rate-guard-095314.mjs'));

// Tages-PoP: 0 % ohne Fenster, ansonsten nur klar isolierten 6-h-Schwerpunkt hervorheben.
assert.match(weather,/highest>0&&highest-second>=15&&highest-restMean>=20\?ranked\[0\]:undefined/);
assert.match(weather,/if\(primary<=0\)return'0%'/);
assert.match(weather,/`00–24h · \$\{primary\}%`/);
assert.match(weather,/hourlyPeak\?hourlyProbabilityWindowCompactLabel\(hourlyPeak\):'00–24h'/);

// Ein gemeinsamer Open-Meteo-Requestschutz muss Foreground/Normal/Background priorisieren,
// Parallelität begrenzen, 429-Cooldown teilen und gleiche JSON-Anfragen deduplizieren.
assert.match(guard,/export type OpenMeteoPriority='foreground'\|'normal'\|'background'/);
assert.match(guard,/const MAX_ACTIVE=2/);
assert.match(guard,/const START_GAP_MS=220/);
assert.match(guard,/const MAX_429_COOLDOWN_MS=90_000/);
assert.match(guard,/PRIORITY_WEIGHT:Record<OpenMeteoPriority,number>=\{foreground:0,normal:1,background:2\}/);
assert.match(guard,/jsonInflight=new Map<string,Promise<unknown>>\(\)/);
assert.match(guard,/response\.status===429/);
assert.match(guard,/priority==='background'&&cooldownUntil>Date\.now\(\)/);
assert.match(guard,/const signal=init\.signal\?\?undefined/);
assert.doesNotMatch(guard,/acquire\(priority,init\.signal\)/);

// Kernvorhersage: kurzer Fresh-Cache + langer Stale-if-rate-limit verhindert Favoriten-429 nach Resume.
assert.match(weather,/FORECAST_CORE_FRESH_MS=8\*60\*1000/);
assert.match(weather,/FORECAST_CORE_STALE_MS=18\*3600000/);
assert.match(weather,/FORECAST_CORE_(?:LEGACY_)?CACHE_PREFIX/);
assert.match(weather,/cached&&\(isOpenMeteoRateLimitError\(error\)\|\|priority==='foreground'\)\)return cached\.value/);
assert.match(app,/forecast\(loc\.latitude,loc\.longitude,forecastController\.signal,\{priority:'foreground',forceFresh:options\.forceFresh===true,timeZone:[^}]+,elevation:loc\.elevation\}\)/);
assert.match(app,/load\(\{forceFresh:true\}\)/);
assert.match(app,/isOpenMeteoRateLimitError\(reason\)/);
assert.doesNotMatch(app,/setError\('HTTP 429'\)/);

// Hintergrundlernprozess darf bei Rate Limit nicht weiter alle Favoriten abarbeiten.
assert.match(twin,/forecast\([^\n]+\{priority:'background',timeZone:location\.timezone,elevation:location\.elevation\}\)/);
assert.match(twin,/ensembles\([^\n]+,'background'\)/);
assert.match(twin,/BETWEEN_FAVORITES_MS=3500/);
assert.match(twin,/isOpenMeteoRateLimitError\(error\)/);

// Weitere direkte Open-Meteo-Verbraucher verwenden denselben Guard statt eigener unkoordinierter Fetches.
for(const [name,text] of [['forecastVerification',verification],['eventAviation',aviation],['MeteogramPanel',meteogram],['mountainSports',mountain],['seasonalForecast',seasonal],['travelPlanner',travel]]){
 assert.match(text,/openMeteoGuard/,`${name}: gemeinsamer Open-Meteo-Guard fehlt`);
}
assert.doesNotMatch(verification,/await fetch\(url\.toString\(\),\{signal,cache:'no-store'\}\)/);
assert.doesNotMatch(aviation,/await fetch\(endpoint\(/);
assert.doesNotMatch(meteogram,/await fetch\(directEndpoint\(/);

console.log('MID v0.9.53.14+: DWD-nahe Tages-PoP-Zeitfenster, appweiter Open-Meteo-429-Schutz und quellensicherer Core-Requestvertrag geprüft.');

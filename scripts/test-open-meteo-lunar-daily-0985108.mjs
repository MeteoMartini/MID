import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [weatherSource,weather,astronomy,workerSource,worker,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('src/weather-src/00-types-models-search.tsfrag',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/astronomy.ts',root),'utf8'),
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const dailyToken="'sunrise','sunset','moonrise','moonset','moon_phase','precipitation_sum'";

for(const [label,source] of [['kanonische Wetterquelle',weatherSource],['generiertes Wetteraggregat',weather]])
 assert.ok(source.includes(dailyToken),`${label}: Open-Meteo-Daily-Anfrage enthält moonrise/moonset/moon_phase nicht vollständig.`);

for(const [label,source] of [['kanonischer Worker',workerSource],['generierter Worker',worker]]){
 assert.ok(source.includes("sunrise,sunset,moonrise,moonset,moon_phase,precipitation_sum"),`${label}: Core-Forecast reicht die neuen Mondfelder nicht durch.`);
 assert.ok(source.includes("CORE_FORECAST_EDGE_CACHE_VERSION='v4'"),`${label}: Edge-Cache wurde für das erweiterte Daily-Schema nicht invalidiert.`);
}

assert.match(astronomy,/function openMeteoDailyAstronomy\(/,'Open-Meteo-Mondfelder werden nicht in den Astronomievertrag übernommen.');
assert.match(astronomy,/dates\.indexOf\(date\)/,'Open-Meteo-Mondwerte müssen über das lokale Kalenderdatum zugeordnet werden.');
assert.match(astronomy,/parsed>=0&&parsed<=1\?parsed:undefined/,'moon_phase muss als normierter Bereich 0…1 validiert werden.');
assert.match(astronomy,/moonrise=openMeteoMoon\.moonrise\?\?moonTimes\.moonrise/,'moonrise muss Open-Meteo primär und lokale Astronomie als Fallback nutzen.');
assert.match(astronomy,/moonset=openMeteoMoon\.moonset\?\?moonTimes\.moonset/,'moonset muss Open-Meteo primär und lokale Astronomie als Fallback nutzen.');
assert.match(astronomy,/moonPhaseFraction:openMeteoMoon\.moonPhaseFraction\?\?descriptor\.phase/,'moon_phase muss Open-Meteo primär und den lokalen Phasenwert als Fallback nutzen.');
assert.match(astronomy,/Illumination\(Body\.Moon,at\)/,'Lokale Mondbeleuchtung muss unabhängig von den neuen API-Feldern erhalten bleiben.');
assert.match(astronomy,/previousNewMoon\(at\)/,'Lokales Mondalter muss erhalten bleiben.');
assert.match(astronomy,/nextEclipseForLocation\(/,'Lokale Finsternisberechnung muss erhalten bleiben.');

const test='scripts/test-open-meteo-lunar-daily-0985108.mjs';
assert.equal(pkg.version,'0.9.85.108','Open-Meteo-Watch-Integration gehört zu MID v0.9.85.108.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Mond-Daily-Regression fehlt in requiredRegressionTests.');
assert.ok(baseline.regressionTests.includes(test),'Mond-Daily-Regression fehlt in regressionTests.');
console.log('MID v0.9.85.108: Open-Meteo moonrise/moonset/moon_phase primär, lokale Astronomie als robuster Fallback geschützt.');

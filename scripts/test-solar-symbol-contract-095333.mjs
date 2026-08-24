import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [astronomy,weather,shortTerm,fusion,app,cockpit,worker,contract,uiContract,source,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('src/astronomy.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/ShortTermForecast.tsx',root),'utf8'),
 readFile(new URL('src/forecastFusion.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('worker/metar-proxy.js',root),'utf8'),
 readFile(new URL('MID_SOLAR_SYMBOL_CONTRACT.md',root),'utf8'),
 readFile(new URL('MID_UI_ARCHITECTURE_CONTRACT.md',root),'utf8'),
 readFile(new URL('MID_SOURCE_OF_TRUTH.md',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-solar-symbol-contract-095333.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Release und Baseline müssen synchron sein.');

assert.match(astronomy,/export function solarDaylightWindowAt\(/,'Kanonisches Sonnenfenster fehlt.');
assert.match(astronomy,/export function astronomicalIsDayAt\(/,'Kanonische Tag-/Nachtfunktion fehlt.');
assert.match(astronomy,/date\.getTime\(\)>=Number\(sunrise\)&&date\.getTime\(\)<Number\(sunset\)/,'Tag-/Nachtgrenze muss exakt Sonnenaufgang <= t < Sonnenuntergang sein.');
assert.match(astronomy,/sunTimesForDate\(/,'Symbolvertrag muss dieselbe astronomische Rise-/Set-Berechnung wie Sonne/Mond verwenden.');

assert.match(weather,/mapHours[\s\S]*astronomicalIsDayAt\(epoch/,'Stundenprognose verwendet nicht die astronomische Grenze.');
assert.match(weather,/mapHours[\s\S]*sunriseEpoch[\s\S]*sunsetEpoch[\s\S]*isDay/,'Stundenpunkte führen die Sonnenstandsgrenzen nicht mit.');
assert.match(weather,/mapMinutely15[\s\S]*astronomicalIsDayAt\(epoch/,'15-Minuten-Prognose verwendet nicht die astronomische Grenze.');
assert.match(weather,/mapMinutely15[\s\S]*sunriseEpoch[\s\S]*sunsetEpoch[\s\S]*isDay/,'15-Minuten-Punkte führen den exakten Sonnenstatus nicht mit.');

assert.match(shortTerm,/function daylightFromBoundaries[\s\S]*epoch>=Number\(sunriseEpoch\)&&epoch<Number\(sunsetEpoch\)/,'Kurzfristinterpolation hat keine minutengenaue Sonnenstandsgrenze.');
assert.match(shortTerm,/interpolatedHour[\s\S]*daylightFromBoundaries\(epoch,near\.sunriseEpoch,near\.sunsetEpoch,near\.isDay\)/,'Interpolierte Stunden übernehmen weiterhin blind den Nachbarstundenstatus.');
assert.match(shortTerm,/targetIsDay=quarter\?\.isDay\?\?daylightFromBoundaries\(target,base\.sunriseEpoch,base\.sunsetEpoch,base\.isDay\)/,'15-Minuten-/90-Minuten-Zielpunkte verwenden nicht den exakten Sonnenstatus.');
assert.match(fusion,/isDay:row\.isDay\?\?finalHour\?\.isDay/,'Forecast-Finalisierung überschreibt den 15-Minuten-Sonnenstatus.');

assert.match(cockpit,/WeatherPictogram code=\{item\.code\} day=\{item\.isDay\}/,'90-Minuten-Cockpit verwendet den finalen Sonnenstatus nicht.');
assert.match(cockpit,/WeatherPictogram code=\{point\.code\} day=\{point\.isDay\}/,'Stündliches Cockpit verwendet den finalen Sonnenstatus nicht.');
assert.match(app,/currentIsDay=astronomicalIsDayAt\(solarNow/,'Aktuelles Hauptpiktogramm verwendet nicht die zentrale Sonnenstandsentscheidung.');
assert.match(app,/isDay=\{astronomicalIsDayAt\(Date\.now\(\)/,'Aktuelle Komposit-/Bergdarstellung ist nicht an den astronomischen Sonnenstand gebunden.');
assert.match(app,/isDay:astronomicalIsDayAt\(sample\.epoch/,'Höhenwetter-Zeitpunkte verwenden nicht die astronomische Grenze.');
assert.doesNotMatch(app,/WeatherPictogram[^\n]*day=\{Number\([^\n]*is_day/,'Sichtbares Piktogramm darf Provider-is_day nicht direkt als Tag/Nachtentscheidung verwenden.');

assert.match(worker,/function widgetAstronomicalIsDay\(/,'Native Widget-Sonnenstandsentscheidung fehlt.');
assert.match(worker,/return sunrise&&sunset&&sunset>sunrise\?stamp>=sunrise&&stamp<sunset:Boolean\(fallback\)/,'Widget muss exakt zwischen täglichem Sonnenaufgang und Sonnenuntergang Tag sein.');
assert.match(worker,/currentIsDay=widgetAstronomicalIsDay\(current\.time,daily,Number\(current\.is_day\)===1\)/,'Widget-Aktuellwert verwendet nicht die Sonnenstandsgrenze.');
assert.match(worker,/isDay:currentIsDay\},hourly:hourRows/,'Widget-Ausgabe gibt für aktuell noch den rohen Providerstatus aus.');
assert.match(worker,/const isDay=widgetAstronomicalIsDay\(time,daily,Number\(at\(hourly\.is_day,index\)\)===1\)/,'Widget-Stunden verwenden nicht die Sonnenstandsgrenze.');

assert.match(contract,/Tag:\*\* `Zeitpunkt >= Sonnenaufgang && Zeitpunkt < Sonnenuntergang`/,'Vertrag dokumentiert die exakte Grenze nicht.');
assert.match(contract,/`is_day` eines Wetterproviders ist \*\*nicht\*\* die primäre sichtbare Symbolentscheidung/,'Provider-Fallbackregel fehlt im Vertrag.');
assert.match(uiContract,/Astronomische Tag-\/Nachtsymbole/,'UI-Vertrag bindet den Sonnenstandsvertrag nicht ein.');
assert.match(source,/astronomischer Symbolvertrag/,'Source of Truth bindet den Sonnenstandsvertrag nicht ein.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Sonnenstandsvertrag ist nicht als Required Regression geschützt.');
assert.ok(baseline.requiredFiles.includes('MID_SOLAR_SYMBOL_CONTRACT.md'),'Sonnenstandsvertrag ist nicht als Required File geschützt.');

console.log(`MID v${pkg.version}: zeitpunktbezogene Wetterpiktogramme wechseln app-weit exakt an Sonnenaufgang/Sonnenuntergang; 90-Minuten- und Widgetpfade geprüft.`);

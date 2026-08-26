import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,fusion,panel,travel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/forecastFusion.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('src/travelPlanner.ts','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

// Aktuelle Niederschlagswahrscheinlichkeit: kein synthetischer 5-%-Boden.
assert.ok(app.includes("probability=maxProb<=5&&!continuation?0:Number(nearest.probability)||0"),'Trockene aktuelle Kurzfristlage wird nicht auf 0 % zurückgeführt.');
assert.ok(fusion.includes('safeModelProbability<=5&&radarProbability<=5?0:'),'Radar-/Modell-Trockenkonsens bis 5 % wird nicht auf 0 % gesetzt.');
assert.ok(fusion.includes('probability=safeModelProbability<=5?0:blendedProbability'),'Vollständig trockene Radarabdeckung behält einen künstlichen Restwert.');

// Reisewetter: erwartete Regentage werden nur in der Anzeige gerundet; interne Erwartungswerte bleiben kontinuierlich.
assert.ok(panel.includes('rund ${Math.round(active.summary.wetDaysExpected)} Tage mit ≥ 1 mm'),'Reiseplaner rundet erwartete Niederschlagstage nicht auf ganze Tage.');
assert.ok(travel.includes('const roundedWetDays=Math.round(summary.wetDaysExpected)'),'Reisenarrativ rundet Niederschlagstage nicht auf ganze Tage.');

// Küsten-Wassertemperatur: NOAA-OISST-Klimatologie statt aktuellem Marinewert oder leerem ERA5-Ocean-Feld.
for(const token of [
 "const WATER_CACHE_PREFIX='mid:travel-water-climate:noaa-oisst-1991-2020:v5:'",
 "fetchWorkerJson<TravelWaterWorkerPayload>('travel-water-climate'",
 "payload.schema!=='mid.travel-water-climate.v1'",
 'export async function fetchTravelWaterClimatology('
])assert.ok(travel.includes(token),`Klimatologische Wassertemperatur fehlt: ${token}`);
assert.ok(panel.includes('fetchTravelWaterClimatology(destination,active.start,active.end,controller.signal)'),'Reisezeitraum wird nicht an die SST-Klimatologie gebunden.');
assert.ok(!panel.includes('marineForecast('),'Reiseplaner verwendet wieder aktuelle Marine-Wassertemperaturen.');
assert.ok(!panel.includes('sea_surface_temperature_mean'),'Nicht unterstützte tägliche SST-Aggregation ist wieder aktiv.');
assert.ok(!travel.includes("models:'era5_ocean'")&&!travel.includes('MARINE_ARCHIVE_ENDPOINT'),'Reise-SST verwendet weiterhin den real leeren ERA5-Ocean-Pfad.');
assert.ok(panel.includes('NOAA-OISST-Mittel für den Reisezeitraum'),'NOAA-OISST-Herkunft ist an der Wassertemperatur nicht erkennbar.');

// Aktuelle Warnlage bleibt streng an die Gültigkeitszeit gebunden: ein ab 23:00 gültiges Signal ist um 22:51 noch nicht aktuell.
assert.ok(app.includes('start<=now&&end>now'),'Warnkopf trennt zukünftige von aktuell gültigen Warnfenstern nicht mehr sauber.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-current-dry-pop-travel-water-096511.mjs';
const versionParts=String(pkg.version).split('.').map(Number);assert.ok(versionParts[0]>0||versionParts[1]>9||versionParts[2]>65||(versionParts[2]===65&&(versionParts[3]??0)>=11),`Version muss mindestens 0.9.65.11 sein: ${pkg.version}`);
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Version nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: trockener Nowcast 0 %, klimatologische NOAA-OISST, ganze Niederschlagstage und zeitstrenger Warnkopf geprüft.`);

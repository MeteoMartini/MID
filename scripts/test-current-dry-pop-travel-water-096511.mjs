import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const [app,fusion,panel,travel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/forecastFusion.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('src/travelPlanner.ts','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

// Aktuelle Niederschlagswahrscheinlichkeit: kein synthetischer 5-%-Boden.
// Real MID forecast function: a genuinely dry 0–5% forecast retains 0%,
// whereas absent/invalid PoP is explicitly unknown, never synthetically dry.
assert.ok(app.includes('nearestProb===null?null:maxProb!==null&&maxProb<=5?0:nearestProb'),'Trocken-Konsens darf nur bei belegter PoP 0% ausgeben.');
assert.ok(app.includes('if(!timeline.slots.length)return{probability:null'),'Ohne Vorhersageslots darf keine künstliche Trockenheit entstehen.');
const begin=app.indexOf('function precipitationNowSummary('),end=app.indexOf('\n}',begin);
assert.ok(begin>=0&&end>begin,'Original PrecipNow-Quellfunktion fehlt');
const source=app.slice(begin,end+2)+'\nglobalThis.__checkPrecip=precipitationNowSummary;';
const fake={canonicalPrecipitationTimeline:()=>({source:'15-min',slots:[],periods:[]}),currentIndex:()=>0,precipitationBeyondTwoHours:()=>''};
vm.runInNewContext(transformSync(source,{loader:'ts',format:'iife',target:'es2022'}).code,fake);
const actual=fake.__checkPrecip;
assert.equal(actual([],[]).probability,null,'Ohne Daten keine 0%-Aussage');
const now=Date.now();
fake.canonicalPrecipitationTimeline=prob=>({source:'15-min',slots:[{startEpoch:now-120000,endEpoch:now+120000,sample:{probability:prob}}],periods:[]});
const probe=value=>{const orig=fake.canonicalPrecipitationTimeline;fake.canonicalPrecipitationTimeline=()=>orig(value);const result=actual([],[]);fake.canonicalPrecipitationTimeline=orig;return result.probability;};
for(const missing of [null,undefined,-1,101,Number.NaN])assert.equal(probe(missing),null,'Fehlende oder invalide Wahrscheinlichkeit bleibt unbekannt');
for(const dry of [0,1,5])assert.equal(probe(dry),0,'Trockene vorhandene 0–5% bleibt 0%');
assert.equal(probe(9),9,'Verifizierte 9% bleiben 9% ohne künstlichen 5%-Boden');
assert.equal(probe(87),87,'Hohes originales Niederschlagsrisiko darf nicht verändert werden');

assert.ok(app.includes("canonicalPrecipitationTimeline(minutes,hours,now,24)"),'Trockenkonsens muss auf der kanonischen Kurzfrist-Zeitreihe basieren.');
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
console.log(`MID v${pkg.version}: belegte Trockenheit 0 %, fehlende PoP unbekannt, klimatologische NOAA-OISST, Niederschlagstage und zeitstrenger Warnkopf geprüft.`);

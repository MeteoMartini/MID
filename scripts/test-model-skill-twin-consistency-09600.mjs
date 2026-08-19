import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [family,twin,app,weatherSrc,weather,fusion,worker,panel,pkgText,baselineText]=await Promise.all([
 read('src/modelFamilyContract.ts'),read('src/forecastVerification.ts'),read('src/App.tsx'),read('src/weather-src/00-types-models-search.tsfrag'),read('src/weather.ts'),read('src/forecastFusion.ts'),read('worker/metar-proxy.js'),read('src/EnsemblePanel.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-model-skill-twin-consistency-09600.mjs';
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test),'P0-P2-Test muss verpflichtend sein.');

// P0: abgeleitete Kontrollprodukte lernen niemals als unabhängige Modelle.
for(const id of ['mid_best_match_quality','mid_best_match_quality_model'])assert.ok(family.includes(`'${id}'`),`Kontroll-ID fehlt: ${id}`);
assert.ok(family.includes("!['anchor','derived','postprocessing','diagnostic'].includes"),'Consensus-Rollen werden nicht vom Lernen getrennt.');
assert.match(app,/mid_best_match_quality'.*consensusRole:'derived'/s);
assert.match(app,/mid_best_match_quality_model'.*consensusRole:'derived'/s);
assert.ok(twin.includes('modelPredictionIsLearnable')&&twin.includes('normalizedPredictionForLearning'),'Wetterzwilling muss Lernkandidaten über den gemeinsamen Familienvertrag normalisieren.');

// P0: tägliches Niederschlagsereignis statt Stunden-Max-PoP.
for(const token of ['canonicalDailyWetProbability','dailyWetProbabilityFromHours',"'daily-wet-derived'",'probabilityKind'])assert.ok(weather.includes(token)||twin.includes(token),`Tages-PoP-Vertrag fehlt: ${token}`);
assert.ok(fusion.includes('probability:day.probability')&&fusion.includes('probabilitySource:day.probabilitySource'),'Forecast-Fusion darf die kanonische Tages-PoP nicht durch precipitation_probability_max ersetzen.');
assert.ok(!fusion.includes('probability=Number(fused.probability)'),'Nicht mehr verwendete Fusions-Max-PoP darf den TypeScript-Pfad nicht belasten.');
assert.ok(!twin.includes('referenceValue('),'Wetterzwilling darf keinen undefinierten Alt-Helfer für Referenzwerte enthalten.');
assert.ok(twin.includes("['spread-estimate','hourly-max']"),'Nicht vergleichbare Wahrscheinlichkeiten dürfen nicht in denselben Brier-Score eingehen.');

// P1: stabile Modellidentität, Gruppenbudget und eindeutige Zieltage.
for(const token of ['stableModelIdentity','independenceGroup','ecmwf-aifs','ecmwf-ifs','noaa-ai','noaa-gfs'])assert.ok(family.includes(token),`Modellfamilienvertrag fehlt: ${token}`);
for(const token of ['dates:new Map<string','dayErrors','distributeGroupBudget','independenceGroup:identity.independenceGroup','new Set(weighted.map(row=>row.independenceGroup)).size<2','dayGroups=new Map<string','byDay=new Map<string'])assert.ok(twin.includes(token),`Effective-sample/group-budget Vertrag fehlt: ${token}`);
assert.ok(twin.includes('groups=new Map<string,ForecastPrediction[]>()'),'Equal-weighted Kontrollmittel muss Unabhängigkeitsgruppen gleich gewichten.');
assert.ok(twin.includes('validation.days<6'),'Adaptive Gewichte müssen nach eindeutigen Kontrolltagen freigeschaltet werden.');

// P1/P2: horizonweise Variantenwahl, tatsächliche Lauf-Frische, parameterspezifische Gewichte.
assert.ok(weatherSrc.includes("return{id:model.id,label:model.label,kind:'ensemble',metaIds:[model.metaId]"),'Run-Metadaten müssen dem konkreten Modell statt nur der Meta-ID zugeordnet werden.');
for(const token of ['effectiveModelFreshness','representativeResultsForDate',"parameter:EnsembleWeightParameter='general'",'variantSelectionScore','groupDivisor=Math.max(1,groupCounts.get(r.model.independenceGroup)'])assert.ok(weather.includes(token),`Ensemblegewichtung fehlt: ${token}`);
assert.ok(weather.includes("const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v15:'")&&weather.includes("const EVENT_ENSEMBLE_CACHE_PREFIX='mid:event-ensemble:v3:'"),'Ensemble-Caches wurden nach Gewichtsänderung nicht invalidiert.');
for(const token of ['forecastFusionFreshness','runFreshness','freshnessTargets=successful.slice(0,12)','const families=new Map()','budget=Math.max(...representatives.map(row=>row.weight))'])assert.ok(worker.includes(token),`Deterministische Fusions-Frische/Familienbudget fehlt: ${token}`);
assert.ok(fusion.includes("const CACHE_PREFIX='mid:forecast-fusion:v8:'"),'Forecast-Fusion-Cache wurde nicht invalidiert.');

// MeteoSwiss horizonrichtig.
assert.match(worker,/id:'meteoswiss_icon_ch1'.*maxDays:1\.4/s);assert.match(worker,/id:'meteoswiss_icon_ch2'.*maxDays:5/s);
assert.match(weatherSrc,/id:'meteoswiss_icon_ch1_ensemble'.*maxDays:1\.4/s);assert.match(weatherSrc,/id:'meteoswiss_icon_ch2_ensemble'.*maxDays:5/s);
assert.match(weatherSrc,/id:'meteoswiss_icon_ch2_ensemble_mean'.*maxDays:5/s);

// P2: Mean/Spread bleibt Schätzung und kann native Member-PoP nicht imitieren.
for(const token of ["probabilityQuality?:'native-members'|'estimated-spread'","precipitationProbabilityQuality?:'native-members'|'estimated-spread'","memberCount:native?rows.length:0","nativeRainProbabilityVals","estimatedRainProbabilityVals"])assert.ok(weather.includes(token),`Mean/Spread-Trennung fehlt: ${token}`);
assert.ok(panel.includes('keine native Member-PoP'),'UI muss geschätzte Spread-PoP transparent kennzeichnen.');
console.log(`MID v${pkg.version}: P0-P2 Model-Skill-, Wetterzwilling-, PoP-, Familien-, Frische- und Mean/Spread-Vertrag geprüft.`);

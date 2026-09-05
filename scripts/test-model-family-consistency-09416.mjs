import assert from 'node:assert/strict';
import fs from 'node:fs';

const event=fs.readFileSync('src/eventWeatherEngine.ts','utf8');
const weather=fs.readFileSync('src/weather.ts','utf8');
const fusion=fs.readFileSync('src/forecastFusion.ts','utf8');
const worker=fs.readFileSync('worker/metar-proxy.js','utf8');
const mountain=fs.readFileSync('src/mountainSports.ts','utf8');
const seasonal=fs.readFileSync('src/seasonalForecast.ts','utf8');

// Wetterplaner darf keine eigene rohe Wetterlogik führen, sondern nutzt denselben
// MID-Fusions-/Nowcast-/Niederschlagscharakter-Pfad wie das Dashboard.
for(const token of ['loadForecastFusion','applyForecastFusionDays','applyForecastFusionHours','finalizeForecastHours','precipitationParts'])assert.ok(event.includes(token),`Wetterplaner ohne gemeinsamen MID-Pfad: ${token}`);
for(const token of ['applyOperationalNowcastHours','applyConvectiveNowcastHours','reconcileCurrentTemperatureObservation','reconcileForecastHoursWithDays'])assert.ok(fusion.includes(token),`Gemeinsame MID-Endstufe ohne ${token}`);
assert.ok(event.includes("weatherLabel:representative?.part.type==='none'?label(representative.part.displayCode):representative?.part.weatherLabel"),'Wetterplaner muss plausibilisierte Niederschlags-/Wettertitel verwenden.');
assert.ok(event.includes("summary.weatherLabel?.includes('Sprühregen')"),'Sprühregen muss im Wetterplaner explizit aus der zentralen Plausibilisierung ableitbar sein.');

// Forecast fusion: Modellvarianten sind sichtbar, aber nur eine Stimme je unabhängiger Gruppe.
for(const token of ['independenceGroup','independentFusionRows','consensusRole'])assert.ok(worker.includes(token),`Forecast-Fusion ohne ${token}`);
assert.ok(worker.includes("result.consensusRole!=='postprocessing'"),'Postprocessing darf nicht als unabhängige Stimme gewertet werden.');
assert.ok(worker.includes('const families=new Map()')&&worker.includes('budget=Math.max(...representatives.map(row=>row.weight))'),'Pro Horizont muss ein geeigneter Vertreter je Familie gewählt und ein gemeinsames Gruppenbudget geteilt werden.');
assert.ok(worker.includes("maxHours:14,rapidUpdate:true"),'ICON-D2-RUC muss auf seine Rapid-Cycle-Reichweite begrenzt bleiben.');
for(const token of ['knmi_harmonie_europe','ukmo_ukv','metno_nordic','hrrr','nam','nbm','chmi_aladin_ce','ecmwf_ifs','ecmwf_aifs','gfs','aigfs','ukmo_global','gem_global','jma_gsm','kma_gdps','bom_access_global','cma_grapes_global','arpege_world'])assert.ok(worker.includes(`id:'${token}'`),`Modellfamilie fehlt im Worker-Katalog: ${token}`);
assert.ok(worker.includes("return chosen.slice(0,20)"),'Multi-Modell-Auswahl muss genug Platz für unabhängige Familien plus Fallbackvarianten lassen.');
assert.ok(worker.includes('fusionDailyPrecipitation'),'Teilweise verfügbare Globalmodelle dürfen fehlenden Niederschlag nicht als 0 mm vortäuschen.');
assert.ok(worker.includes('weatherBundleReady:hours.length>=12'),'Tageskonsens und Wetterbündel-Reparatur müssen getrennte Verfügbarkeitskriterien haben.');

// Frontend Ensemble: mehrere Auflösungen derselben Familie dürfen die Verteilung nicht vervielfachen.
assert.ok(weather.includes("const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v17:'"),'Ensemblecache muss nach Familien-/Frischegewichtungsänderung invalidiert werden.');
assert.ok(weather.includes('representativeResultsForDate')&&weather.includes('groupDivisor=Math.max(1,groupCounts.get(r.model.independenceGroup)'), 'Ensemble-Member müssen zuerst je Architektur/Horizont dedupliziert und danach innerhalb einer Unabhängigkeitsgruppe geteilt gewichtet werden.');
assert.ok(weather.includes('representativeResultsForDate')&&weather.includes('modelSummaries.push({id:r.model.id'), 'Ensemble-Modellübersicht muss horizonweise Familienvertreter verwenden.');
assert.ok(weather.includes('modelId:`${result.model.independenceGroup}::${result.model.family}`'), 'Szenario-Clustering muss Modellanteile gruppen- und architekturbasiert ausweisen.');
for(const token of ['ncep_aigefs025','ecmwf_aifs_europe_ensemble','google_weathernext2_ensemble','ukmo_global_ensemble_20km'])assert.ok(weather.includes(token),`Ensemblefamilie fehlt: ${token}`);

// Schneefallgrenze: IFS/AIFS bleiben sichtbar, ECMWF bekommt aber nur ein Familiengewicht.
assert.ok(mountain.includes("independenceGroup:'ecmwf'"),'Schneefallgrenze muss ECMWF-Varianten gruppieren.');
assert.ok(mountain.includes("const grouped=new Map<string,typeof rows>()"),'Schneefallgrenzen-Konsens muss familienweise aggregieren.');
assert.ok(mountain.includes('unabhängige Modellfamilien gleich gewichtet'),'Schneefallgrenzen-Methodik muss Familiengewichtung transparent machen.');

// Langfrist ist bereits familien-dedupliziert und darf nicht regressieren.
assert.ok(seasonal.includes('freshDeduped=preferredIndependentModels(freshModels)')&&seasonal.includes('model.independenceKey||model.modelKey||model.family'),'Saisonmodelle müssen über kanonische Unabhängigkeits-IDs dedupliziert bleiben.');

// Frontendvertrag des Workers muss Gruppen/Rollen transportieren.
assert.ok(fusion.includes("const CACHE_PREFIX='mid:forecast-fusion:v9:'"),'Forecast-Fusion-Cache muss nach Lage-/Horizont-/Regionalgewichtungsänderung invalidiert werden.');
assert.ok(fusion.includes('independenceGroup?:string'),'ForecastFusionSource muss independenceGroup transportieren.');
assert.ok(fusion.includes("consensusRole?:'independent'|'postprocessing'|'diagnostic'"),'ForecastFusionSource muss Postprocessing von unabhängigen Modellen trennen.');

console.log('Modellfamilien-, Rapid-Cycle- und Wetterplaner-Konsistenz geprüft.');

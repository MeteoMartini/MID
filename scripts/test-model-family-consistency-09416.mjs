import assert from 'node:assert/strict';
import fs from 'node:fs';

const event=fs.readFileSync('src/EventPlannerPanel.tsx','utf8');
const weather=fs.readFileSync('src/weather.ts','utf8');
const fusion=fs.readFileSync('src/forecastFusion.ts','utf8');
const worker=fs.readFileSync('worker/metar-proxy.js','utf8');
const mountain=fs.readFileSync('src/mountainSports.ts','utf8');
const seasonal=fs.readFileSync('src/seasonalForecast.ts','utf8');

// Wetterplaner darf keine eigene rohe Wetterlogik führen, sondern nutzt denselben
// MID-Fusions-/Nowcast-/Niederschlagscharakter-Pfad wie das Dashboard.
for(const token of ['loadForecastFusion','applyForecastFusionDays','applyForecastFusionHours','applyOperationalNowcastHours','applyConvectiveNowcastHours','precipitationParts'])assert.ok(event.includes(token),`Wetterplaner ohne gemeinsamen MID-Pfad: ${token}`);
assert.ok(event.includes("weatherLabel:part.type==='none'?label(part.displayCode):part.weatherLabel"),'Wetterplaner muss plausibilisierte Niederschlags-/Wettertitel verwenden.');
assert.ok(event.includes("summary.weatherLabel?.includes('Sprühregen')"),'Sprühregen muss im Wetterplaner explizit aus der zentralen Plausibilisierung ableitbar sein.');

// Forecast fusion: Modellvarianten sind sichtbar, aber nur eine Stimme je unabhängiger Gruppe.
for(const token of ['independenceGroup','independentFusionRows','consensusRole'])assert.ok(worker.includes(token),`Forecast-Fusion ohne ${token}`);
assert.ok(worker.includes("result.consensusRole!=='postprocessing'"),'Postprocessing darf nicht als unabhängige Stimme gewertet werden.');
assert.ok(worker.includes("items.sort((a,b)=>b.weight-a.weight"),'Pro Horizont muss ein geeigneter Vertreter je Familie gewählt werden.');
assert.ok(worker.includes("maxHours:14,rapidUpdate:true"),'ICON-D2-RUC muss auf seine Rapid-Cycle-Reichweite begrenzt bleiben.');
for(const token of ['knmi_harmonie_europe','ukmo_ukv','metno_nordic','hrrr','nam','nbm','chmi_aladin_ce','ecmwf_ifs','ecmwf_aifs','gfs','aigfs','ukmo_global','gem_global','jma_gsm','kma_gdps','bom_access_global','cma_grapes_global','arpege_world'])assert.ok(worker.includes(`id:'${token}'`),`Modellfamilie fehlt im Worker-Katalog: ${token}`);
assert.ok(worker.includes("return chosen.slice(0,20)"),'Multi-Modell-Auswahl muss genug Platz für unabhängige Familien plus Fallbackvarianten lassen.');
assert.ok(worker.includes('fusionDailyPrecipitation'),'Teilweise verfügbare Globalmodelle dürfen fehlenden Niederschlag nicht als 0 mm vortäuschen.');
assert.ok(worker.includes('weatherBundleReady:hours.length>=12'),'Tageskonsens und Wetterbündel-Reparatur müssen getrennte Verfügbarkeitskriterien haben.');

// Frontend Ensemble: mehrere Auflösungen derselben Familie dürfen die Verteilung nicht vervielfachen.
assert.ok(weather.includes("const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v12:'"),'Ensemblecache muss nach Familiengewichtungsänderung invalidiert werden.');
assert.ok(weather.includes('groupDivisor=Math.max(1,groupCounts.get(r.model.independenceGroup)'), 'Ensemble-Member müssen innerhalb einer Unabhängigkeitsgruppe geteilt gewichtet werden.');
assert.ok(weather.includes('independentModelSummaries'), 'Ensemble-Modellübersicht muss Familien deduplizieren.');
assert.ok(weather.includes('modelId:result.model.independenceGroup'), 'Szenario-Clustering muss Modellanteile familienbasiert ausweisen.');
for(const token of ['ncep_aigefs025','ecmwf_aifs_europe_ensemble','google_weathernext2_ensemble','ukmo_global_ensemble_20km'])assert.ok(weather.includes(token),`Ensemblefamilie fehlt: ${token}`);

// Schneefallgrenze: IFS/AIFS bleiben sichtbar, ECMWF bekommt aber nur ein Familiengewicht.
assert.ok(mountain.includes("independenceGroup:'ecmwf'"),'Schneefallgrenze muss ECMWF-Varianten gruppieren.');
assert.ok(mountain.includes("const grouped=new Map<string,typeof rows>()"),'Schneefallgrenzen-Konsens muss familienweise aggregieren.');
assert.ok(mountain.includes('unabhängige Modellfamilien gleich gewichtet'),'Schneefallgrenzen-Methodik muss Familiengewichtung transparent machen.');

// Langfrist ist bereits familien-dedupliziert und darf nicht regressieren.
assert.ok(seasonal.includes('freshDeduped=[...new Map(freshModels.map(model=>[model.family,model])).values()]'),'Saisonmodelle müssen pro Familie dedupliziert bleiben.');

// Frontendvertrag des Workers muss Gruppen/Rollen transportieren.
assert.ok(fusion.includes("const CACHE_PREFIX='mid:forecast-fusion:v7:'"),'Forecast-Fusion-Cache muss nach Familiengewichtungsänderung invalidiert werden.');
assert.ok(fusion.includes('independenceGroup?:string'),'ForecastFusionSource muss independenceGroup transportieren.');
assert.ok(fusion.includes("consensusRole?:'independent'|'postprocessing'|'diagnostic'"),'ForecastFusionSource muss Postprocessing von unabhängigen Modellen trennen.');

console.log('Modellfamilien-, Rapid-Cycle- und Wetterplaner-Konsistenz geprüft.');

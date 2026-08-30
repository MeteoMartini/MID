import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript-strada');
const [quality,weather,app,eventEngine,shortTerm,anchorCore,twin,worker,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/sourceQuality.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastLocalAnchor.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const compiled=ts.transpileModule(quality,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'sourceQuality.ts'});
assert.equal(compiled.diagnostics?.length??0,0,'sourceQuality.ts muss transpilerbar bleiben.');
const qualityModule=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

// Dynamische Felder: 90 min / 50 km dürfen keine hyperlokalen Temperaturanker mehr sein.
assert.equal(qualityModule.fieldObservationRelevance('temperature',90,5,0,10),0,'90 Minuten alte Temperatur darf nicht mehr ankern.');
assert.equal(qualityModule.fieldObservationRelevance('temperature',10,50,0,10),0,'50 km entfernte Temperatur darf nicht mehr ankern.');
assert.equal(qualityModule.fieldObservationRelevance('precipitation',45,2,0,5),0,'45 Minuten alter Punktniederschlag darf nicht mehr ankern.');
const freshTemp=qualityModule.fieldObservationRelevance('temperature',8,3,40,10),marginalTemp=qualityModule.fieldObservationRelevance('temperature',55,30,100,60);
assert.ok(freshTemp>marginalTemp*12,'Frische, nahe Temperaturmessung muss deutlich stärker gewichtet werden.');
assert.ok(qualityModule.fieldObservationRelevance('pressure',90,50,80,60)>0,'Luftdruck darf aufgrund seiner räumlichen Glätte länger/weiter stützen.');
assert.ok(qualityModule.fieldSiteCompatibility('temperature','urban','rural')<=.6,'Stadt/Land-Mismatch bei Temperatur muss deutlich gedämpft sein.');
assert.ok(qualityModule.fieldRelevanceLimits('temperature').hardAgeMinutes<=75,'Temperatur-Härtegrenze ist zu großzügig.');
assert.ok(qualityModule.fieldRelevanceLimits('temperature').hardDistanceKm<=45,'Temperatur-Distanzgrenze ist zu großzügig.');
assert.ok(qualityModule.fieldRelevanceLimits('precipitation').hardDistanceKm<=28,'Punktniederschlag ist räumlich zu großzügig.');

// Jeder Parameter muss seine eigene Provenienz/Aktualität behalten; kein jüngerer Windwert darf alte Temperatur künstlich verjüngen.
for(const token of ['fieldObservedAt?:Partial<Record<StationAnalysisField,string>>','function stationFieldObservationContext(','station.fieldSources?.[field]','fieldObservationRelevance(field','stationAgeMinutes(station.fieldObservedAt?.[field]??station.timestamp,now)','stationFieldObservationUsable('])assert.ok(weather.includes(token),`Parameter-Provenienz fehlt: ${token}`);
assert.ok(weather.includes("backgroundModel:backgroundSet.modelLabel"),'Hyperlokale Analyse weist das tatsächlich verwendete Regionalmodell nicht aus.');
assert.ok(weather.includes("country==='DE'?['dwd_icon_d2','knmi_harmonie_arome_europe']"),'Deutschland verwendet keinen hochaufgelösten ICON-D2-Hintergrund.');
assert.ok(weather.includes("support=Math.min(.98,(1-Math.exp"),'Restfeldstützung ist nicht vertrauensabhängig.');
assert.ok(!weather.includes(".45+.55*(1-Math.exp"),'Alter 45-%-Mindeststützanteil darf nicht zurückkehren.');

// App, Kurzfrist und Event dürfen nicht mehr einen globalen 150-Minuten-Stationsstempel für alle Felder verwenden.
assert.ok(app.includes("finalizationObservedTemperature=shortTermAnchor?.observed?.temperature?undefined:"),'Aktuelle Temperatur nutzt keinen feldbezogen freigegebenen kanonischen Stationsanker.');
assert.ok(app.includes("fieldFresh=(field:StationAnalysisField)=>stationFieldObservationUsable"),'Aktuelles Wetter ist nicht feldweise qualitätsgesichert.');
assert.ok(app.includes("temperatureFresh=fieldFresh('temperature')"),'Die Haupttemperatur besitzt keinen eigenen Aktualitätsstatus.');
assert.ok(app.includes("°C{temperatureFresh?"),'Die Haupttemperatur kennzeichnet sich weiterhin durch irgendeinen frischen Stationsparameter als stationsgeprüft.');
assert.ok(app.includes('className="hyperlocal-analysis-compact"'),'Die Hyperlokal-Ergebniszeile ist nicht kompakt.');
assert.ok(app.includes('<b>Datenbasis:</b> Modellhintergrund {st?.backgroundModel||forecastSourceLabel}'),'Der verwendete Regionalmodell-Hintergrund fehlt im Info-Popover.');
assert.ok(app.indexOf("const forecastSourceLabel='Best Match';")>=0&&app.indexOf("const forecastSourceLabel='Best Match';")<app.indexOf('<b>Datenbasis:</b> Modellhintergrund {st?.backgroundModel||forecastSourceLabel}'),'forecastSourceLabel muss vor seiner ersten Verwendung im Hyperlokal-Info-Popover deklariert sein.');
assert.ok(app.includes('<b>Dynamische Windexposition:</b>'),'Die vollständige dynamische Windexposition fehlt im Info-Popover.');
assert.ok(app.includes('{stationDynamicStatus}{fresh?<InfoHint className="current-analysis-trigger" label="Hyperlokale Analyse erklären">'),'Dynamische Hyperlokal-Ergebnisse liegen weiterhin vollständig hinter dem Info-Popover.');
assert.ok(eventEngine.includes("stationFieldObservationUsable(observation,'temperature'"),'Event-Temperaturanker ist in der zentralen Event-Engine nicht feldweise qualitätsgesichert.');
assert.ok(anchorCore.includes('stationFieldObservationUsable(station,field,now,elevation)'),'Gemeinsamer Forecast-/Kurzfristanker ist nicht feldweise qualitätsgesichert.');
assert.ok(shortTerm.includes("forecastLocalAnchorFromCurrent as buildForecastLocalAnchor"),'Kurzfristmodul verwendet nicht den gemeinsamen feldweise qualitätsgesicherten Forecast-Anker.');
assert.ok(!shortTerm.includes('STATION_FRESHNESS_MS=150*60000'),'Alter pauschaler 150-Minuten-Vertrag ist noch aktiv.');
for(const field of ['temperature','precipitation','windGust','cloudCover'])assert.ok(twin.includes(`stationFieldObservationUsable(station,'${field}'`),`Wetterzwilling archiviert ${field} noch ohne feldbezogene Frischeprüfung.`);

// Echtzeit-/hochfrequente Quellen: DWD/GeoSphere 10 min, SMHI minutennahe Parameter.
for(const token of [
 "fieldTemporalResolutionMinutes:{temperature:10,dewPoint:10,humidity:10,pressure:10,windSpeed:10,windDirection:10",
 "const SMHI_PARAMETERS=[['45','temp','temperature',1],['43','relativeHumidity','humidity',1],['44','pressureMsl','pressure',1],['47','windSpeed','windSpeed',1],['48','windDirection','windDirection',1],['51','visibility_m','visibility',1],['50','cloudCover','cloudCover',5]",
 "fieldObservedAt:{}",
 "cf:{cacheTtl:60,cacheEverything:true}"
])assert.ok(worker.includes(token),`Hochfrequenter Beobachtungsvertrag fehlt: ${token}`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-hyperlocal-parameter-relevance-09510.mjs'),'Neue Hyperlokal-Regression muss Required sein.');
console.log(`MID v${pkg.version}: parameterbezogene Hyperlokal-Relevanz, Feld-Provenienz, hochfrequente Beobachtungen und Regionalmodell-Hintergrund geprüft.`);

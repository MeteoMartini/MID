import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada'),test='scripts/test-current-temperature-cache-transition-095339.mjs';
const [thermal,weather,app,analysisCache,shortTerm,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/hyperlocalThermal.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/analysisCache.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_HYPERLOCAL_ANALYSIS_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const compiled=ts.transpileModule(thermal,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'hyperlocalThermal.ts'});
assert.equal(compiled.diagnostics?.length??0,0,'hyperlocalThermal.ts muss transpilerbar bleiben.');
const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

// Reproduziert den 16.08.-Morgenfall: der schnelle Beobachtungskonsens liegt um 19 °C,
// während der regionale Zielpunkt noch etwa 22–23 °C liefert. Ein enger, frischer
// Mehrstationskonsens muss auch tagsüber verhindern, dass der Full-Pass wieder auf 22 °C springt.
const morning=module.constrainTemperatureWithDirectObservations({modelTarget:22.8,residualValue:22.6,isDay:1,windKt:3,samples:[
 {temperature:18.7,weight:1,distanceKm:6,ageMinutes:8},
 {temperature:19.1,weight:1,distanceKm:10,ageMinutes:10},
 {temperature:19.3,weight:.9,distanceKm:14,ageMinutes:12},
 {temperature:18.9,weight:.8,distanceKm:16,ageMinutes:14}
]});
assert.equal(morning.applied,true,'Frischer kohärenter Morgenkonsens muss die Current-Temperatur stützen.');
assert.ok(morning.value<20.2&&morning.value>morning.estimate,`Full-Pass darf nicht zurück Richtung 22 °C springen: ${morning.value}`);
assert.ok(morning.correction<-2.3,'Starker aktueller Mehrstationskonsens muss tagsüber mehr als die alte Standardkappe korrigieren dürfen.');

// Schwache/alte/weite Evidenz erhält weiterhin die konservative Tagesbegrenzung.
const weak=module.constrainTemperatureWithDirectObservations({modelTarget:22.8,residualValue:22.6,isDay:1,windKt:3,samples:[
 {temperature:19.0,weight:.3,distanceKm:22,ageMinutes:35},
 {temperature:19.5,weight:.25,distanceKm:24,ageMinutes:40},
 {temperature:19.2,weight:.2,distanceKm:20,ageMinutes:32}
]});
assert.ok(!weak.applied||Math.abs(weak.correction)<=1.3,'Alte/weite Tagesbeobachtungen dürfen nicht wie ein starker Current-Konsens behandelt werden.');

for(const token of ["const STATION_ANALYSIS_CACHE_SCHEMA='v2'","function analysisCacheStorageKind(kind:string)"])assert.ok(analysisCache.includes(token),`Analysecache-Vertrag fehlt: ${token}`);
for(const token of [
 "function stationTemperatureObservedEpoch(",
 "currentEpoch>nextEpoch+5*60000",
 "warmStation=forceFresh?null:stationCacheEntryForLocation",
 "const stationCacheEntry=forceFresh?null:stationCacheEntryForLocation",
 "const provisional=forceFresh?null:readAnalysisCache<Station>('station-provisional'",
 "startupStationController.signal,true,forceFresh",
 "enrichController.signal,false,forceFresh",
 "stationController.signal,true,forceFresh",
 "finalizationObservedTemperature=shortTermAnchor?.observed?.temperature?undefined:",
 "observedTemperature:finalizationObservedTemperature",
 "applyHyperlocalForecastHours(core.hours,shortTermAnchor",
 "minutes15={displayMinutes15} hours={displayHours}",
 "localTemperatureCorrectionSignificant=temperatureFresh&&",
 "temperatureObservationConstraintSignificant=temperatureFresh&&",
 "<span>Temperatur · Best Match</span>",
 "currentApparentTemperature=Number.isFinite(modelApparentTemperature)",
 "Gefühlt {Math.round(currentApparentTemperature)} °C"
])assert.ok(app.includes(token),`Current-/Cache-/Forecast-Konsistenzpfad fehlt: ${token}`);
for(const token of [
 'fast=false,forceFresh=false',
 'if(!forceFresh&&cached&&age<=freshMs)return cached.value',
 'const stationCandidateSnapshots=new Map',
 'if(fast)rememberStationCandidates(snapshotKey,results)',
 'results=dedupeStationCandidates([...results,...recent])'
])assert.ok(weather.includes(token),`Stations-Memorycache ist nicht forceFresh-fähig: ${token}`);
for(const token of [
 'const SHORT_TERM_HORIZON_MS=24*HOUR_MS',
 'const QUARTER_STEP_COUNT=6',
 'base=interpolatedHour(hours,precipitationIntervalStartEpoch)',
 'canonicalLocal=Number(base.localAdjustment)>0',
 'bridgeObservedTemperature(anchorTemperature,assimilatedTemperature'
])assert.ok(shortTerm.includes(token),`90-min-/24-h-Temperaturpfad ist nicht kanonisch: ${token}`);
assert.ok(contract.includes('Analysecache-Generationen'),'Der Hyperlokalvertrag muss alte Stationsanalyse-Caches bei Algorithmuswechseln ausschließen.');
assert.ok(contract.includes('Fast-Pass')&&contract.includes('Full-Pass'),'Der Übergang zwischen Beobachtungs- und Full-Pass muss vertraglich geschützt sein.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: Current-Temperaturübergang, Cachegeneration, Force-Fresh und 90-min-/24-h-Konsistenz geprüft.`);

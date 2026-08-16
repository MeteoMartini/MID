import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const test='scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs';
const [thermal,weather,app,worker,pkgRaw,baselineRaw,contract]=await Promise.all([
 readFile(new URL('../src/hyperlocalThermal.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_HYPERLOCAL_ANALYSIS_CONTRACT.md',import.meta.url),'utf8')
]);

const compiled=ts.transpileModule(thermal,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'hyperlocalThermal.ts'});
assert.equal(compiled.diagnostics?.length??0,0,'hyperlocalThermal.ts muss strikt transpilerbar bleiben.');
const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

// Reproduziert die problematische Klasse: Zielmodell zu warm, Stationsmodelle an den
// Stationen plausibel -> reine Restfeldkorrektur kann nahe null bleiben. Mehrere
// frische, nahe Beobachtungen müssen dann einen begrenzten Messkonsens liefern dürfen.
const consensus=module.constrainTemperatureWithDirectObservations({
 modelTarget:25,
 residualValue:25,
 isDay:0,
 windKt:3.5,
 samples:[
  {temperature:22.0,weight:.55,distanceKm:11.5,ageMinutes:7,aviation:true},
  {temperature:23.4,weight:1.18,distanceKm:3.2,ageMinutes:5},
  {temperature:23.7,weight:.92,distanceKm:9.1,ageMinutes:9}
 ]
});
assert.equal(consensus.applied,true,'Mehrere kohärente frische Messungen müssen einen fehlerhaften Zielpunktgradienten begrenzt korrigieren dürfen.');
assert.ok(consensus.value<24.45&&consensus.value>22.0,`Messkonsens soll den 25-°C-Zielwert evidenzabhängig absenken, aber nicht direkt ersetzen: ${consensus.value}`);
assert.ok(consensus.correction>=-4.65&&consensus.correction<-.5,'Zusatzkorrektur muss evidenzadaptiv begrenzt, aber meteorologisch wirksam sein.');
assert.ok(consensus.sampleCount>=2&&consensus.effectiveN>=1.35,'Messkonsens braucht echte Mehrpunktstützung.');

const singleAirport=module.constrainTemperatureWithDirectObservations({modelTarget:25,residualValue:25,isDay:0,windKt:2.5,samples:[{temperature:21.5,weight:1,distanceKm:10,ageMinutes:4,aviation:true}]});
assert.equal(singleAirport.applied,false,'Ein einzelner Flughafen darf den Zielort nicht temperaturseitig erzwingen.');
assert.equal(singleAirport.value,25);

const conflicting=module.constrainTemperatureWithDirectObservations({modelTarget:25,residualValue:25,isDay:0,windKt:2.5,samples:[{temperature:20,weight:1,distanceKm:5,ageMinutes:5},{temperature:26,weight:1,distanceKm:7,ageMinutes:5},{temperature:23,weight:1,distanceKm:8,ageMinutes:6}]});
assert.equal(conflicting.applied,false,'Stark widersprüchliche Temperaturmessungen dürfen keine direkte Rückführung erzwingen.');

const alreadyClose=module.constrainTemperatureWithDirectObservations({modelTarget:23.6,residualValue:23.5,isDay:0,windKt:3,samples:[{temperature:23.3,weight:1,distanceKm:3,ageMinutes:4},{temperature:23.5,weight:1,distanceKm:8,ageMinutes:7}]});
assert.equal(alreadyClose.applied,false,'Es darf keine Mindestkorrektur erzeugt werden, wenn Modell/Analyse und Messkonsens bereits nahe beieinander liegen.');

const day=module.constrainTemperatureWithDirectObservations({modelTarget:26,residualValue:26,isDay:1,windKt:5,samples:[{temperature:23,weight:1,distanceKm:3,ageMinutes:5},{temperature:23.4,weight:1,distanceKm:7,ageMinutes:6},{temperature:23.5,weight:.8,distanceKm:12,ageMinutes:8}]});
assert.ok(!day.applied||Math.abs(day.correction)<=3.0+.001,'Tagsüber muss die direkte Rückführung weiterhin stärker als nachts begrenzt bleiben.');

for(const token of [
 'constrainTemperatureWithDirectObservations',
 'temperatureObservationConstraint',
 'temperatureDirectEstimate',
 'temperatureStationCount',
 'temperatureEffectiveResolutionKm',
 "aviationFactor=aviation&&urban!=='rural'",
 "localCorrection:temp.correction"
])assert.ok(weather.includes(token),`Temperatur-Messkonsens ist nicht vollständig integriert: ${token}`);
assert.ok(app.includes('Temp.-Messpunkte'),'Die Current-Karte muss die tatsächliche Temperatur-Stützung statt der feldübergreifenden Stationszahl ausweisen.');
assert.ok(app.includes('Direkter Messkonsens:'),'Die Temperatur-Rückführung muss im Info-Popover transparent sein.');
assert.ok(app.includes('Messkonsens aktiv'),'Eine aktive direkte Rückführung muss kompakt erkennbar sein.');
assert.ok(worker.includes("DWD CDC 10-Minuten"),'Die native DWD-10-Minuten-Quelle muss im deutschen Stationsmix aktiv bleiben.');
assert.ok(worker.includes("fieldTemporalResolutionMinutes:{temperature:10,humidity:10,dewPoint:10}"),'DWD-10-Minuten-Temperatur muss ihre native Feldauflösung behalten.');
assert.ok(worker.includes("DWD SYNOP / OpenData POI")&&worker.includes("NOAA AviationWeather / METAR"),'SYNOP/POI und METAR müssen als unabhängige offizielle Temperaturstützen erhalten bleiben.');
assert.ok(contract.includes('Direkter Temperatur-Messkonsens gegen fehlerhafte Zielpunktgradienten'),'Der nachhaltige Hyperlokalvertrag muss die neue Schutzlogik festschreiben.');
assert.match(contract,/ein(?:e[nrms]?|)\s+einzelne[nrms]?\s+Flughafen/i,'Der Vertrag muss Einzel-Flughafen-Dominanz ausdrücklich verbieten.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Temperatur-Messkonsens muss Required Regression sein.');
console.log(`MID v${pkg.version}: direkter Temperatur-Messkonsens, Einzelstationsschutz, DWD-10-min/SYNOP/METAR-Provenienz und Current-Diagnose geprüft.`);

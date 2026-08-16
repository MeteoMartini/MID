import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript'),test='scripts/test-hyperlocal-source-freshness-095338.mjs';
const [thermal,worker,contract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/hyperlocalThermal.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_HYPERLOCAL_ANALYSIS_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const compiled=ts.transpileModule(thermal,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'hyperlocalThermal.ts'});
assert.equal(compiled.diagnostics?.length??0,0,'hyperlocalThermal.ts muss transpilerbar bleiben.');
const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const strong=module.constrainTemperatureWithDirectObservations({modelTarget:22.8,residualValue:22.7,isDay:0,windKt:3,samples:[
 {temperature:17.0,weight:1.0,distanceKm:11.4,ageMinutes:8,aviation:true},
 {temperature:18.2,weight:1.15,distanceKm:5.0,ageMinutes:6},
 {temperature:18.5,weight:.95,distanceKm:10.2,ageMinutes:7},
 {temperature:17.9,weight:.72,distanceKm:14.0,ageMinutes:10}
]});
assert.equal(strong.applied,true,'Kohärente frische Mehrstationsbeobachtungen müssen einen klaren Zielpunktgradienten korrigieren.');
assert.ok(strong.correction<-2.2,`Die Korrektur darf bei klarer Evidenz nicht mehr am alten 1,8-K-Deckel hängen: ${strong.correction}`);
assert.ok(strong.value>strong.estimate,'MID muss auch bei starker Evidenz einen Rest Modellinformation behalten.');
assert.ok(strong.value<20.6,`Der Zielwert muss sich deutlich dem realen Messkonsens annähern: ${strong.value}`);

const weak=module.constrainTemperatureWithDirectObservations({modelTarget:22.8,residualValue:22.7,isDay:0,windKt:3,samples:[
 {temperature:19.1,weight:.22,distanceKm:23,ageMinutes:42},
 {temperature:19.7,weight:.20,distanceKm:24,ageMinutes:44}
]});
assert.ok(!weak.applied||Math.abs(weak.correction)<=1.9,'Schwache/alte/weite Evidenz darf nicht von der erweiterten Korrekturgrenze profitieren.');

for(const token of [
 "records.sort((a,b)=>b.epoch-a.epoch)[0]",
 "temporalResolutionMinutes:60",
 "fieldTemporalResolutionMinutes:{temperature:60,dewPoint:60,humidity:60,pressure:60,windSpeed:10,windDirection:10",
 "cf:{cacheTtl:90,cacheEverything:true}",
 "cf:{cacheTtl:75,cacheEverything:true}"
])assert.ok(worker.includes(token),`DWD-Quellenfrische/-Provenienz unvollständig: ${token}`);
assert.ok(!worker.includes("lines.slice(3,14)"),'POI darf nicht mehr von der CSV-Reihenfolge der ersten elf Datensätze abhängen.');
assert.ok(contract.includes('evidenzadaptive Rückführung'),'Der Hyperlokalvertrag muss die adaptive Mehrstationskorrektur schützen.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: adaptive Temperaturkorrektur, DWD-POI-Neuestwert und CDC-/SYNOP-Intervallprovenienz geprüft.`);

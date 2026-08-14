import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [thermal,weather,app,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/hyperlocalThermal.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

const compiled=ts.transpileModule(thermal,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'hyperlocalThermal.ts'});
assert.equal(compiled.diagnostics?.length??0,0,'Die stabile-Nacht-Temperaturlogik muss transpilerbar sein.');
const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

const samples=[
 {distanceKm:2.5,observedTemperature:18.9,backgroundTemperature:20.8,relevance:.94,siteCompatibility:1.1,morphologyCompatibility:.96,aviation:false},
 {distanceKm:6.8,observedTemperature:19.4,backgroundTemperature:20.7,relevance:.82,siteCompatibility:1.0,morphologyCompatibility:.9,aviation:false},
 {distanceKm:14.2,observedTemperature:21.0,backgroundTemperature:21.0,relevance:.83,siteCompatibility:.58,morphologyCompatibility:.62,aviation:true},
 {distanceKm:19.5,observedTemperature:21.3,backgroundTemperature:21.0,relevance:.61,siteCompatibility:.68,morphologyCompatibility:.7,aviation:false}
];
const stable=module.detectStableNightThermalRegime({isDay:0,windKt:3.2,cloudCover:18,samples});
assert.equal(stable.active,true,'Klare/schwachwindige Nacht mit rund 2 K lokaler Streuung muss thermisch lokalisiert werden.');
assert.ok(stable.localizationKm<10&&stable.localizationKm>=6.5,'Thermische Reichweite muss in stabiler Nacht deutlich enger als die normale 18-km-Skala sein.');
const nearWeight=module.stableNightThermalWeightFactor(samples[0],stable,'suburban'),airportWeight=module.stableNightThermalWeightFactor(samples[2],stable,'suburban'),remoteWeight=module.stableNightThermalWeightFactor(samples[3],stable,'suburban');
assert.ok(nearWeight>airportWeight*3,'Nahe thermisch passende Messung muss gegenüber entferntem Flughafen-METAR deutlich gewinnen.');
assert.ok(nearWeight>remoteWeight*2,'Nahe Messung muss gegenüber entfernter thermischer Restfeldstütze deutlich gewinnen.');
assert.equal(module.detectStableNightThermalRegime({isDay:1,windKt:3.2,cloudCover:18,samples}).active,false,'Tagsüber darf die Nachtlokalisierung nicht greifen.');
assert.equal(module.detectStableNightThermalRegime({isDay:0,windKt:10,cloudCover:18,samples}).active,false,'Bei guter nächtlicher Durchmischung darf die Sondergewichtung nicht greifen.');
assert.equal(module.detectStableNightThermalRegime({isDay:0,windKt:3.2,cloudCover:92,samples}).active,false,'Bei geschlossener Bewölkung darf die stabile-Nacht-Lokalisierung nicht allein aus Temperaturstreuung aktiviert werden.');
const uniform=samples.map((sample,index)=>({...sample,observedTemperature:20-index*.05,backgroundTemperature:20.3-index*.05}));
assert.equal(module.detectStableNightThermalRegime({isDay:0,windKt:2.5,cloudCover:10,samples:uniform}).active,false,'Ohne tatsächliche räumliche Temperatur-/Residualstreuung darf keine Sondergewichtung aktiviert werden.');

for(const token of [
 "detectStableNightThermalRegime({isDay:target.isDay,windKt:target.windSpeed,cloudCover:target.cloudCover",
 "thermalRegime.active?4.2:2.6",
 "stableNightThermalWeightFactor(thermalSamples.get(station)!,thermalRegime,urban)",
 "thermalRegime:thermalRegime.active?'stable-night':undefined",
 "stabile Nacht thermisch lokalisiert"
])assert.ok(weather.includes(token),`Integration der stabilen Nacht fehlt: ${token}`);
assert.ok(!thermal.includes('observedTemperature-2')&&!thermal.includes('backgroundTemperature-2'),'Es darf keinen festen Nacht-Temperaturabschlag geben.');
assert.ok(app.includes("st?.thermalRegime==='stable-night'"),'Die aktive Nachtlokalisierung muss in der Hyperlokal-Info erkennbar sein.');
assert.ok(app.includes('es wird kein pauschaler Nachtabschlag angewendet'),'Die UI muss die nicht-pauschale Korrekturlogik transparent machen.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-stable-night-hyperlocal-temperature-09536.mjs'),'Stabile-Nacht-Regression muss Required sein.');
console.log(`MID v${pkg.version}: stabile, schwachwindige Nächte werden temperaturseitig evidenzbasiert enger lokalisiert; Tages-/Wind-/Bewölkungs-Gegenproben bestanden.`);

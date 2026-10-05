import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fusion,anchor,app,pkgRaw,baselineRaw,contract]=await Promise.all([
 read('src/forecastFusion.ts'),
 read('src/forecastLocalAnchor.ts'),
 readAppFeatureSources(),
 read('package.json'),
 read('MID_BASELINE.json'),
 read('MID_TEMPERATURE_TREND_MOUNTAIN_0.9.85.115.md')
]);

const start=fusion.indexOf('function interpolatedForecastTemperature(');
const end=fusion.indexOf('\nfunction localAssimilatedDirection(',start);
assert.ok(start>=0&&end>start,'Nachhaltige Temperaturtrend-Korrektur fehlt.');
const block=fusion.slice(start,end).replace('export function hyperlocalTemperatureTrendValues','function hyperlocalTemperatureTrendValues');
const javascript=stripTypeScriptTypes(block,{mode:'transform'});
const module=await import(`data:text/javascript;base64,${Buffer.from(`const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));\n${javascript}\nexport {hyperlocalTemperatureTrendValues};`).toString('base64')}`);

const epoch=hour=>Date.parse(`2026-09-28T${String(hour).padStart(2,'0')}:00:00Z`);
const cooling=[
 {epoch:epoch(19),temperature:21.0},
 {epoch:epoch(20),temperature:20.0},
 {epoch:epoch(21),temperature:19.8},
 {epoch:epoch(22),temperature:19.3},
 {epoch:epoch(23),temperature:19.0},
 {epoch:Date.parse('2026-09-29T00:00:00Z'),temperature:18.7},
 {epoch:Date.parse('2026-09-29T01:00:00Z'),temperature:18.5},
];
const observedAt=Date.parse('2026-09-28T19:24:00Z'),observed=18.0;
const corrected=module.hyperlocalTemperatureTrendValues(cooling,observed,observedAt,cooling);
const modelAtObservation=21+(20-21)*(24/60);
const bias=observed-modelAtObservation;
assert.ok(Math.abs(corrected[0]-(21+bias))<1e-9,'Temperaturanker muss gegen den zeitlich interpolierten Modellwert statt gegen eine Nachbarstunde bestimmt werden.');
assert.ok(corrected[1]<corrected[0],'Ein fallender Modelltrend darf zwischen den ersten beiden vollen Stunden nicht durch Bias-Ausblendung in Erwärmung gedreht werden.');
assert.ok(corrected[2]<=corrected[1]+1e-9,'Der Screenshot-Regressionsfall 22→23 darf bei fallendem Modelltrend keinen künstlichen Temperaturanstieg erzeugen.');
assert.ok(corrected.every(Number.isFinite),'Die hyperlokale Stundenreihe muss vollständig endlich bleiben.');

const warming=[
 {epoch:epoch(19),temperature:17.0},
 {epoch:epoch(20),temperature:18.0},
 {epoch:epoch(21),temperature:18.4},
 {epoch:epoch(22),temperature:19.0},
];
const warmer=module.hyperlocalTemperatureTrendValues(warming,20.0,observedAt,warming);
assert.ok(warmer[1]>=warmer[0]-1e-9&&warmer[2]>=warmer[1]-1e-9,'Auch ein steigender Modelltrend darf durch die Bias-Rückführung nicht künstlich umgedreht werden.');

for(const token of [
 'temperatureObservedAt?:number',
 'interpolatedForecastTemperature(referenceHours,anchorEpoch)',
 'hyperlocalTemperatureBiasWeight(leadMinutes)',
 'const stepHours=(epoch-previousEpoch)/3600000,maxRecovery=.5*stepHours',
 'temperatureTrend=hyperlocalTemperatureTrendValues(hours,anchorTemperature,temperatureObservedAt,referenceHours)'
])assert.ok(fusion.includes(token),`Temperaturtrend-Vertrag fehlt: ${token}`);
assert.ok(anchor.includes("station?.fieldObservedAt?.[field]")&&anchor.includes("station?.fieldSources?.[field]?.[0]?.observedAt"),'Feldspezifischer Beobachtungszeitpunkt muss vor dem allgemeinen Stationszeitstempel verwendet werden.');
assert.ok(anchor.includes("temperatureObservedAt=stationTemperature!==undefined?stationFieldObservedEpoch(station,'temperature'):undefined"),'Temperaturanker muss seinen echten Messzeitpunkt transportieren.');

for(const token of [
 'to=now+12*3600000',
 '.slice(0,12).map(row=>{',
 'Stundenprognose · nächste 12 Stunden'
])assert.ok(app.includes(token),`12-h-Bergstundenvertrag fehlt: ${token}`);
assert.ok(!app.includes('Stundenprognose · nächste 24 Stunden'),'Die sichtbare horizontale Berg-Stundenprognose darf nicht mehr 24 Stunden ausweisen.');
assert.ok(contract.includes('synthetische Erwärmung')&&contract.includes('12 Stunden'),'Implementierungsvertrag muss Ursache und neue Berg-Horizontgrenze dokumentieren.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-mid-18-2-23-temperature-trend-mountain-12h-0985115.mjs';
const maintenance=Number(String(pkg.version).split('.').at(-1));
assert.ok(Number.isFinite(maintenance)&&maintenance>=115,'Temperaturtrend-/Bergstundenvertrag muss ab v0.9.85.115 erhalten bleiben.');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
for(const file of [test,'MID_TEMPERATURE_TREND_MOUNTAIN_0.9.85.115.md'])assert.ok((baseline.requiredFiles||[]).includes(file),`${file} fehlt in requiredFiles`);

console.log('MID v0.9.85.115: zeitgenaue hyperlokale Temperaturtrend-Kohärenz und 12-h-Bergstundenprognose geschützt.');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fusion,shortTerm,cockpit,mapping,contract,sourceOfTruth,pkgRaw,baselineRaw]=await Promise.all([
 read('src/forecastFusion.ts'),read('src/ShortTermForecast.tsx'),read('src/ForecastCockpit.tsx'),
 read('src/weather-src/20-mapping-day-character.tsfrag'),read('MID_PRECIPITATION_INTERVAL_CONTRACT.md'),
 read('MID_SOURCE_OF_TRUTH.md'),read('package.json'),read('MID_BASELINE.json')
]);

// Provider-Zeitsemantik: Zeitstempel ist Ende, nicht Mittelpunkt, des Akkumulationsintervalls.
assert.ok(mapping.includes('Provider-Intervallvertrag'),'Open-Meteo-Intervallsemantik ist im kanonischen Mapping nicht dokumentiert.');
assert.ok(fusion.includes('const span=Math.max(1,intervalMinutes)*60000;return{start:targetEpoch-span,end:targetEpoch}'),'Radarfenster ist nicht als trailing accumulation interval implementiert.');
assert.ok(!fusion.includes('intervalMinutes/2)*60000'),'Zentrierte Radar-/Akkumulationsfenster dürfen nicht zurückkehren.');

// Radar hat im direkten Nowcastfenster Vorrang für die Standortmenge, ohne PoP und Menge gleichzusetzen.
assert.ok(fusion.includes('siteDryAmountWeight'),'Umfeld-Echo ohne Standorttreffer dämpft die ungestützte Standortmenge nicht.');
assert.ok(fusion.includes('amount=safeModelAmount*(1-siteDryAmountWeight)'),'Proximity-Blend lässt Modellmenge weiterhin unverändert durch.');
assert.ok(fusion.includes('amountWeight=leadMinutes<=DIRECT_RADAR_HORIZON_MINUTES'),'Trockene Radarstrecke besitzt keinen eigenen Mengen-Blend.');
assert.ok(!fusion.includes('safeModelAmount<=1'),'Große Modellmengen dürfen trockenen Radar-Abgleich nicht umgehen.');

// 15-min/1-h-Fallbacks verwenden das Intervall, das den Zielzeitpunkt enthält.
for(const token of [
 'function trailingAccumulationHour(hours:Hour[],epoch:number)',
 'accumulationBase=trailingAccumulationHour(hours,target)',
 'modelNowAccumulation=trailingAccumulationHour(hours,now)',
 'let previousIntervalEnd=now',
 'precipitationIntervalStartEpoch=previousIntervalEnd',
 'previousIntervalEnd=target',
 'quarterFactor=intervalMinutes/15'
])assert.ok(shortTerm.includes(token),`Kurzfrist-Intervallvertrag fehlt: ${token}`);

// Das Profil beginnt wirklich jetzt, verwendet den finalisierten Kurzfristpfad und zeichnet Mengen auf Intervallgrenzen.
for(const token of [
 'function shortTermProfileHourlyPoints(hours:Hour[],adjusted:ShortTermForecastPoint[],timezone:string,now=Date.now())',
 'aggregateProfileHour(group,timezone,now)',
 'return precipitationPresentationHours(hours).filter(hour=>hour.epoch<windowEnd&&hour.epoch+HOUR_MS>now)',
 'precipitationIntervalStartEpoch:start',
 'precipitationIntervalEndEpoch:end',
 'precipitationMidX=(precipitationStartX+precipitationEndX)/2',
 'x={item.precipitationMidX-rainWidth/2}',
 'cx={item.precipitationMidX}'
])assert.ok(cockpit.includes(token),`24-h-Profil-Intervallvertrag fehlt: ${token}`);
assert.ok(!cockpit.includes('epoch<=now&&now-epoch<90*60000)startIndex=index'),'Vergangenes Stundenende darf nicht mehr als Start des „ab jetzt“-Niederschlagsprofils gewählt werden.');

// Resttagesmenge zählt nur zukünftigen Anteil des ersten trailing-hour-Intervalls.
for(const token of [
 'futureFraction=(hour:Hour)=>',
 'if(!Number.isFinite(start)||end<=now)return 0',
 'return clamp((end-now)/3600000,0,1)',
 '*precipitationFraction(hour)'
])assert.ok(fusion.includes(token),`Resttages-Akkumulationsvertrag fehlt: ${token}`);

for(const phrase of ['Provider-Zeitstempel `T` bezeichnet für diese Felder also das **Intervallende**','kein Standorttreffer','große NWP-Mengen >1 mm','PoP × deterministische Menge'])assert.ok(contract.includes(phrase),`Fachvertrag unvollständig: ${phrase}`);
assert.ok(sourceOfTruth.includes('MID_PRECIPITATION_INTERVAL_CONTRACT.md'),'Source of Truth referenziert den neuen Niederschlags-Intervallvertrag nicht.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-precipitation-trailing-interval-nowcast-097810.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
assert.equal(pkg.scripts?.['test:precipitation-trailing-interval-nowcast'],`node ${test}`,'Package-Testskript fehlt.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_PRECIPITATION_INTERVAL_CONTRACT.md'),'Niederschlags-Intervallvertrag ist keine Baseline-Pflichtdatei.');
console.log(`MID v${pkg.version}: trailing precipitation intervals, Radar/NWP-Mengenblend und „ab jetzt“-Bilanzierung geschützt.`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [source,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/detailSkyBar.ts',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse),
]);
assert.ok(source.includes('const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number):WeatherStripVisual|null=>{'),'Skybar-Precip-Helper muss ohne ungenutzten sunshineShare-Parameter definiert sein.');
assert.ok(source.includes('const precipitation=precipitationOverlayVisual(hour,intervalSeconds,cloud);'),'Skybar-Precip-Helper muss ohne sunshineShare-Argument aufgerufen werden.');
assert.ok(!source.includes('precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number,sunshineShare:number)'),'TS6133-Regression: ungenutzter sunshineShare-Parameter darf nicht zurückkehren.');
const test='scripts/test-detail-skybar-unused-parameter-buildfix-097841.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (regressionTests).');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (requiredRegressionTests).');
assert.equal(baseline.releaseVersion,pkg.version,'Buildfix-Test verlangt synchronen Package-/Baseline-Release.');
const parts=String(pkg.version).split('.').map(Number);
assert.ok(parts[0]>0||parts[1]>9||parts[2]>78||(parts[2]===78&&(parts[3]??0)>=41),'TS6133-Buildfix darf erst ab MID v0.9.78.41 gelten.');
console.log(`MID v${pkg.version}: TS6133-Buildfix im phasenabhängigen Skybar-Niederschlagslayer geschützt.`);

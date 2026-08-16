import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const test='scripts/test-forecast-cockpit-build-hygiene-095342.mjs';
const [cockpit,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
assert.ok(cockpit.includes("import {relativeForecastTimeLabel} from './forecastPresentation';"),'ForecastCockpit muss nur die tatsächlich verwendete Forecast-Presentation-Hilfe importieren.');
assert.ok(!cockpit.includes("import {bridgeObservedTemperature,relativeForecastTimeLabel}"),'Der entfernte bridgeObservedTemperature-Import darf den noUnusedLocals-Produktionsbuild nicht erneut brechen.');
assert.ok(!/\bbridgeObservedTemperature\b/.test(cockpit),'ForecastCockpit darf bridgeObservedTemperature nicht lokal referenzieren; die Brücke gehört in den kanonischen ShortTermForecast-Pfad.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: ForecastCockpit bleibt frei von verwaisten Temperatur-Brückenimporten und TS6133-Rückfällen.`);

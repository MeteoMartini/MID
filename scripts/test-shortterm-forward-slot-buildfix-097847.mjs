import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [shortTerm,baseline,pkg]=await Promise.all([
  readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse),
]);

assert.ok(shortTerm.includes('precipitationIntervalStartEpoch=previousIntervalEnd'),'Vorwärts-Slot-Vertrag der Kurzfristvorhersage fehlt.');
assert.ok(shortTerm.includes('accumulationBase=trailingAccumulationHour(hours,target)'),'Rohakkumulation muss weiterhin am Intervallende gelesen werden.');
assert.ok(shortTerm.includes('offsetMinutes=Math.max(0,Math.round((precipitationIntervalStartEpoch-now)/60000))'),'Sichtbarer Offset muss vom Beginn des Prognoseintervalls kommen.');
assert.ok(!shortTerm.includes('targetOffsetMinutes'),'Ungenutztes targetOffsetMinutes darf nicht zurückkehren (TS6133).');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und package.json müssen dieselbe Releaseversion tragen.');
assert.equal(baseline.version,pkg.version,'Legacy-Baselineversion muss ebenfalls synchron sein.');
const test='scripts/test-shortterm-forward-slot-buildfix-097847.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Buildfix-Regression fehlt in MID_BASELINE.json (regressionTests).');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Buildfix-Regression fehlt in MID_BASELINE.json (requiredRegressionTests).');
console.log(`MID v${pkg.version}: ShortTermForwardSlot-Buildfix gegen TS6133 und Startstempel-Rückfall geschützt.`);

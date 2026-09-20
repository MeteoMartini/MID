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
assert.ok(shortTerm.includes('const QUARTER_STEP_COUNT=7;'),'Die Rohreihe muss den Endpunkt für sechs volle 15-Minuten-Intervalle nach dem nächsten Viertelstundenstart bereitstellen.');
assert.ok(shortTerm.includes('windowStart=nextQuarterEpoch(now),windowEnd=windowStart+6*QUARTER_MS'),'90 Minuten müssen am ersten zukünftigen runden Viertelstundenpunkt beginnen und exakt sechs Viertelstunden umfassen.');
assert.ok(shortTerm.includes("if(point.source!=='15-min')return false;")&&shortTerm.includes('start>=windowStart&&start<windowEnd')&&shortTerm.includes('.slice(0,6);'),'Die sichtbare 90-Minuten-Reihe darf weder den laufenden Teilslot noch ein siebtes Intervall mitzählen.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und package.json müssen dieselbe Releaseversion tragen.');
assert.equal(baseline.version,pkg.version,'Legacy-Baselineversion muss ebenfalls synchron sein.');
const test='scripts/test-shortterm-forward-slot-buildfix-097847.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Buildfix-Regression fehlt in MID_BASELINE.json (regressionTests).');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Buildfix-Regression fehlt in MID_BASELINE.json (requiredRegressionTests).');
console.log(`MID v${pkg.version}: ShortTermForwardSlot-Buildfix gegen TS6133 und Startstempel-Rückfall geschützt.`);

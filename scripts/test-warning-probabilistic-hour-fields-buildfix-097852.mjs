import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [fragment,aggregate,baselineRaw,pkgRaw]=await Promise.all([
  read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
  read('src/weather.ts'),
  read('MID_BASELINE.json'),
  read('package.json')
]);

for(const [label,source] of [['fragment',fragment],['aggregate',aggregate]]){
  assert.ok(source.includes("Number(hour.precipitation)||0"),`${label}: probabilistische Warnlogik muss das Hour-Feld precipitation nutzen.`);
  assert.ok(source.includes("Number(hour.temperature)"),`${label}: probabilistische Warnlogik muss das Hour-Feld temperature nutzen.`);
  assert.ok(source.includes("key:'precipitation'|'snowfall'"),`${label}: Summen-Helper muss nur gültige Hour-Felder typisieren.`);
  assert.ok(source.includes("sumForward('precipitation',"),`${label}: Regen-Summen müssen precipitation statt eines nicht existierenden precip-Felds nutzen.`);
  assert.doesNotMatch(source,/hour\.precip(?!itation)/,`${label}: veraltetes Hour-Feld precip darf nicht vorkommen.`);
  assert.doesNotMatch(source,/hour\.temp(?!erature)/,`${label}: veraltetes Hour-Feld temp darf nicht vorkommen.`);
}
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-warning-probabilistic-hour-fields-buildfix-097852.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Package-/Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: TS7-Buildfix für probabilistische Warn-Hour-Felder geprüft.`);

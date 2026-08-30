import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const test='scripts/test-shortterm-german-word-order-09767.mjs';
const [presentation,cockpit,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/forecastPresentation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const js=stripTypeScriptTypes(presentation,{mode:'transform'}),module=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const timezone='Europe/Berlin',now=Date.parse('2026-08-30T12:00:00Z');
assert.equal(module.relativeForecastTimePhrase(Date.parse('2026-08-30T17:00:00Z'),timezone,'at',now),'um 19:00 Uhr');
assert.equal(module.relativeForecastTimePhrase(Date.parse('2026-08-31T17:00:00Z'),timezone,'at',now),'morgen um 19:00 Uhr');
assert.equal(module.relativeForecastTimePhrase(Date.parse('2026-08-31T12:00:00Z'),timezone,'from',now),'morgen ab 14:00 Uhr');
assert.equal(module.relativeForecastTimePhrase(Date.parse('2026-09-01T12:00:00Z'),timezone,'from',now),'übermorgen ab 14:00 Uhr');
for(const token of [
 "import {relativeForecastTimePhrase} from './forecastPresentation';",
 "Böen bis ${wind(gust.gust,unit)} ${relativeForecastTimePhrase(gust.epoch,timezone,'at',now)}",
 "${kind} voraussichtlich ${relativeForecastTimePhrase(first.epoch,timezone,'from',now)}"
])assert.ok(cockpit.includes(token),`Kurzfrist-Textvertrag fehlt: ${token}`);
for(const bad of ['um ${relativeForecastTimeLabel','ab ${relativeForecastTimeLabel','um morgen','um übermorgen'])assert.ok(!cockpit.includes(bad),`Unnatürliche deutsche Wortstellung darf nicht zurückkehren: ${bad}`);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: deutsche Wortstellung dynamischer Kurzfrist-Zeitphrasen geprüft.`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {build} from 'esbuild';

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
// Check real production brief and local phrase formatting together. The old
// always-present weak-gust sentence was intentionally removed in MID .289.
const {outputFiles}=await build({entryPoints:['src/shortTermSignificantBrief.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {shortTermSignificantBrief:brief}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const format={from:epoch=>module.relativeForecastTimePhrase(epoch,timezone,'from',now),at:epoch=>module.relativeForecastTimePhrase(epoch,timezone,'at',now),gust:knots=>Math.round(knots)+' kt'};
const rainStart=Date.parse('2026-08-31T12:00:00Z'),windPeak=Date.parse('2026-08-31T17:00:00Z');
const p=(epoch,amount,gust,label)=>({epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+3600000,precipitation:amount,gust,weatherLabel:label});
const message=brief([p(rainStart,.3,14,'Leichter Regen'),p(windPeak,0,34,'Trocken')],now,format);
assert.match(message,/Leichter Regen voraussichtlich morgen ab 14:00 Uhr/);
assert.match(message,/Markante Böen bis 34 kt morgen um 19:00 Uhr/);
assert.doesNotMatch(message,/um morgen|ab morgen|14 kt/);
assert.equal(brief([p(rainStart,0,14,'Trocken')],now,format),'Keine markanten Wetterereignisse in den nächsten 24 Stunden.');
for(const token of [
 "import {relativeForecastTimePhrase} from './forecastPresentation';",
 "import {shortTermSignificantBrief} from './shortTermSignificantBrief';",
 "return shortTermSignificantBrief(points,now",
 "shortTermPointSummary(profileDisplayPoints,unit,timezone,profileNow)"
])assert.ok(cockpit.includes(token),`Kurzfrist-Darstellungsvertrag fehlt: ${token}`);
assert.ok(!cockpit.includes('const nativeOnset=quarters.find('),'Verborgene 15-min-Startzeit darf keine vom angezeigten Profil abweichende Textzeit erzwingen.');
for(const bad of ['um ${relativeForecastTimeLabel','ab ${relativeForecastTimeLabel','um morgen','um übermorgen'])assert.ok(!cockpit.includes(bad),`Unnatürliche deutsche Wortstellung darf nicht zurückkehren: ${bad}`);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: deutsche Wortstellung dynamischer Kurzfrist-Zeitphrasen geprüft.`);

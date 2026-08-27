import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [worker,panel,data,app,modules,router,pkgRaw,baselineRaw,changelog,implementation]=await Promise.all([
 read('worker-src/25-dach-extreme-outlook.js'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/extremeWeatherOutlook.ts'),read('src/App.tsx'),read('src/dashboardModules.ts'),read('worker-src/40-aviation-router.js'),read('package.json'),read('MID_BASELINE.json'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.67.7.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-icon-d2-domain-096677.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.67.7'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-icon-d2-domain'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.67.7.md'));

for(const token of [
 "const DACH_EXTREME_BOUNDS={south:43.18,west:-3.85,north:58,east:20.21}",
 "const DACH_EXTREME_ANALYSIS_BOUNDS={south:43.45,west:-3.5,north:57.75,east:19.9}",
 "const DACH_EXTREME_ROTATED_DOMAIN={west:-7.5,east:5.5,south:-6.3,north:8,poleLon:-170,poleLat:40}",
 "function dachExtremeDomainPolygon(samples=24)",
 'function dachExtremeGrid(){const rows=19,cols=31',
 'dachExtremeFetchBatches(batches,4)',
 "scope:'Mitteleuropa'",
 "displayGrid:'Gesamtes ICON-D2-Gebiet · regionales Analyseraster etwa 60–100 km'"
])assert.ok(worker.includes(token),`ICON-D2-Gebietsvertrag fehlt: ${token}`);
for(const region of ['Südostengland','Dänemark','Niederlande','Belgien','Nordfrankreich','Südwestfrankreich','Böhmen','Westpolen','Schlesien/Südpolen','Slowenien','Piemont/Lombardei','Venetien/Friaul'])assert.ok(worker.includes(`['${region}'`),`Erweiterte ICON-D2-Region fehlt: ${region}`);

assert.ok(data.includes("scope:'Mitteleuropa';"));
assert.ok(data.includes('bounds.west<=-3.84&&bounds.east>=20.2&&bounds.south<=43.2&&bounds.north>=57.99'));
assert.ok(data.includes("cacheKey:'dach-extreme-outlook:v4'"),'Alte DACH-Payloads dürfen nicht als vollständiger Mitteleuropa-Stand wiederverwendet werden.');
assert.ok(router.includes("scope:'Mitteleuropa'"),'Worker-Fehlerumschlag muss den neuen Scope verwenden.');

for(const token of ['MID Extremwetter-Ausblick · Mitteleuropa','gesamtes ICON-D2-Modellgebiet','Karte des Mitteleuropa-Extremwetter-Ausblicks','amtlichen nationalen Warnstellen bzw. MeteoAlarm'])assert.ok(panel.includes(token),`Mitteleuropa-UI fehlt: ${token}`);
assert.ok(app.includes('title="Extremwetter-Ausblick · Mitteleuropa"'));
assert.ok(app.includes('placeholder="Mitteleuropa-Extremwetter-Ausblick wird vorbereitet …"'));
assert.ok(modules.includes('Eigene probabilistische Mitteleuropa-Prognose im vollständigen ICON-D2-Gebiet'));
for(const source of [panel,app,modules])assert.ok(!source.includes('Extremwetter-Ausblick · DACH')&&!source.includes('DACH-Extremwetter-Ausblick')&&!source.includes('probabilistische DACH-Prognose'),'Sichtbare DACH-Altbezeichnung ist noch vorhanden.');

assert.ok(changelog.includes('## 0.9.67.7'));
for(const token of ['vollständige ICON-D2-Modellgebiet','Mitteleuropa','43,19','57,62','3,84° W','20,21° E'])assert.ok(implementation.includes(token),`Implementierungsdokumentation fehlt: ${token}`);
console.log('MID v0.9.67.7: Extremwetter-Ausblick deckt das vollständige ICON-D2-Modellgebiet ab und wird sichtbar als Mitteleuropa geführt.');

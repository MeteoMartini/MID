import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [worker,data,direct,panel,overlay,app,modules,router,pkgRaw,baselineRaw,implementation]=await Promise.all([
 read('worker-src/25-dach-extreme-outlook.js'),read('src/extremeWeatherOutlook.ts'),read('src/extremeWeatherOutlookDirect.generated.js'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/App.tsx'),read('src/dashboardModules.ts'),read('worker-src/40-aviation-router.js'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.69.7.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-mitteleuropa-recovery-096697.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.69.7'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-mitteleuropa-recovery'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.69.7.md'));

for(const token of [
 "const DACH_EXTREME_BOUNDS={south:43.18,west:-3.85,north:58,east:20.21}",
 "const DACH_EXTREME_ANALYSIS_BOUNDS={south:43.45,west:-3.5,north:57.75,east:19.9}",
 "const DACH_EXTREME_ROTATED_DOMAIN={west:-7.5,east:5.5,south:-6.3,north:8,poleLon:-170,poleLat:40}",
 "function dachExtremeDomainPolygon(samples=24)",
 "const DACH_EXTREME_GRID_PROFILES={full:{rows:13,cols:23",
 "fallback:{rows:11,cols:19",
 "function dachExtremeGrid(profile='full')",
 "async function dachExtremeFetchBatchResilient(points)",
 "async function dachExtremeFetchBatches(batches,concurrency=2)",
 "function dachExtremeNowcastThunder(assessment,point,snapshot,periodId)",
 "scope:'Mitteleuropa'",
 "model:'DWD ICON-D2-EPS + ICON-D2 · KONRAD3D/Meso 0–6 h'"
])assert.ok(worker.includes(token),`Mitteleuropa-Fachvertrag fehlt: ${token}`);
for(const region of ['Südostengland','Dänemark','Niederlande','Belgien','Nordfrankreich','Südwestfrankreich','Böhmen','Westpolen','Schlesien/Südpolen','Slowenien','Piemont/Lombardei','Venetien/Friaul'])assert.ok(worker.includes(`['${region}'`),`ICON-D2-Region fehlt: ${region}`);

assert.ok(data.includes("scope:'Mitteleuropa';"));
assert.ok(data.includes('bounds.west<=-3.84&&bounds.east>=20.2&&bounds.south<=43.2&&bounds.north>=57.99'));
assert.ok(data.includes("cacheKey:'dach-extreme-outlook:v5'"));
assert.ok(direct.includes("scope:'Mitteleuropa'"),'Browser-Direktpfad muss aus derselben Mitteleuropa-Quelle generiert sein.');
assert.ok(direct.includes('Südostengland')&&direct.includes('Venetien/Friaul'),'Direktpfad darf nicht auf den alten DACH-Ausschnitt zurückfallen.');
assert.ok(router.includes("scope:'Mitteleuropa'"));

for(const token of ['MID Extremwetter-Ausblick · Mitteleuropa','gesamtes ICON-D2-Modellgebiet','Karte des Mitteleuropa-Extremwetter-Ausblicks','amtlichen nationalen Warnstellen bzw. MeteoAlarm'])assert.ok(panel.includes(token),`Mitteleuropa-UI fehlt: ${token}`);
assert.ok(app.includes('title="Extremwetter-Ausblick · Mitteleuropa"'));
assert.ok(app.includes('placeholder="Mitteleuropa-Extremwetter-Ausblick wird vorbereitet …"'));
assert.ok(modules.includes('Eigene probabilistische Mitteleuropa-Prognose im vollständigen ICON-D2-Gebiet'));
for(const source of [panel,app,modules])assert.ok(!source.includes('Extremwetter-Ausblick · DACH')&&!source.includes('DACH-Extremwetter-Ausblick')&&!source.includes('probabilistische DACH-Prognose'),'Sichtbare DACH-Altbezeichnung ist noch vorhanden.');

// Kartenkontext muss unabhängig von der Anzahl/nestung der Gefahrenflächen oberhalb bleiben.
assert.ok(panel.includes('id="extreme-outlook-basemap"')&&panel.includes('zIndex={0}'));
assert.ok(panel.includes('id="extreme-outlook-context"')&&panel.includes('opacity={.48}')&&panel.includes('zIndex={20}'),'Grenz-/Stadtkontext muss über Gefahrenflächen nachgezeichnet werden.');
assert.ok(!panel.includes('basemaps.cartocdn.com'),'Extremkarte bleibt bei der freien OSM-Kartenquelle.');
assert.ok(panel.includes('zIndex={30}')&&panel.includes('zIndex={40}'),'Interaktion und Standort müssen oberhalb des Kontextlayers bleiben.');
assert.ok(overlay.includes("zIndex={35}"),'Gebietslabels müssen oberhalb des Kontextlayers bleiben.');
assert.ok(overlay.includes("'fill-opacity':['min',.66,['*',['get','opacity'],.86]]"),'Gefahrenfüllung muss gedeckelt sein, damit der Kartenkontext lesbar bleibt.');
assert.ok(overlay.includes("'fill-opacity':.58"),'Mehrfachschraffuren dürfen den Kartenkontext nicht vollständig überdecken.');
assert.ok(implementation.includes('v0.9.66.19')&&implementation.includes('v0.9.67.11')&&implementation.includes('Grenzen')&&implementation.includes('Städte'));

console.log(`MID v${pkg.version}: Mitteleuropa-Ausblick, vollständiges ICON-D2-Gebiet und lesbarer Grenz-/Stadtkontext über mehreren Gefahrenlayern geschützt.`);

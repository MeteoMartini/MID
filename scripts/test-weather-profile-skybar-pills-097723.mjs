import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,cockpit,detailSkyBar,contract,pkgRaw,baselineRaw]=await Promise.all([
  read('src/App.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/detailSkyBar.ts'),
  read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw);
const baseline=JSON.parse(baselineRaw);
const test='scripts/test-weather-profile-skybar-pills-097723.mjs';

assert.ok(app.includes('data-mid-sky-note="react"'),'Wetterstreifen-Hinweis fehlt in der 24h-Ansicht.');
assert.ok(app.includes('Ein einziger Wetterstreifen')&&app.includes('Niederschlag ersetzt die Bewölkungsfarbe')&&app.includes('farbiger Niederschlag auf gelbem Grund'),'Hinweis muss das Single-Strip-Konzept inklusive Sonnen-Schauer-Darstellung erklären.');

assert.ok(detailSkyBar.includes('const weatherStripVisual=')&&detailSkyBar.includes('const precipitationKind=')&&detailSkyBar.includes('const precipBandWidth='),'Single-Strip-Logik fehlt in detailSkyBar.ts.');
assert.ok(detailSkyBar.includes('mit Sonnenanteilen'),'Niederschlag mit Sonnenanteilen muss textlich erkennbar bleiben.');
assert.ok(detailSkyBar.includes('underlayColor')&&detailSkyBar.includes('precipSunOverlay')&&detailSkyBar.includes('underlayStrokeWidth'),'Für Schauer bei Sonne muss eine gelbe Unterlage unter dem Niederschlagsstrich existieren.');
assert.ok(detailSkyBar.includes('xPositions?:number[]'),'detailSkyBar muss explizite X-Positionen der 7-Tage-Kurvenübersicht unterstützen.');
assert.ok(detailSkyBar.includes("precipitationParts,type PrecipSample")&&detailSkyBar.includes('hours:PrecipSample[]')&&!detailSkyBar.includes("import type {Hour} from './weather'"),'Wetterstreifen muss Hour und kanonische ShortTermForecastPoint-Strukturen über den gemeinsamen PrecipSample-Vertrag akzeptieren.');
assert.ok(!detailSkyBar.includes("layer:'sun'" )&&!detailSkyBar.includes("layer:'cloud'" )&&!detailSkyBar.includes("layer:'precip'" ),'Die alte Drei-Layer-Streifenlogik darf nicht mehr vorhanden sein.');

assert.ok(cockpit.includes('nightBands=visible.flatMap')&&cockpit.includes('seven-day-curve-night-band'),'Die 7-Tage-Kurvenübersicht muss Nachtbänder berechnen und rendern.');
assert.ok(cockpit.includes('Schauer können bei viel Sonne farbig auf gelbem Grund erscheinen'),'Kurvenübersicht-Hinweis muss die Sonnen-Schauer-Darstellung nennen.');
assert.ok(cockpit.includes('dezent abgedunkelten Nachtstunden'),'ARIA-/Beschreibungs-Text für Nachtstunden fehlt.');

for(const token of ['ein einzelner, unterschiedlich breiter Wetterstreifen','Niederschlag ersetzt dabei die Bewölkungsdarstellung','farbiger Niederschlag auf gelbem Grund','7-Tage-Kurvenübersicht dunkelt Nachtstunden leicht ab']){
  assert.ok(contract.includes(token),`24h-Profil-Vertrag unvollständig: ${token}`);
}

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-skybar-pills'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Regressionstest muss in beiden Baseline-Testlisten enthalten sein.');

console.log(`MID v${pkg.version}: Single-Strip-Wetterband und Nachtabdunklung der 7-Tage-Kurvenübersicht geschützt.`);

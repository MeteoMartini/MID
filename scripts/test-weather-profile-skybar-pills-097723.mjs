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
assert.ok(app.includes('Ein einziger Wetterstreifen')&&app.includes('Niederschlag ersetzt die Bewölkungsfarbe')&&app.includes('sonnengetönter Niederschlag ohne 3D-Effekt'),'Hinweis muss das Single-Strip-Konzept inklusive bereinigter Sonnen-Schauer-Darstellung erklären.');

assert.ok(detailSkyBar.includes('const weatherStripVisual=')&&detailSkyBar.includes('const precipitationKind=')&&detailSkyBar.includes('const precipBandWidth=')&&detailSkyBar.includes('const SKYBAR_THICKNESS_STEPS=')&&detailSkyBar.includes('const sunVisualShare=')&&detailSkyBar.includes('const sampleIntervalSeconds=')&&detailSkyBar.includes('sunshineDuration ?? 0)/Math.max(60,intervalSeconds)')&&detailSkyBar.includes('precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds))'),'Single-Strip-Logik muss Sonnenanteil in Sekunden intervallgerecht normieren und Niederschlagsdicke aus mm/h ableiten.');
assert.ok(detailSkyBar.includes('mit Sonnenanteilen')&&detailSkyBar.includes('const precipSunColor=')&&detailSkyBar.includes('color-mix(in srgb'),'Niederschlag mit Sonnenanteilen muss ohne Unterlage als abgestufte Mischfarbe berechnet werden.');
assert.ok(!detailSkyBar.includes('underlayColor')&&!detailSkyBar.includes('underlayStrokeWidth')&&!detailSkyBar.includes('underlayOpacity'),'Der bereinigte Skybar darf keine 3D-Unterlage mehr rendern.');
assert.ok(app.includes('segmentWidth=Math.max(0,segment.x2-segment.x1)')&&cockpit.includes('segmentWidth=Math.max(0,segment.x2-segment.x1)'),'Skybar-Segmente müssen als innerhalb ihrer Zelle begrenzte Rechtecke statt überstehender Round-Cap-Linien gerendert werden.');
assert.ok(detailSkyBar.includes('xPositions?:number[]'),'detailSkyBar muss explizite X-Positionen der 7-Tage-Kurvenübersicht unterstützen.');
assert.ok(detailSkyBar.includes("precipitationParts,type PrecipSample")&&detailSkyBar.includes('hours:PrecipSample[]')&&!detailSkyBar.includes("import type {Hour} from './weather'"),'Wetterstreifen muss Hour und kanonische ShortTermForecastPoint-Strukturen über den gemeinsamen PrecipSample-Vertrag akzeptieren.');
assert.ok(!detailSkyBar.includes("layer:'sun'" )&&!detailSkyBar.includes("layer:'cloud'" )&&!detailSkyBar.includes("layer:'precip'" ),'Die alte Drei-Layer-Streifenlogik darf nicht mehr vorhanden sein.');

assert.ok(cockpit.includes('nightBands=(()=>{')&&cockpit.includes('hourly.forEach((hour,index)=>{const isNight=!hour.isDay')&&cockpit.includes('seven-day-curve-night-band')&&cockpit.includes('fillOpacity={0.07}')&&cockpit.includes('seven-day-curve-temperature-band')&&cockpit.includes('P25–P75'),'Die 7-Tage-Kurvenübersicht muss zusammenhängende, nochmals deutlich hellere Nachtbänder sowie das P25–P75-Band rendern.');
assert.ok(cockpit.includes('ohne 3D-Effekt')&&cockpit.includes('hellgraue Hülle um die Temperatur zeigt P25–P75'),'Kurvenübersicht-Hinweis muss die bereinigte Skybar und das Temperaturband nennen.');
assert.ok(cockpit.includes('zusammenhängenden Nachtstunden')&&cockpit.includes('deutlich heller hinterlegt')&&cockpit.includes('P25–P75-Unsicherheitsband'),'ARIA-/Beschreibungs-Text für hellere Nachtstunden und Temperaturband fehlt.');

for(const token of ['ein einzelner, unterschiedlich breiter Wetterstreifen','Niederschlag ersetzt dabei die Bewölkungsdarstellung','ohne 3D-Unterlage oder seitliche Überlappungen','7-Tage-Kurvenübersicht hellt Nachtstunden deutlich auf','hellgraues P25–P75-Band']){
  assert.ok(contract.includes(token),`24h-Profil-Vertrag unvollständig: ${token}`);
}

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-skybar-pills'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Regressionstest muss in beiden Baseline-Testlisten enthalten sein.');

console.log(`MID v${pkg.version}: Single-Strip-Wetterband ohne 3D-Effekt, mit Sonnenabstufung und hellerer 7-Tage-Kurvenübersicht geschützt.`);

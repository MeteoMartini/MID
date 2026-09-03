import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,cockpit,detailSkyBar,skyBarRenderer,styles,contract,pkgRaw,baselineRaw]=await Promise.all([
  read('src/App.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/detailSkyBar.ts'),
  read('src/SkyBarSegments.tsx'),
  read('src/styles-src/30-modern.css'),
  read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw);
const baseline=JSON.parse(baselineRaw);
const test='scripts/test-weather-profile-skybar-pills-097723.mjs';

assert.ok(app.includes('data-mid-sky-note="react"'),'Wetterstreifen-Hinweis fehlt in der 24h-Ansicht.');
assert.ok(app.includes('Niederschlag liegt farbrein über dem Grundband')&&app.includes('niemals mit Gelb/Grau gemischt')&&app.includes('Gerundete Teile'),'Hinweis muss den farbreinen Grundband-/Overlay-Vertrag erklären.');

for(const token of ['const weatherStripVisuals=','const baseSkyVisual=','const precipitationOverlayVisual=','const precipitationKind=','const precipBandWidth=','const precipBaseColor=','const SKYBAR_THICKNESS_STEPS=','const sunVisualShare=','const sampleIntervalSeconds=','sunshineDuration??0)/Math.max(60,intervalSeconds)','precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds))','return [...baseSegments,...precipSegments]']){
  assert.ok(detailSkyBar.includes(token),`Skybar-Vertrag unvollständig: ${token}`);
}
assert.ok(detailSkyBar.includes("layer:'base'")&&detailSkyBar.includes("layer:'precip'"),'Sonne/Bewölkung und Niederschlag müssen als getrennte Zeichenlagen geführt werden.');
assert.ok(!detailSkyBar.includes('const precipSunColor=')&&!detailSkyBar.includes('color-mix(in srgb'),'Niederschlag darf nicht mehr mit Gelb/Grau zu Mischfarben verrechnet werden.');
assert.ok(!detailSkyBar.includes('underlayColor')&&!detailSkyBar.includes('underlayStrokeWidth')&&!detailSkyBar.includes('underlayOpacity'),'Skybar darf keine 3D-Unterlage rendern.');
assert.ok(detailSkyBar.includes('xPositions?:number[]'),'detailSkyBar muss explizite X-Positionen der 7-Tage-Kurvenübersicht unterstützen.');
assert.ok(detailSkyBar.includes("precipitationParts,type PrecipSample")&&detailSkyBar.includes('hours:PrecipSample[]')&&!detailSkyBar.includes("import type {Hour} from './weather'"),'Wetterstreifen muss den gemeinsamen PrecipSample-Vertrag akzeptieren.');

assert.ok(app.includes('<SkyBarSegmentsSvg segments={skyBarSegments}')&&cockpit.includes('<SkyBarSegmentsSvg segments={profileSkyBarSegments}')&&skyBarRenderer.includes('joinedLeft=touches(')&&skyBarRenderer.includes('joinedRight=touches(')&&skyBarRenderer.includes('!joinedLeft?<circle')&&skyBarRenderer.includes('!joinedRight?<circle'),'Skybar-Segmente müssen gerundet sein, bei gleich dicken Nachbarsegmenten aber ohne optische Fuge verbunden werden.');
assert.ok(cockpit.includes('function cockpitDaySkyBarSegments(')&&cockpit.includes('data-mid-skybar="day-card"')&&styles.includes('.cockpit-day-skybar{'),'Skybar muss wieder in jeder 7-Tage-Tageskachel eingebunden sein.');

const curveStart=cockpit.indexOf('function SevenDayCurveOverview('),curveEnd=cockpit.indexOf('\nfunction cockpitDaySkyBarSegments(');
assert.ok(curveStart>=0&&curveEnd>curveStart,'7-Tage-Kurvenübersicht konnte nicht isoliert werden.');
const curve=cockpit.slice(curveStart,curveEnd);
assert.ok(curve.includes('nightBands=(()=>{')&&curve.includes('seven-day-curve-night-band'),'Die 7-Tage-Kurvenübersicht muss zusammenhängende Nachtbereiche rendern.');
assert.ok(!curve.includes('seven-day-curve-temperature-band')&&!curve.includes('P25–P75')&&!curve.includes('smoothBandPath')&&!curve.includes('interpolateTemperatureBand'),'P25–P75 muss aus der 7-Tage-Kurvenübersicht ersatzlos entfernt sein.');
assert.ok(styles.includes('.seven-day-curve-night-band{fill:rgba(164,181,199,.14)!important')&&styles.includes(':root[data-theme=light] .seven-day-curve-night-band{fill:rgba(73,92,113,.08)!important'),'Nachtstunden müssen in dunklem und hellem Design explizit sichtbar sein.');

for(const token of ['farbreines Grundband','keine Farbmischung mit Gelb/Grau','Alle Teilstücke sind gerundet','Nachtstunden wieder als zusammenhängende','P25–P75-Band um die Temperaturkurve ist ersatzlos entfernt']){
  assert.ok(contract.includes(token),`24h-Profil-Vertrag unvollständig: ${token}`);
}

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-skybar-pills'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Regressionstest muss in beiden Baseline-Testlisten enthalten sein.');

console.log(`MID v${pkg.version}: Tageskarten-Skybar, gerundete farbreine Grund-/Niederschlagslagen und themefeste 7-Tage-Nachtstunden ohne P25–P75 geschützt.`);

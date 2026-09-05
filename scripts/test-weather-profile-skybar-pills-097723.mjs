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
assert.ok(app.includes('Sonnenschein · gelb')&&app.includes('Bewölkung · grau')&&app.includes('Niederschlag · nach Phase')&&app.includes('Regen/Sprühregen/Schauer blau, Schnee hellblau, Misch-/gefrierende Phase violett, Gewitter/Hagel purpur')&&app.includes('mehr als 50 % relativer Sonnenscheindauer')&&app.includes('Grau beginnt ab 50 % Gesamtbewölkung')&&app.includes('Gelb und Grau werden nie gleichzeitig gezeichnet'),'Hinweis muss den exklusiven Gelb/Grau-/Phasenfarben- und 50–100-%-Skybar-Vertrag erklären.');

for(const token of ['const weatherStripVisuals=','const baseSkyVisual=','const precipitationOverlayVisual=','precipitationPhaseColor(parts.type)','precipitationPhaseColorLabel(parts.type)','const precipBandWidth=','const SKYBAR_THICKNESS_STEPS=','const sunVisualShare=','const sampleIntervalSeconds=','Number(rawSunshine)/Math.max(60,intervalSeconds)','precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds))','return [...baseSegments,...precipSegments]']){
  assert.ok(detailSkyBar.includes(token),`Skybar-Vertrag unvollständig: ${token}`);
}
assert.ok(detailSkyBar.includes("layer:'base'")&&detailSkyBar.includes("layer:'precip'"),'Sonne/Bewölkung und Niederschlag müssen als getrennte Zeichenlagen geführt werden.');
assert.ok(detailSkyBar.includes('const SKYBAR_THICKNESS_STEPS=[2.4,3.3,4.2,5.1] as const'),'Skybar muss die leicht verstärkten vier Dickenstufen verwenden.');
assert.ok(detailSkyBar.includes('if(!Number.isFinite(cloud)||cloud<50)return 0;')&&detailSkyBar.includes('skybarAboveHalfLevel(cloud/100)'),'Grauband darf erst ab 50 % Gesamtbewölkung beginnen und muss 50–100 % auf vier Dickenstufen abbilden.');
assert.ok(detailSkyBar.includes('if(sunshineShare<=.5)return 0;')&&detailSkyBar.includes('if(visualSunshine>.5)')&&detailSkyBar.includes("color:'#ffc229'"),'Gelb darf erst oberhalb 50 % relativer Sonnenscheindauer bzw. des Fallback-Aufklarungsanteils beginnen.');
assert.ok(!detailSkyBar.includes('if(daylight&&cloud<50)'),'Alter Wolken-Shortcut darf direkte Sonnenscheindauer nicht mehr übersteuern.');
assert.ok(detailSkyBar.includes("color:'#aeb3b9'")&&!detailSkyBar.includes("cloud>=82?'#b0b5bb':'#c0c5cb'"),'Bewölkung muss einen einheitlichen Grauton nutzen; die Stärke wird ausschließlich über die Dicke codiert.');
assert.ok(detailSkyBar.includes("import {precipitationPhaseColor,precipitationPhaseColorLabel} from './precipitationPhaseColor';")&&detailSkyBar.includes('color:precipitationPhaseColor(parts.type)'),'Skybar-Niederschlag muss die gemeinsame Art-/Phasenpalette verwenden.');
assert.ok(!detailSkyBar.includes('const precipSunColor=')&&!detailSkyBar.includes('color-mix(in srgb'),'Niederschlag darf nicht mehr mit Gelb/Grau zu Mischfarben verrechnet werden.');
assert.ok(!detailSkyBar.includes('underlayColor')&&!detailSkyBar.includes('underlayStrokeWidth')&&!detailSkyBar.includes('underlayOpacity'),'Skybar darf keine 3D-Unterlage rendern.');
assert.ok(detailSkyBar.includes('xPositions?:number[]'),'detailSkyBar muss explizite X-Positionen der 7-Tage-Kurvenübersicht unterstützen.');
assert.ok(detailSkyBar.includes("precipitationParts,type PrecipSample")&&detailSkyBar.includes('hours:PrecipSample[]')&&!detailSkyBar.includes("import type {Hour} from './weather'"),'Wetterstreifen muss den gemeinsamen PrecipSample-Vertrag akzeptieren.');

assert.ok(app.includes('<SkyBarSegmentsSvg segments={skyBarSegments}')&&cockpit.includes('<SkyBarSegmentsSvg segments={profileSkyBarSegments}')&&skyBarRenderer.includes('joinedLeft=touches(')&&skyBarRenderer.includes('joinedRight=touches(')&&skyBarRenderer.includes('!joinedLeft?<circle')&&skyBarRenderer.includes('!joinedRight?<circle'),'Skybar-Segmente müssen gerundet sein, bei gleich dicken Nachbarsegmenten aber ohne optische Fuge verbunden werden.');
assert.ok(cockpit.includes('function cockpitDaySkyBarSegments(')&&cockpit.includes('data-mid-skybar="day-card"')&&styles.includes('.cockpit-day-skybar{'),'Skybar muss wieder in jeder 7-Tage-Tageskachel eingebunden sein.');
assert.ok(cockpit.includes('probabilityHours=displayHours.filter(hour=>hour.time.startsWith(day.date))')&&cockpit.includes('calendarDayHours=probabilityHours')&&cockpit.includes('daySkyBarSegments=cockpitDaySkyBarSegments(calendarDayHours.length?calendarDayHours:dayHours)'),'Die Tageskachel-Skybar muss den vollständigen Kalendertag (24 h) statt nur des Tagesfensters verwenden, während der appweite PoP-Vertrag seinen probabilityHours-Alias behält.');

const curveStart=cockpit.indexOf('function SevenDayCurveOverview('),curveEnd=cockpit.indexOf('\nfunction cockpitDaySkyBarSegments(');
assert.ok(curveStart>=0&&curveEnd>curveStart,'7-Tage-Kurvenübersicht konnte nicht isoliert werden.');
const curve=cockpit.slice(curveStart,curveEnd);
assert.ok(curve.includes('nightBands=(()=>{')&&curve.includes('seven-day-curve-night-band'),'Die 7-Tage-Kurvenübersicht muss zusammenhängende Nachtbereiche rendern.');
assert.ok(!curve.includes('seven-day-curve-temperature-band')&&!curve.includes('P25–P75')&&!curve.includes('smoothBandPath')&&!curve.includes('interpolateTemperatureBand'),'P25–P75 muss aus der 7-Tage-Kurvenübersicht ersatzlos entfernt sein.');
assert.ok(styles.includes('.seven-day-curve-night-band{fill:rgba(164,181,199,.14)!important')&&styles.includes(':root[data-theme=light] .seven-day-curve-night-band{fill:rgba(73,92,113,.08)!important'),'Nachtstunden müssen in dunklem und hellem Design explizit sichtbar sein.');

for(const token of ['Regen/Sprühregen/Schauer blau, Schnee hellblau, Misch-/gefrierende Phase violett, Gewitter/Hagel purpur','50 % Gesamtbewölkung','vier gleich definierte Dickenstufen','einheitlichen Grauton','Nachtstunden wieder als zusammenhängende','P25–P75-Band um die Temperaturkurve ist ersatzlos entfernt']){
  assert.ok(contract.includes(token),`24h-Profil-Vertrag unvollständig: ${token}`);
}

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-skybar-pills'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Regressionstest muss in beiden Baseline-Testlisten enthalten sein.');

console.log(`MID v${pkg.version}: Tageskarten-Skybar, gerundete farbreine Grund-/Niederschlagslagen und themefeste 7-Tage-Nachtstunden ohne P25–P75 geschützt.`);

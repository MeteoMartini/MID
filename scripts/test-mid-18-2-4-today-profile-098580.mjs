import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,app,skybar,css,main,pkgRaw,baselineRaw]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/App.tsx'),
  read('src/detailSkyBar.ts'),
  read('src/midC18TodayProfileD.css'),
  read('src/main.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-4-today-profile-098580.mjs';

assert.equal(pkg.version,'0.9.85.80','Paketversion muss MID v0.9.85.80 sein.');
assert.equal(baseline.version,pkg.version,'Baseline-Version muss der Paketversion entsprechen.');
assert.equal(baseline.releaseVersion,pkg.version,'Release-Baseline muss der Paketversion entsprechen.');

for(const token of [
  'const profileXForEpoch=(epoch:number)=>',
  'const profileTimeGuidePoints=profileHourlyPoints.filter',
  'clockHour%3===0',
  'const chartAxisPoints=profileTimeGuidePoints.filter(item=>item.showLabel)',
  'profileTimeGuidePoints.map(item=><line',
  'className="hour-line hourly-guide"',
  'data-mid-profile-contract="d"',
  'data-mid-time-track="24h"',
  'profileSkyBarXPositions=profileSkyBarPoints.map(point=>profileXForEpoch(point.epoch))',
  'detailSkyBarSegments(profileSkyBarPoints',
  'profileSkyBarXPositions',
  "stroke={`url(#${temperatureGradientId})`}",
  'ecmwfTemperatureLineColor(item.point.temperature)',
  'selected-time-line',
  'selectedVisualPoint.x',
  'Die Skybar bleibt in beiden Ansichten unverändert stündlich aufgelöst.'
]) assert.ok(cockpit.includes(token),`24-h-Profilvertrag fehlt: ${token}`);

assert.ok(!cockpit.includes('const timeLabelStepMs=(chartViewportWidth<=560?6:chartViewportWidth<=860?4:3)*3600000'),'Zeitlabels dürfen nicht mehr auf 4/6 h ausgedünnt werden.');
assert.ok(cockpit.includes("profileResolution==='3h'"),'3-h-Darstellung muss weiterhin verfügbar bleiben.');
assert.ok(cockpit.includes('profileHourlyPoints')&&cockpit.includes('profileDisplayPoints'),'Stündliche Fachbasis und verdichtete Darstellungsbasis müssen getrennt bleiben.');

for(const token of [
  'profileTrackMinutes=24*60',
  'data-mid-profile-contract="d"',
  'data-mid-time-track="24h"',
  'skyBarTimelineHours=allDayHours.slice(0,24)',
  'detailSkyBarSegments(skyBarTimelineHours',
  'timeLabelPoints=skyBarTimelinePoints.filter',
  'point.minutes%180===0',
  'detailTemperatureLineGradient',
  'ecmwfTemperatureTone(hour.temperature).color',
  'profile-hour-grid'
]) assert.ok(app.includes(token),`Tagesdetailvertrag fehlt: ${token}`);

for(const token of [
  'Total cloud cover is the primary sky-state signal',
  'if(daylight&&boundedCloud<50)',
  'const width=cloudBandWidth(boundedCloud)',
  'const precipitation=precipitationOverlayVisual',
  'export function detailSkyBarHourCells',
  'const visuals=weatherStripVisuals(hour,intervalSeconds)',
  'xPositions represent interval starts'
]) assert.ok(skybar.includes(token),`Kanonischer Skybar-Vertrag fehlt: ${token}`);

for(const token of [
  ".cockpit-weather-profile[data-mid-work-package='d']",
  '.hour-line.hourly-guide',
  ".cockpit-meteogram-pro__canvas[data-mid-profile-contract='d']",
  ".meteogram-stage[data-mid-profile-contract='d']",
  '.detail-temperature-line.ecmwf',
  '@media(max-width:620px)',
  '@media(max-width:390px)',
  '--mid18-mobile-nav-reserve'
]) assert.ok(css.includes(token),`D-Responsivevertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18TodayProfileD.css';"),'D-Designschicht muss produktiv geladen werden.');
assert.ok(main.indexOf('midC18TodayProfileD.css')>main.indexOf('midC18B2CurrentAtmosphere.css'),'D-Designschicht muss nach B.2/C geladen werden.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
for(const path of [testPath,'src/midC18TodayProfileD.css','MID_TODAY_PROFILE_0.9.85.80.md']){
  assert.ok((baseline.requiredFiles||[]).includes(path),`${path} fehlt in requiredFiles`);
}

console.log('MID v0.9.85.80: Heute/Tagesprofil/24-h-Profil mit gemeinsamer Zeitspur, stündlichen Hilfslinien, 3-h-Labels und kanonischer Skybar geschützt.');

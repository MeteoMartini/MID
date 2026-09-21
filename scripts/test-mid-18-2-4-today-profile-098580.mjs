import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,renderer,skybar,css,main,pkgRaw,baselineRaw]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/SkyBarSegments.tsx'),
  read('src/detailSkyBar.ts'),
  read('src/midC18TodayProfile.css'),
  read('src/main.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-4-today-profile-098580.mjs';

for(const token of [
  'const timeLabelStepMs=3*3600000',
  'profileHourGridPoints=profileHourlyPoints.filter',
  'profileHourGridPoints.map(item=><line',
  'profileXForEpoch(point.epoch)',
  'xPositions={profileSkyBarXPositions}',
  'selectedIndex={profileSelectedSkyIndex}',
  'data-mid-profile-axis="shared-24h"',
  'data-mid-profile-track="shared-24h"',
  "Number.isFinite(Number(row.value))?\`\${Math.round(Number(row.value))} %\`:'nicht verfügbar'",
  'shortTermPrecipitationRateLabel',
  'Rate {shortTermPrecipitationRateLabel(selectedPoint)}',
  'mm/h'
]) assert.ok(cockpit.includes(token),`D-Profilvertrag fehlt: ${token}`);

for(const token of [
  'xPositions?:number[]',
  "data-mid-skybar-axis={hasPositions?'shared':'uniform'}",
  'const {start,end}=bounds(index)'
]) assert.ok(renderer.includes(token),`Stundenquadrate teilen die Profilachse nicht: ${token}`);

for(const token of [
  'Total cloud cover is the primary sky-state signal',
  'if(cloudKnown)',
  'const precipitation=precipitationOverlayVisual',
  'SKYBAR_THICKNESS_STEPS=[2.4,3.6,4.8,6.0]'
]) assert.ok(skybar.includes(token),`Kanonischer Skybar-Vertrag fehlt: ${token}`);

assert.ok(cockpit.includes('title={`${item.point.timeLabel} · ${item.point.weatherLabel}`}'),'Profilpiktogramm muss denselben kanonischen Wettertext wie der ausgewählte Punkt verwenden.');
assert.ok(cockpit.includes('<small>{selectedPoint.weatherLabel}</small>'),'Einzeldaten müssen denselben kanonischen Wettertext verwenden.');

for(const token of [
  '--mid-d-profile-track-min:620px',
  "overflow-x:auto!important",
  "[data-mid-profile-track='shared-24h']",
  'width:max(100%,var(--mid-d-profile-track-min))!important',
  'scroll-margin-bottom:calc(var(--mid18-mobile-nav-reserve,76px) + 14px)',
  '@media(max-width:430px)',
  '--mid-d-profile-track-min:600px'
]) assert.ok(css.includes(token),`Responsive D-Profilvertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18TodayProfile.css';"),'D-Designschicht muss produktiv geladen werden.');
assert.ok(main.indexOf("midC18TodayProfile.css")>main.indexOf("midC18B2CurrentAtmosphere.css"),'D-Designschicht muss nach B.2/C laden.');

assert.ok(/^0\.9\.85\.(?:80|8[1-9]|9\d|\d{3,})$/.test(pkg.version),'Paketversion muss D v0.9.85.80 oder einen neueren 0.9.85-Wartungsstand verwenden.');
assert.equal(baseline.version,pkg.version,'Baseline-Version muss Paketversion entsprechen.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Releaseversion muss Paketversion entsprechen.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
for(const path of [testPath,'src/midC18TodayProfile.css','MID_TODAY_PROFILE_0.9.85.80.md']){
  assert.ok((baseline.requiredFiles||[]).includes(path),`${path} fehlt in requiredFiles`);
}

console.log(`MID v${pkg.version}: gemeinsames 24-h-Zeitprofil, stündliches Raster, 3-h-Labels, Skybar/Quadrate und Einzeldaten geschützt.`);

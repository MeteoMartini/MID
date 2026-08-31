import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,styleSource,styles,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const token of [
 'chartStartEpoch=profileNow,chartEndEpoch=profileNow+PROFILE_WINDOW_MS',
 'chartWidth=Math.max(320,chartViewportWidth)',
 'chartCanvasHeight=chartHeight',
 'profileXForEpoch(point.epoch)',
 'x1={item.x} y1={skyBandTop} x2={item.x} y2={impactTop+impactHeight}',
 'DWD_WIND_THRESHOLDS_KMH.map(item=>({...item,kt:item.threshold/KMH_PER_KT}))',
 'firstWindWarningKt=(DWD_WIND_THRESHOLDS_KMH[0]?.threshold??50)/KMH_PER_KT',
 'chartWindMax=Math.max(30',
 'className={`wind-warning-band level-${guide.level}`}',
 'className="wind-warning-threshold"',
 'className="wind-warning-threshold-label"',
 'const nightBands=chartPoints.reduce',
 'nightBands.map(item=><rect',
 '',
 'profileXForEpoch(event.epoch)',
 "event.kind==='sunrise'?'↑':'↓'",
 'className="profile-now-line"',
 'className="profile-time-axis bottom"',
 'className="profile-bottom-time"',
 'profile-lane-unit-label',
 'Im Windfeld werden dieselben DWD-Böenwarnschwellen wie in der Tagesansicht',
 'Nachtstunden sind über alle Spuren hinweg abgedunkelt'
])assert.ok(cockpit.includes(token),`Modernes 24-h-Profil fehlt: ${token}`);

assert.ok(!cockpit.includes('chartMinimumWidth=chartViewportWidth<=560?620:chartViewportWidth<=860?760:980'),'Das mobile Profil darf nicht mehr als überbreites SVG verkleinert werden.');

for(const sheet of [styleSource,styles])for(const token of [
 'Tagesansicht-inspiriertes gleitendes 24-h-Wetterprofil',
 '.night-pattern-base{',
 '.profile-now-line{',
 '.wind-warning-band{',
 '.wind-warning-threshold{',
 '.wind-warning-threshold-label{',
 '.profile-bottom-time text{',
 '.profile-lane-unit-label{'
])assert.ok(sheet.includes(token),`Modernes 24-h-CSS fehlt: ${token}`);

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-weather-profile-modern-dayview-097610.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron bleiben.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
assert.ok(baseline.protectedFiles.includes(test),`${test} muss als visueller Vertrags-Test geschützt sein.`);
console.log(`MID v${pkg.version}: gleitendes 24-h-Tagesansichtsdesign mit gemeinsamer Zeitachse, Nacht, Solarereignissen und DWD-Windwarnschwellen geprüft.`);

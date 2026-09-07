import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-weather-profile-polish-temporal-09802.mjs';

assert.ok(cockpit.includes('profilePlotClipId=`mid-profile-plot-clip-${meteogramId}`'),'Ein eindeutiger Plot-Clip fehlt.');
assert.ok(cockpit.includes('<clipPath id={profilePlotClipId}><rect x={chartDataLeft} y="0" width={chartDataWidth} height={chartHeight}/></clipPath>'),'Der Plot-Clip muss exakt der gemeinsamen 24-h-Achse entsprechen.');
assert.ok(cockpit.includes('clipPath={`url(#${profilePlotClipId})`}'),'Die Skybar ist nicht gegen Überstand aus dem Zeitfenster geschützt.');
for(const lane of ['weather','thermal','thermal-feel','precip','wind','pressure','cloud','impact'])assert.ok(cockpit.includes(`className="lane-bg ${lane}" x={chartDataLeft}`),`${lane}: Spurfläche beginnt nicht an der gemeinsamen Zeitgrenze.`);
assert.ok(cockpit.includes('width={chartDataWidth}'),'Spurflächen müssen an +24 h enden.');
assert.ok(cockpit.includes('precipitationStartEpoch')&&cockpit.includes('precipitationEndEpoch')&&cockpit.includes('probabilityPath=chartPoints.reduce'),'Niederschlag und PoP müssen echte Intervalle behalten.');
assert.ok(cockpit.includes('profileXForEpoch(point.epoch)')&&cockpit.includes('pressurePath=buildShortTermChartPath'),'Punktgrößen müssen am gültigen Zeitpunkt bleiben.');
assert.ok(cockpit.includes('Open-Meteo-Stundenmengen bleiben')&&cockpit.includes('intern "preceding hour sums"'),'Der Quellvertrag für stündliche Akkumulationen fehlt.');
assert.ok(styles.includes('24-h-Profil: ruhige Plotflächen und harte gemeinsame Zeitgrenzen'),'Politurvertrag fehlt.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket und Baseline müssen versionsgleich sein.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Regression ist nicht im Release-Gate verankert.');
console.log('24-h-Profil: Plotgrenzen und Zeitsemantik geprüft.');

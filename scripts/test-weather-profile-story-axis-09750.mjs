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
 'const profileXForEpoch=(epoch:number)=>',
 'profileXForEpoch(point.epoch)',
 'profileXForEpoch(event.epoch)',
 'x1={item.x} y1={skyBandTop} x2={item.x} y2={impactTop+impactHeight}',
 'x1={selectedVisualPoint.x} x2={selectedVisualPoint.x} y1={skyBandTop}',
 'x={item.x-weatherPictogramOffset} y={78}',
 'style={{left:positionPct(item.x)}}',
 'className="lane-bg weather"',
 'pressureTop=498,pressureBottom=550',
 'className="pressure-line"',
 "import {detailSkyBarSegments} from './detailSkyBar';",
 'profileSkyBarSegments=detailSkyBarSegments(',
 'data-mid-skybar="profile"',
 "key:'high'",
 "key:'mid'",
 "key:'low'",
 'className={`cloud-opacity-band ${row.className}`}',
 'stopColor="var(--profile-cloud)"',
 '>Wolken</text>',
 '>Gesamt</text>'
])assert.ok(cockpit.includes(token),`Gemeinsamer 24-h-Story-Axis-Vertrag fehlt: ${token}`);

for(const forbidden of [
 "rows=[{key:'total',className:'total',y:cloudTop",
 'selected-cloud-values',
 'Wolken (%)',
 'SvgProfileCloudStructure',
 'cloud-cell-frame',
 '--profile-cloud-high',
 '--profile-cloud-mid',
 '--profile-cloud-low'
])assert.ok(!cockpit.includes(forbidden)&&!styleSource.includes(forbidden),`Entfernter Wolkenachsen-/Strukturvertrag ist noch vorhanden: ${forbidden}`);

for(const sheet of [styleSource,styles])for(const token of [
 '.cockpit-weather-profile .cloud-opacity-band{',
 '.pressure-line{fill:none;stroke:var(--profile-pressure);stroke-width:1.55',
 '@media (orientation:landscape) and (max-width:1180px) and (max-height:760px)',
 "'profile-chart profile-data'"
])assert.ok(sheet.includes(token),`Responsive/visueller 24-h-Vertrag fehlt: ${token}`);

const packageVersion=JSON.parse(pkgText).version,baseline=JSON.parse(baselineText),test='scripts/test-weather-profile-story-axis-09750.mjs';
assert.equal(packageVersion,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} muss als Pflichtdatei geschützt sein.`);
console.log(`MID v${packageVersion}: gemeinsame senkrechte 24-h-Zeitachse, sichtbarer Luftdruck, Tagesansicht-Skybar für Gesamt sowie H/M/L-Graubänder geprüft.`);

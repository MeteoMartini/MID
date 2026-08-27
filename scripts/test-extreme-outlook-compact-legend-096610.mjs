import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const[panel,styles,outlook,worker,pkgRaw,baselineRaw,implementation]=await Promise.all([
 readFile('src/ExtremeWeatherOutlookPanel.tsx','utf8'),
 readFile('src/styles-src/25-extreme-outlook.css','utf8'),
 readFile('src/extremeWeatherOutlook.ts','utf8'),
 readFile('worker-src/25-dach-extreme-outlook.js','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('MID_IMPLEMENTATION_0.9.66.10.md','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-compact-legend-096610.mjs';
assert.ok(pkg.version.startsWith('0.9.66.')&&Number(pkg.version.split('.')[3])>=10);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-compact-legend'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test)&&baseline.requiredFiles.includes(test));
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.10.md'));
for(const token of ["1:'Gefahr'","2:'markant'","3:'Unwetter'","4:'extrem'",'unter 60 %','id="extreme-outlook-context"','opacity={.28}','zIndex={18}','tile.openstreetmap.org/{z}/{x}/{y}.png'])assert.ok(panel.includes(token),`Kompakte Legende oder Vordergrundkontext unvollständig: ${token}`);
assert.ok(!panel.includes('basemaps.cartocdn.com'),'Die kompakte Extremkarte darf keine CARTO-API-Key-Wasserzeichen laden.');
assert.ok(!panel.includes('Farbe = erwartete Auswirkung · Prozent/Deckkraft = Eintrittswahrscheinlichkeit'),'Redundanter Kartenlegendentext ist noch vorhanden.');
assert.ok(panel.includes('extremeProbabilityBand(displayProbability)')&&panel.includes('<strong>{displayProbability} %</strong>'),'Band und Prozentanzeige müssen dieselbe gerundete Wahrscheinlichkeit verwenden.');
assert.ok(outlook.includes("rounded>=10?'P1':'P0'"));
assert.ok(worker.includes('probability:displayProbability,probabilityBand:dachExtremeProbabilityBand(displayProbability)'));
for(const token of ['grid-template-columns:repeat(2,minmax(0,1fr))','width:178px','.extreme-map-legend>small{display:none}'])assert.ok(styles.includes(token),`Kompaktes Legendenlayout fehlt: ${token}`);
assert.ok(implementation.includes('zweispaltig')&&implementation.includes('unter 60 %'));
console.log('MID 0.9.66.10: kompakte Kartenlegende sowie Kartenlinien und Beschriftungen oberhalb der Gefahrenflächen geprüft.');

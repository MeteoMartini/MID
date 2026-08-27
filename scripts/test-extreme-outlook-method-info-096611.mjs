import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const[panel,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 readFile('src/ExtremeWeatherOutlookPanel.tsx','utf8'),
 readFile('src/styles-src/25-extreme-outlook.css','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('MID_IMPLEMENTATION_0.9.66.11.md','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-extreme-outlook-method-info-096611.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.66.11'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:extreme-outlook-method-info'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test)&&baseline.requiredFiles.includes(test));
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.11.md'));
assert.ok(!panel.includes('<p className="extreme-map-note">'),'Methodiktext ist weiterhin dauerhaft sichtbar.');
for(const token of ['className="extreme-map-note-action"','className="extreme-map-method-trigger"','Methodik und Grenzen der Gefahrenflächenkarte','Geglättete Isoplethenflächen','showClose'])assert.ok(panel.includes(token),`Info-Popover unvollständig: ${token}`);
for(const token of ['.extreme-map-note-action{display:flex','justify-content:flex-end','.extreme-map-method-trigger>button{width:28px'])assert.ok(styles.includes(token),`Kompakter Info-Trigger fehlt: ${token}`);
assert.ok(implementation.includes('nicht mehr dauerhaft angezeigt')&&implementation.includes('Info-Button'));
console.log('MID 0.9.66.11: Kartenmethodik ist platzsparend hinter dem standardisierten Info-Button verfügbar.');

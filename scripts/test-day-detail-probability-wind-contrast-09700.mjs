import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,foundation,cockpit,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 read('src/App.tsx'),read('src/styles-src/00-foundation.css'),read('src/styles-src/20-ensemble-composite.css'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.70.0.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-day-detail-probability-wind-contrast-09700.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.70.0'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:day-detail-probability-wind-contrast'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);

assert.ok(app.includes("const probabilityPath=showProbability?p.map"),'Niederschlagswahrscheinlichkeit muss unabhängig von vorhandenen Niederschlagsbalken gezeichnet werden.');
assert.ok(!app.includes('showProbability&&!showRainBars'),'Niederschlagsbalken dürfen die Wahrscheinlichkeitskurve nicht mehr unterdrücken.');
for(const token of ['className="detail-probability-line"','className="detail-probability-halo"','stroke="#56d7ff"','stroke="var(--detail-probability-halo)"'])assert.ok(app.includes(token),`Kontrastierter Wahrscheinlichkeits-Layer fehlt: ${token}`);

assert.ok(foundation.includes('.svg-wind-direction-arrow{stroke:#bfe9ff'),'Windpfeile benötigen im dunklen Design einen hellen Grundkontrast.');
assert.ok(foundation.includes(':root[data-theme=light] .svg-wind-direction-arrow{stroke:#12658f'),'Helles Design benötigt einen eigenen dunklen Windpfeil-Kontrast.');
assert.ok(foundation.includes('--detail-probability-halo:rgba(10,35,55,.78)'));
assert.ok(foundation.includes(':root[data-theme=light]{--detail-probability-halo:rgba(255,255,255,.94)}'));
assert.ok(!cockpit.includes('.svg-wind-direction-arrow line,.svg-wind-direction-arrow path{stroke:#20374d'),'Cockpit-CSS darf die appweite Windpfeil-Farbe nicht mehr global dunkel überschreiben.');
assert.ok(cockpit.includes('.cockpit-short-chart .svg-wind-direction-arrow line,.cockpit-short-chart .svg-wind-direction-arrow path'),'Cockpit-spezifische Pfeilregeln müssen auf das Cockpit begrenzt bleiben.');
for(const token of ['.svg-wind-direction-arrow{stroke:#bfe9ff','--detail-probability-halo:rgba(10,35,55,.78)','.cockpit-short-chart .svg-wind-direction-arrow line'])assert.ok(styles.includes(token),`Generiertes Styles-Aggregat ist nicht synchron: ${token}`);

for(const token of ['Niederschlagswahrscheinlichkeit','dunklen Ansicht','Windpfeile'])assert.ok(implementation.includes(token),`Umsetzungsnachweis fehlt: ${token}`);
console.log('MID v0.9.70.0: Tagesansicht zeigt die Niederschlagswahrscheinlichkeit auch mit Balken und kontrastreiche Windpfeile in Hell/Dunkel.');

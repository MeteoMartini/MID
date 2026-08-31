import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,modern,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.76.27.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-thunder-mobile-route-cards-097627.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.76.27'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:thunder-mobile-route-cards'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(app.includes('currentVisible=currentPlaces.slice(0,2),futureVisible=futurePlaces.slice(0,3)'),'Mobile/erweiterte Primärliste ist nicht konsequent auf 2 aktuelle + 3 vorausliegende Orte begrenzt.');
assert.ok(app.includes('Weitere Orte anzeigen ('),'Zusätzliche Orte müssen hinter einem Disclosure erreichbar bleiben.');
for(const css of [modern,styles])for(const token of [
 '.thunder-place-group.current .thunder-place-stack{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}',
 '.thunder-place-group.current .thunder-place-row{display:grid;grid-template-columns:1fr;',
 '.thunder-place-group.future .thunder-place-stack{display:flex;gap:6px;overflow-x:auto;',
 'scroll-snap-type:x proximity',
 '.thunder-place-group.future .thunder-place-row{display:grid;grid-template-columns:1fr;align-content:start;flex:0 0 min(72%,190px);'
])assert.ok(css.includes(token),`Mobile Gewitter-Zugbahndarstellung fehlt: ${token}`);
for(const token of ['zwei aktuelle','drei vorausliegende','horizontale Zugbahn','Stecknadel','Worker-Upload'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);
console.log(`MID v${pkg.version}: mobile Gewitterorte als verdichtete aktuelle Karten plus horizontale Zugbahn geprüft.`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [app,radar,modern,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 read('src/App.tsx'),read('src/DwdPrecipitationTypeRadar.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),
 read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.76.26.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-thunder-mobile-place-summary-pin-097625.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.76.26'));
assert.equal(baseline.releaseVersion,pkg.version,'Paket- und Baseline-Version müssen synchron sein.');
assert.equal(pkg.scripts?.['test:thunder-mobile-place-summary-pin'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.76.26.md'),'Neuer Umsetzungsnachweis fehlt in der Baseline.');

for(const token of [
 'const currentPlaces=places.filter(place=>place.status===\'now\')',
 'const renderPlaceRows=(items:ThunderInfoPlace[])=>items.map(',
 'className="thunder-place-summary"',
 'className="thunder-place-pill now"',
 'Jetzt im Zellbereich',
 'Nächste Orte auf der Zugbahn',
 'Weitere Orte anzeigen ('
])assert.ok(app.includes(token),`Gewitter-Ortsgruppierung fehlt: ${token}`);
assert.ok(app.includes('futureVisible=futurePlaces.slice(0,3)'),'Vorabbegrenzung der Zugbahn-Orte auf drei sichtbare Einträge fehlt.');
assert.ok(app.includes('hiddenLoaded=Math.max(0,places.length-shownCount)'),'Restzählung für lange Ortslisten fehlt.');

for(const css of [modern,styles])for(const token of [
 '.thunder-place-summary{display:flex;flex-wrap:wrap;gap:6px}',
 '.thunder-place-pill.now{background:#d9f8e4;color:#087a42',
 '.thunder-place-group{display:grid;gap:6px;padding:9px 10px',
 '.thunder-place-more{display:grid;gap:8px;padding:8px 9px',
 '.thunder-place-section.compact .thunder-place-group:last-of-type .thunder-place-stack>.thunder-place-row:nth-child(n+4){display:none}',
 '.dwd-precip-type-radar__location-pin{display:block;font-size:26px'
])assert.ok(css.includes(token),`Mobile Verdichtung/Stecknadel-CSS fehlt: ${token}`);

assert.ok(radar.includes('className="dwd-precip-type-radar__location-pin" aria-hidden="true">📍</span></button>'),'Radaransicht verwendet keine echte Stecknadel.');
for(const token of ['Ortsliste','Jetzt im Zellbereich','Weitere Orte anzeigen','Stecknadel','Worker-Upload'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);

console.log(`MID v${pkg.version}: kompaktere mobile Gewitter-Ortsdarstellung und echte DWD-Stecknadel geprüft.`);

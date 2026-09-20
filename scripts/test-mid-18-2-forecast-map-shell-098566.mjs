import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,main,app,forecast,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18ForecastMapShellPolish.css'),
 read('src/main.tsx'),
 read('src/App.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-forecast-map-shell-098566.mjs';

for(const token of [
 "width:min(1580px,100%)!important",
 ".mid-page-grid",
 ".forecast-cockpit.modern-workspace",
 ".modern-map-focus-shell",
 "[data-cockpit-horizontal-scroll='true']",
 "overflow-x:auto!important",
 "overscroll-behavior-x:contain!important",
 ".cockpit-seven-grid",
 ".cockpit-fourteen-grid",
 ".composite-layer-switches",
 ".composite-focus-layer-switches",
 "overflow-x:clip!important"
]) assert.ok(css.includes(token),`Forecast-/Karten-Shell-Vertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18ForecastMapShellPolish.css';"),'Forecast-/Karten-Shell-Polish wird nicht geladen.');
assert.ok(main.indexOf("midC18ForecastMapShellPolish.css")>main.indexOf("midC18InteractionCurrentPolish.css"),'Forecast-/Karten-Shell-Polish muss als spätere MID-18.2-Schicht laden.');
assert.ok(app.includes('className="modern-map-focus-shell"'),'Kartenfokus muss die gemeinsame moderne Karten-Shell verwenden.');
assert.ok(forecast.includes('data-cockpit-horizontal-scroll="true"'),'Forecast-Cockpit muss dichte Zeitreihen als innere Scrollflächen kennzeichnen.');
assert.ok(forecast.includes('className="cockpit-seven-grid"')&&forecast.includes('className="cockpit-fourteen-grid"'),'7-/14-Tage-Instrumente müssen erhalten bleiben.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Forecast-/Karten-Shell-Regression fehlt in requiredFiles.');

console.log('MID v0.9.85.66: gemeinsame 1580-px-Seitenshell, innere Forecast-Scrollflächen und Kartenbreiten geschützt.');

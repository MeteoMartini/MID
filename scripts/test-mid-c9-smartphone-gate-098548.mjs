import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,forecastCockpit,css,main,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/ForecastCockpit.tsx','utf8'),
 readFile('src/midC9SmartphoneGate.css','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-mid-c9-smartphone-gate-098548.mjs';

for(const token of [
 "grid-template-columns:minmax(0,1fr)!important",
 "grid-template-areas:\"admin warning\" \"title warning\" \"meta meta\"",
 ".place-title-row h1",
 "word-break:normal!important",
 ".place-nowcards",
 ".favorite-bubbles",
 "overflow-x:auto!important",
 ".favorite-strip-manage",
 "padding-bottom:calc(88px + var(--mid-safe-bottom))",
 "overflow-x:clip",
 ".current-weather-facts>.humidity small::before",
 "content:\"Taupunkt\"",
 ".current-weather-facts>.humidity em::before",
 "content:\"rel. Feuchte \"",
 "@media(max-width:370px)",
 "@media(max-width:850px) and (orientation:landscape)",
 "--mid-mobile-forecast-height",
 "overflow-y:auto!important",
 "overscroll-behavior-y:contain!important",
 "flex-shrink:0!important"
])assert.ok(css.includes(token),`MID-C9-Smartphone-Gate fehlt: ${token}`);

assert.ok(forecastCockpit.includes(".navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs"),'Mobile Forecast muss die reale Oberkante der Bottom-Bar messen.');
assert.ok(forecastCockpit.includes("--mid-mobile-forecast-height"),'Gemessene mobile Forecast-Höhe muss als CSS-Variable gesetzt werden.');
assert.ok(forecastCockpit.includes("ResizeObserver"),'Forecast-Höhe muss auf Layoutänderungen reagieren.');
assert.ok(main.includes("import './midC9SmartphoneGate.css';"),'MID-C9-Smartphone-Gate fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midC9SmartphoneGate.css';")>main.indexOf("import './midDesign201CurrentCritical.css';"),'MID-C9-Gate muss als letzter gezielter Design-Override geladen werden.');
assert.ok(app.includes('Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em>'),'Kanonische echte Taupunkt-/Feuchtedaten dürfen nicht durch Demo-Daten ersetzt werden.');
assert.ok(app.includes('displayHours={shortDisplayHours}')||app.includes('displayHours'),'Die echte stündliche Kurzfristreihe muss erhalten bleiben.');
assert.ok(!css.includes('previewFixture'),'Replit-Vorschau-Fixtures dürfen nicht in den Produktionsstil gelangen.');
assert.ok(!/#[0-9a-f]{3,8}/i.test(css),'Der Smartphone-Fix muss die bestehenden Light-/Dark-Tokens verwenden.');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}`);
assert.ok(baseline.requiredFiles?.includes(test),`${test} fehlt in requiredFiles`);

console.log('MID-C9: Smartphone-Ortskopf, Favoriten, mobile Forecast-Scrollgrenze, Bottom-Safe-Area, Taupunkt-Hierarchie und datenisolierte Stundenansicht geschützt.');

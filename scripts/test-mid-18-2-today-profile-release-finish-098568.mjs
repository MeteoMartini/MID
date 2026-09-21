import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,main,forecast,app,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18TodayReleaseFinish.css'),
 read('src/main.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('src/App.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-today-profile-release-finish-098568.mjs';

for(const token of [
 '.cockpit-short-term',
 '.cockpit-now90',
 '.cockpit-now90-track',
 '.cockpit-hourly-preview-shell',
 '.cockpit-weather-profile',
 '.cockpit-meteogram-pro__stage',
 '.cockpit-meteogram-pro__legend',
 '.cockpit-meteogram-pro__datafield',
 'overflow-x:auto!important',
 'overscroll-behavior-x:contain!important',
 'scroll-margin-bottom:calc(88px + var(--mid-safe-bottom))',
 '@media(max-width:430px)',
 '@media(max-width:390px)'
]) assert.ok(css.includes(token),`Heute/24-h-Release-Finish fehlt: ${token}`);

assert.ok(main.includes("import './midC18TodayReleaseFinish.css';"),'Heute/24-h-Release-Finish wird nicht geladen.');
assert.ok(main.indexOf('midC18TodayReleaseFinish.css')>main.indexOf('midC18SecondaryWorkspaceFinish.css'),'Heute/24-h-Finish muss die späteste MID-18.2-Schicht sein.');

for(const token of [
 'className="cockpit-short-term"',
 'className="cockpit-now90"',
 'data-mid-time-axis="now90"',
 'className="cockpit-meteogram-pro cockpit-weather-profile"',
 'className="cockpit-hourly-preview-shell"',
 '24 Stunden ·'
]) assert.ok(forecast.includes(token),`Forecast-Struktur fehlt: ${token}`);

for(const forbidden of [
 'Preview-State · kein Produktionsrouting',
 'Demo-/Mockup-Stand',
 'Demo-/Mockup',
 'kein Produktionsrouting'
]){
 assert.ok(!app.includes(forbidden)&&!forecast.includes(forbidden),`Sichtbarer Entwicklungsmarker darf nicht produktiv bleiben: ${forbidden}`);
}

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Heute/24-h-Regression fehlt in requiredFiles.');

console.log('MID v0.9.85.68: Ab-jetzt-, 90-min- und 24-h-Surfaces sowie produktive Textfreiheit geschützt.');

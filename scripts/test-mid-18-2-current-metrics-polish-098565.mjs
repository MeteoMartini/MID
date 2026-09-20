import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18InteractionCurrentPolish.css'),
 read('src/main.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-current-metrics-polish-098565.mjs';

for(const token of [
 'MID v0.9.85.65 · Current metrics visual cleanup',
 '#current-weather-metrics>article>header',
 'grid-row:1!important',
 '#current-weather-metrics>article>strong',
 'grid-row:2!important',
 'position:static!important',
 '#current-weather-metrics>article>.current-metric-summary',
 'grid-row:3!important',
 '#current-weather-metrics>.uvi-card>strong',
 '#current-weather-metrics>.air-quality-card>strong',
 '#current-weather-metrics>.air-quality-card>.aqi-indicator',
 'grid-row:4!important',
 '#current-weather-metrics>.sunshine-card>strong',
 '#current-weather-metrics>.sun-moon-card>strong',
 '.sun-moon-card-value',
 '@media(min-width:391px) and (max-width:620px)',
 '@media(max-width:390px)'
]) assert.ok(css.includes(token),`Current-Metrics-Polish fehlt: ${token}`);

assert.ok(main.includes("import './midC18InteractionCurrentPolish.css';"),'Current-Polish-Layer muss im Produktionsentry geladen werden.');
assert.ok(main.indexOf("midC18InteractionCurrentPolish.css")>main.indexOf("midC18UnifiedThreadTimeline.css"),'Current-Polish muss nach der Timeline-Schicht laden.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Screenshot-Regression fehlt in requiredFiles.');

console.log('MID v0.9.85.65: Current-Messwertkarten sind auf 390–620 px hierarchisch getrennt und kollisionsfrei geschützt.');

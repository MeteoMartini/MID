import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,weather,weatherSource,css,main,worker,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/weather.ts'),
 read('src/weather-src/00-types-models-search.tsfrag'),
 read('src/midC18WarningTimeline.css'),
 read('src/main.tsx'),
 read('worker-src/00-core-observations.js'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-4-warning-timeline-098577.mjs';

for(const token of [
 'AMTLICHE WARNUNGEN · EREIGNIS-TIMELINE',
 'Priorisiert und folgend',
 'Warnstatus nicht bestimmbar',
 'Eine Quellenstörung wird nicht als Entwarnung gewertet.',
 'Eintrittswahrscheinlichkeit',
 'officialAlertIsRelevant',
 'automaticHazardIsRelevant',
 'warning-now-row',
 'MID · PROGNOSEHINWEIS',
 'warnings-extreme-entry',
 "navigateToDashboardSection('warnings')"
]) assert.ok(app.includes(token),`Warnungs-Timeline-Vertrag fehlt: ${token}`);

assert.ok(app.indexOf("if(officialError)return{tone:'unavailable',label:'Warnstatus nicht bestimmbar'")>=0,'Quellenstörung darf im Ortskopf nicht als Entwarnung erscheinen.');
assert.ok(app.includes("alerts.filter(officialAlertIsRelevant)"),'Amtliche Liste muss abgelaufene Ereignisse filtern.');
assert.ok(app.includes("automatic.filter(automaticHazardIsRelevant)"),'MID-Hinweise müssen abgelaufene Ereignisse filtern.');
assert.ok(app.includes(".sort((a,b)=>(Number.isFinite(a.start)?a.start:Number.MAX_SAFE_INTEGER)-(Number.isFinite(b.start)?b.start:Number.MAX_SAFE_INTEGER)"),'Ereignisse müssen chronologisch nach Beginn sortiert bleiben.');

for(const token of [
 '.warning-event-timeline:before',
 '.warning-now-row',
 '.warning-event-marker',
 '.warning-event-row.yellow{--warning-marker:',
 '.warning-event-row.orange{--warning-marker:',
 '.warning-event-row.red{--warning-marker:',
 '.warning-event-row.purple{--warning-marker:',
 '.warning-event-row.advisory{--warning-marker:var(--accent)}',
 'overflow:visible!important'
]) assert.ok(css.includes(token),`Timeline-CSS-Vertrag fehlt: ${token}`);

assert.ok(!css.includes('.warning-event-row.yellow{background:'),'Warnstufenfarbe darf nicht die Ereigniskarte flächig einfärben.');
assert.ok(main.includes("import './midC18WarningTimeline.css';"),'Warnungs-Timeline-CSS wird nicht geladen.');
assert.ok(main.indexOf('midC18WarningTimeline.css')>main.indexOf('midC18ReplitHandoffPolish.css'),'Warnungs-Timeline muss die abschließende Redesign-Schicht sein.');
assert.ok(weather.includes('probability?:number|string'),'Amtliche Warnung muss optionale Eintrittswahrscheinlichkeit transportieren können.');
assert.ok(weatherSource.includes('probability?:number|string'),'Weather-Source-of-Truth muss die optionale Eintrittswahrscheinlichkeit dauerhaft erhalten.');
assert.ok(worker.includes('capWarningProbability')&&worker.includes("'PROBABILITY','PROBABILITY_VALUE','PROBABILITYVALUE','LIKELIHOOD'"),'Worker darf vorhandene amtliche Wahrscheinlichkeitsfelder nicht verlieren.');
assert.equal(pkg.version,'0.9.85.78','Paketversion ist nicht MID v0.9.85.78.');
assert.equal(baseline.releaseVersion,pkg.version,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
for(const path of [test,'src/midC18WarningTimeline.css','MID_WARNING_TIMELINE_0.9.85.78.md']) assert.ok((baseline.requiredFiles||[]).includes(path),`${path} fehlt in requiredFiles.`);

console.log('MID v0.9.85.78: Warnungs-Timeline, Quellenstörung, Chronologie und Warnfarben geschützt.');

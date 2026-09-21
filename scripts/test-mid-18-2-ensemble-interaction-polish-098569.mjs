import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [panel,css,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/EnsemblePanel.tsx'),
 read('src/midC18EnsembleInteractionPolish.css'),
 read('src/main.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-ensemble-interaction-polish-098569.mjs';

assert.ok(panel.includes('tooltipActive:suppressed?false:undefined,suppressed'),'Tooltip-State muss den unterdrückten Zustand für aktive Punkte exponieren.');
for(const token of [
 'activeDot={tooltip.suppressed?false:{r:4}}',
 'activeDot={rainTooltip.suppressed?false:{r:4}}',
 'activeDot={rainTooltip.suppressed?false:{r:3.6}}',
 'activeDot={false}'
]) assert.ok(panel.includes(token),`Aktive Ensemble-Marker werden nach Tooltip-Schließen nicht sauber zurückgesetzt: ${token}`);

for(const token of [
 'MID v0.9.85.69 · Ensemble interaction/readability polish',
 '.ensemble-metric-deck>button',
 'grid-template-rows:auto 30px!important',
 '.ensemble-metric-mini',
 'overflow:hidden!important',
 '.trend-legend',
 'flex-wrap:wrap!important',
 '@media(max-width:520px)',
 'scroll-snap-type:x proximity'
]) assert.ok(css.includes(token),`Ensemble-Polish fehlt: ${token}`);

assert.ok(main.includes("import './midC18EnsembleInteractionPolish.css';"),'Ensemble-Interaction-Polish wird nicht geladen.');
assert.ok(main.indexOf("midC18EnsembleInteractionPolish.css")>main.indexOf("midC18ForecastMapShellPolish.css"),'Ensemble-Polish muss nach der bisherigen MID-18.2-Shell laden.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests']) assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
assert.ok((baseline.requiredFiles||[]).includes(test),'Ensemble-Regression fehlt in requiredFiles.');

console.log('MID v0.9.85.69: Ensemble-Metrikvorschauen überlagern keine Labels; geschlossene Tooltips hinterlassen keine aktiven Plotmarker.');

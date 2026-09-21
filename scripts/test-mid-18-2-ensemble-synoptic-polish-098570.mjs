import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [ensemble,radar,css,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/EnsemblePanel.tsx'),
 read('src/RadarPanel.tsx'),
 read('src/midC18EnsembleSynopticPolish.css'),
 read('src/main.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const test='scripts/test-mid-18-2-ensemble-synoptic-polish-098570.mjs';

assert.ok(ensemble.includes('Math.min(88,Math.max(12,Math.abs(anomaly)*11))'),'Temperatur-Miniaturen müssen auf Mobile deutlich sichtbarer skaliert sein.');
for(const token of [
 "count=Math.min(12,Math.max(4,Math.floor(prepared.length/165)))",
 "iconSize:[20,20]",
 "typedFront=type==='cold'||type==='warm'||type==='occlusion'",
 "weight=typedFront?(index===0?4.4:3.5)",
 "setModelLines('isobars')",
 "modelLines:'isobars'"
])assert.ok(radar.includes(token),`Synoptik-Frontvertrag fehlt: ${token}`);
for(const token of [
 'MID v0.9.85.70 · Ensemble density + synoptic surface-front polish',
 "grid-template-columns:repeat(3,minmax(0,1fr))!important",
 'grid-template-rows:18px 34px!important',
 'white-space:nowrap!important',
 'max-height:min(46dvh,340px)!important',
 'grid-template-columns:repeat(2,minmax(0,1fr))!important',
 '.synoptic-front-marker>span',
 'width:20px!important',
 'border-bottom-width:13px!important'
])assert.ok(css.includes(token),`Ensemble-/Synoptik-Polish fehlt: ${token}`);
assert.ok(main.includes("import './midC18EnsembleSynopticPolish.css';"),'Finaler Ensemble-/Synoptik-Polish wird nicht geladen.');
assert.ok(main.indexOf('midC18EnsembleSynopticPolish.css')>main.indexOf('midC18TodayReleaseFinish.css'),'Polish muss als letzte MID-18.2-Schicht laden.');
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}`);
console.log('MID v0.9.85.70: Ensemble-Vorschauen/Overlay und Bodenanalyse-Frontstil geschützt.');

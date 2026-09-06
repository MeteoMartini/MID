import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,confidence,sourceStyles,builtStyles,baselineRaw,pkgRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/ForecastConfidence.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('MID_BASELINE.json'),read('package.json')
]);
assert.ok(cockpit.includes('<ForecastConfidenceInfoHint assessments={series.map(row=>row.assessment)} advancedMode={advancedMode} className="cockpit-confidence-info"/>'),'Runder Konfidenz-Infozugang steht nicht neben Modellstand.');
assert.ok(cockpit.includes('showInfoHint={false}'),'Cockpit-Prognosekompass rendert den alten unteren Infozugang noch.');
assert.ok(confidence.includes('export function ForecastConfidenceInfoHint'),'Wiederverwendbarer Infozugang fehlt.');
assert.ok(confidence.includes('showInfoHint=true'),'Ensembleansichten verlieren den bestehenden Infozugang.');
for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const marker='/* MID v0.9.78.80 · 14d-Kopf kompakter: runder Info-Button neben Modellstand, Regime wieder in erster Zeile. */';
 const start=styles.lastIndexOf(marker);assert.ok(start>=0,`${name}: v80-Kopfvertrag fehlt.`);const block=styles.slice(start);
 for(const token of [
  '.cockpit-confidence-info>button{width:36px!important;height:36px!important',
  'grid-template-areas:"heading regime temps consistency"!important',
  '.cockpit-fourteen-regime>span{white-space:nowrap!important',
  '.cockpit-fourteen-temps{justify-content:flex-start!important;gap:1px!important',
  '.cockpit-fourteen-temps>.climate-tone-daily{min-width:36px!important'
 ])assert.ok(block.includes(token),`${name}: kompakter 14d-Kopf unvollständig: ${token}`);
}
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-fourteen-day-header-density-097880.mjs';
assert.equal(pkg.version,'0.9.78.80');
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.78.80.md'));
console.log('MID v0.9.78.80: runder Infozugang und kompakte einzeilige 14-Tage-Kopfzeile geprüft.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test='scripts/test-travel-center-readability-098464.mjs';
const styles=readFileSync('src/styles-src/10-features.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));

const start=styles.indexOf('/* Reise-Center · festgepinnte Reisen und kompakte Eckdaten */');
const end=styles.indexOf('/* MID v0.9.84.55',start);
assert.ok(start>=0&&end>start,'Reise-Center-CSS-Bereich fehlt.');
const travel=styles.slice(start,end);

for(const token of [
 '.travel-center-nav span{font-size:var(--mid-text-sm)',
 '.travel-center-nav small{overflow:hidden;color:var(--muted);font-size:var(--mid-text-xs)',
 '.travel-center-quick-metrics b{overflow:hidden;font-size:var(--mid-text-xs)',
 '.travel-center-quick-metrics small{overflow:hidden;color:var(--muted);font-size:var(--mid-text-micro)',
 '.travel-center-source small{color:#42bff5;font-size:var(--mid-text-xs)',
 '.travel-source-details>summary b{font-size:var(--mid-text-sm)',
 '.travel-source-status-grid strong{font-size:var(--mid-text-xs)',
 '.travel-source-status-grid small{color:var(--muted);font-size:var(--mid-text-micro)'
])assert.ok(travel.includes(token),`Reise-Center-Lesbarkeit fehlt: ${token}`);

assert.ok(travel.includes('.travel-center-nav button{display:grid;gap:2px;min-width:0;min-height:36px'),'Reise-Center-Navigation benötigt mindestens 36 px Bedienhöhe.');
assert.ok(travel.includes('.travel-center-unpin{position:absolute;top:8px;right:8px;display:grid;place-items:center;width:36px;height:36px'),'Pin-Schaltfläche darf nicht auf historische 29 px zurückfallen.');
assert.ok(travel.includes('.travel-source-details>summary{display:flex;align-items:center;justify-content:space-between;gap:9px;min-height:40px'),'Quellendetails benötigen eine touchfreundliche Summary-Höhe.');
assert.ok(travel.includes('@media(pointer:coarse){.travel-center-unpin{width:40px;height:40px}'),'Touchgeräte benötigen eine vergrößerte Pin-Trefferfläche.');

for(const tooSmall of ['font-size:6px','font-size:6.3px','font-size:6.5px','font-size:6.8px','font-size:7px','font-size:7.5px','font-size:8px']){
 assert.ok(!travel.includes(tooSmall),`Reise-Center enthält wieder zu kleine UI-Schrift: ${tooSmall}`);
}

const parts=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,parts,'src/styles.css muss exakt aus den kanonischen Styles-Modulen erzeugt sein.');
assert.equal(pkg.scripts?.['test:travel-center-readability'],`node ${test}`,'package.json: Reise-Center-Lesbarkeitstest fehlt.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);

console.log(`MID v${pkg.version}: Reise-Center-Lesbarkeit und Touchziele geschützt.`);

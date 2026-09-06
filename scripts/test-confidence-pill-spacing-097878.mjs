import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [source,aggregate,baseline]=await Promise.all([
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse)
]);
for(const css of [source,aggregate]){
 assert.match(css,/MID v0\.9\.78\.78 · Konfidenzpille/,'Spacing-Vertrag fehlt.');
 assert.match(css,/\.cockpit-fourteen-card>header>\.cockpit-consistency-pill\{[\s\S]*?margin:3px 4px 6px!important/,'Konfidenzpille hat keinen sicheren Außenabstand.');
 assert.match(css,/\.cockpit-fourteen-card>header>\.cockpit-consistency-pill\.mode-signal\{[\s\S]*?min-width:64px!important;[\s\S]*?padding:4px 9px!important/,'Signalpille reserviert nicht genug Innenraum.');
 assert.match(css,/\.cockpit-fourteen-card>header>\.cockpit-consistency-pill \.confidence-display\{gap:8px!important\}/,'Signalbalken und Index sind nicht klar getrennt.');
 assert.match(css,/\.cockpit-fourteen-card>header>\.cockpit-consistency-pill \.confidence-display>small\{min-width:1\.9em!important/,'Index besitzt keinen eigenen Mindestplatz.');
}
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-confidence-pill-spacing-097878.mjs'));
assert.ok(baseline.regressionTests?.includes('scripts/test-confidence-pill-spacing-097878.mjs'));
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.78.78.md'));
console.log('MID v0.9.78.78: Konfidenzpille mit sicherem Außenabstand und getrenntem Signal/Index geprüft.');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [source,aggregate,baseline]=await Promise.all([
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse)
]);
for(const css of [source,aggregate]){
 const start=css.lastIndexOf('MID v0.9.78.79 · 14-Tage-Karten');
 assert.ok(start>=0,'v0.9.78.79 Layoutvertrag fehlt.');
 const tail=css.slice(start);
 assert.match(tail,/grid-template-areas:\"heading temps consistency\" \"regime regime regime\"!important/,'Konfidenzpille reserviert im Hochformat keine eigene kollisionsfreie Kopfzeilenfläche.');
 assert.match(tail,/\.cockpit-fourteen-regime,\s*\n\.cockpit-fourteen-regime>span\{[\s\S]*?overflow:visible!important;[\s\S]*?text-overflow:clip!important;[\s\S]*?white-space:normal!important;[\s\S]*?overflow-wrap:anywhere!important/,'Regime-Kurzaussage darf nicht mehr per Ellipsis abgeschnitten werden.');
 assert.match(tail,/\.cockpit-fourteen-heading-copy>\.cockpit-fourteen-weather-label\{[\s\S]*?-webkit-line-clamp:unset!important/,'Wettertext darf nicht mehr über eine feste Zeilenzahl abgeschnitten werden.');
 assert.match(tail,/grid-template-columns:repeat\(14,minmax\(236px,236px\)\)!important/,'Desktopkarten reservieren nicht genug Breite für die vergrößerte Konfidenzpille.');
}
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-fourteen-day-confidence-no-clipping-097879.mjs'));
assert.ok(baseline.regressionTests?.includes('scripts/test-fourteen-day-confidence-no-clipping-097879.mjs'));
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.78.79.md'));
console.log('MID v0.9.78.79: 14-Tage-Konfidenzpille ohne abgeschnittene Nachbarinhalte geprüft.');

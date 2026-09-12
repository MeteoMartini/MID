import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test='scripts/test-ui-audit-standardization-098462.mjs';
const css=readFileSync('src/styles-src/30-modern.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const dashboard=readFileSync('src/DashboardModuleSettings.tsx','utf8');
const app=readFileSync('src/App.tsx','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));
const changelog=readFileSync('CHANGELOG.md','utf8');
const implementation=readFileSync('MID_IMPLEMENTATION_0.9.84.62.md','utf8');

assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(changelog.includes('## 0.9.84.62'),'Changelog muss den geschützten UI-Audit-Stand weiterhin dokumentieren.');
assert.ok(implementation.includes('ohne Funktionsverlust')||implementation.includes('Funktionsschutz'),'Implementierungsnachweis muss Funktionsschutz dokumentieren.');

for(const token of [
 '--mid-text-micro:9.5px','--mid-text-xs:10px','--mid-text-sm:11px','--mid-text-meta:12px'
])assert.ok(css.includes(token),`Semantische Typografiestandardisierung fehlt: ${token}`);

assert.ok(css.includes('/* MID v0.9.84.62 · UI-Audit: lesbare Informationshierarchie ohne Funktionsverlust */'));
assert.ok(css.includes('.current-weather-facts>.visibility,\n  .current-weather-facts>.pressure{\n    display:grid!important;'),'Sicht und Luftdruck müssen mobil sichtbar bleiben.');
assert.ok(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),'Mobile Istwetter-Fakten müssen ohne Ausblendung responsiv umbrechen.');
assert.ok(css.includes('.current-weather-facts b{\n  font-size:max(12px,var(--mid-text-sm));'),'Istwetter-Hauptwerte dürfen nicht auf historische Mikrogröße zurückfallen.');
assert.ok(css.includes('.ensemble-hazard-tooltip>.ensemble-hazard-compact-row>.mode-info>button{\n  width:28px;'),'14d-Infoziel muss kompakt, aber besser bedienbar sein.');
assert.ok(css.includes('@media(pointer:coarse)')&&css.includes('min-width:36px;\n    min-height:36px;'),'Touchgeräte benötigen vergrößerte Trefferflächen.');
assert.ok(dashboard.includes('am Griff oder mit den Pfeiltasten verschoben werden'),'Dashboard muss Drag-Alternative sichtbar erklären.');
assert.ok(app.includes('alternativ unter Favoriten verwalten mit Pfeiltasten verschieben'),'Favoriten-Schnellleiste muss auf die vorhandene Drag-Alternative verweisen.');

const parts=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,parts,'src/styles.css muss exakt aus den kanonischen Styles-Modulen erzeugt sein.');

console.log('UI audit + readability standardization contract: OK');

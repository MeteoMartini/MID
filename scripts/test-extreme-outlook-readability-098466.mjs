import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test='scripts/test-extreme-outlook-readability-098466.mjs';
const styles=readFileSync('src/styles-src/25-extreme-outlook.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const panel=readFileSync('src/ExtremeWeatherOutlookPanel.tsx','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));

const marker='/* MID v0.9.84.66 · UI-Audit: Extremwetter-Ausblick lesbarer, touchfreundlicher und typografisch standardisiert */';
const start=styles.indexOf(marker);
assert.ok(start>=0,'Lesbarkeits-/Touch-Audit des Extremwetter-Ausblicks fehlt.');
const audit=styles.slice(start);

for(const token of [
 '.extreme-source-badge small{font-size:var(--mid-text-micro);line-height:1.3}',
 '.extreme-hazard-tabs button{min-height:40px;font-size:var(--mid-text-xs)}',
 '.extreme-period-tabs button{min-height:44px}',
 '.extreme-period-tabs small{font-size:var(--mid-text-micro);line-height:1.3}',
 '.extreme-validity>button{min-height:40px;font-size:var(--mid-text-xs)}',
 '.extreme-map-legend>span{grid-template-columns:27px minmax(0,1fr);gap:6px;font-size:var(--mid-text-micro);line-height:1.2}',
 '.extreme-map-label small{font-size:var(--mid-text-micro);line-height:1.15}',
 '.extreme-map-method-trigger>button{width:36px;height:36px;min-width:36px}',
 '.extreme-region-list>button{min-height:44px;padding:9px}',
 '.extreme-region-list small{font-size:var(--mid-text-micro);line-height:1.35}',
 '.extreme-selected-region dt{font-size:var(--mid-text-micro);line-height:1.25}',
 '.extreme-legends>section>small{font-size:var(--mid-text-micro);line-height:1.45}',
 '.extreme-method>summary{min-height:44px}',
 '.extreme-method-content p,.extreme-method-content li{font-size:var(--mid-text-xs);line-height:1.5}',
 '.extreme-threshold-table table{font-size:var(--mid-text-xs)}',
 '.extreme-footer{font-size:var(--mid-text-micro);line-height:1.4}'
])assert.ok(audit.includes(token),`Extremwetter-Lesbarkeit fehlt: ${token}`);

assert.ok(audit.includes('@media(pointer:coarse){'),'Touch-spezifische Mindestflächen fehlen.');
assert.ok(audit.includes('.extreme-hazard-tabs button,.extreme-validity>button{min-height:44px}'),'Gefahren-/Aktualisieren-Schaltflächen benötigen auf Touchgeräten mindestens 44 px.');
assert.ok(audit.includes('.extreme-map .maplibregl-ctrl-group button{width:40px;height:40px}'),'Karten-Zoomsteuerung benötigt auf Touchgeräten 40 px Trefferflächen.');
assert.ok(audit.includes('.extreme-map-method-trigger>button{width:40px;height:40px;min-width:40px}'),'Methodik-Info benötigt auf Touchgeräten 40 px Trefferfläche.');
assert.ok(audit.includes('.extreme-region-list>button{min-height:48px}'),'Regionen-Auswahl benötigt auf Touchgeräten eine robuste Trefferhöhe.');

// Funktionsschutz: Gefahr/Zeitraum, Aktualisierung, Karte, Regionsauswahl und Methodik bleiben vorhanden.
for(const token of [
 'aria-label="Extremwetterart"',
 'aria-label="Vorhersagezeitraum"',
 'setRevision(value=>value+1)',
 '<MidMapLibre',
 '<ExtremeOutlookAreaOverlay',
 'setSelectedAreaId(row.id)',
 'label="Methodik und Grenzen der Gefahrenflächenkarte"',
 'Eigene probabilistische MID-Prognose für die nächsten 48 Stunden',
 'Amtliche Warnungen werden getrennt im Warnmodul darüber geführt.'
])assert.ok(panel.includes(token),`Extremwetter-Funktion/Einordnung fehlt nach UI-Audit: ${token}`);

const parts=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,parts,'src/styles.css muss exakt aus den kanonischen Styles-Modulen erzeugt sein.');
assert.equal(pkg.scripts?.['test:extreme-outlook-readability'],`node ${test}`,'package.json: Extremwetter-Lesbarkeitstest fehlt.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);

console.log(`MID v${pkg.version}: Extremwetter-Ausblick ist lesbarer und touchfreundlicher geschützt.`);

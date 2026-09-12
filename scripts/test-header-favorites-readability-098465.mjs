import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test='scripts/test-header-favorites-readability-098465.mjs';
const foundation=readFileSync('src/styles-src/00-foundation.css','utf8');
const modern=readFileSync('src/styles-src/30-modern.css','utf8');
const legacy=readFileSync('src/v078.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const app=readFileSync('src/App.tsx','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));

const foundationMarker='/* MID v0.9.84.65 · UI-Audit: Kopfzeile, Suche und Favoriten konsistent lesbar und touchfreundlich */';
const modernMarker='/* MID v0.9.84.65 · optionales Bottom-Tab-Layout behält dieselben Mindestbediengrößen wie der Standardkopf */';
const legacyMarker='/* MID v0.9.84.65 · Suchergebnis-Badges folgen der semantischen MID-Mikrotypografie. */';
assert.ok(foundation.includes(foundationMarker),'Kopf-/Favoriten-Audit fehlt in der Foundation.');
assert.ok(modern.includes(modernMarker),'Bottom-Tab-Korrektur fehlt im modernen Layout.');
assert.ok(legacy.includes(legacyMarker),'Suchergebnis-Badge-Korrektur fehlt in v078.css.');

for(const token of [
 '.search .search-input-shell>button{\n width:36px;',
 '.header-favorites .favorite-bubbles>button{\n min-height:40px;',
 '.header-favorites .favorite-bubbles>button small{font-size:var(--mid-text-micro);line-height:1.15}',
 '.header-favorites .favorite-bubbles>button b{font-size:var(--mid-text-micro);line-height:1.1}',
 '.favorite-group>small{font-size:var(--mid-text-micro);line-height:1.15}',
 '.favorite-fields summary em{font-size:var(--mid-text-micro)}',
 '.favorite-mountain-toggle small{font-size:var(--mid-text-xs);line-height:1.35}'
])assert.ok(foundation.includes(token),`Kopf-/Favoriten-Lesbarkeit fehlt: ${token}`);

assert.ok(modern.includes('.navigation-bottom-tabs .settings-header>.header-favorites .favorite-bubbles>button{\n min-height:36px;'),'Bottom-Tab-Favoriten dürfen nicht auf 30 px Bedienhöhe zurückfallen.');
assert.ok(modern.includes('.navigation-bottom-tabs .settings-header>.header-favorites .favorite-strip-manage{\n width:36px;'),'Bottom-Tab-Verwaltung benötigt mindestens 36 px Bedienfläche.');
assert.ok(modern.includes('.header-favorites .favorite-bubbles>button .favorite-quick-grip{\n width:16px;'),'Favoriten-Griff bleibt sichtbar und erhält eine größere Trefferzone.');
assert.ok(modern.includes('@media(pointer:coarse)')&&modern.includes('grid-template-columns:20px auto auto'),'Touchgeräte benötigen einen breiteren Favoriten-Griff.');
assert.ok(foundation.includes('@media(pointer:coarse){\n .search .search-input-shell>button{width:40px;'),'Suchfeldaktion benötigt auf Touchgeräten 40 px Trefferfläche.');
assert.ok(legacy.includes('.search .poi-kind{\n font-size:var(--mid-text-micro);'),'POI-/Favoriten-Badges dürfen nicht auf 8 px zurückfallen.');

// Funktionsschutz: Standort, Favoritenauswahl, Verwaltung, Ziehen und Pfeiltasten bleiben vorhanden.
for(const token of ['className="secondary locate"','<FavoriteQuickStrip','favorite-quick-grip','onPointerDown','title="Nach oben"','title="Nach unten"']){
 assert.ok(app.includes(token),`Favoriten-/Suchfunktion fehlt nach UI-Audit: ${token}`);
}

const parts=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,parts,'src/styles.css muss exakt aus den kanonischen Styles-Modulen erzeugt sein.');
assert.equal(pkg.scripts?.['test:header-favorites-readability'],`node ${test}`,'package.json: Header-/Favoriten-Lesbarkeitstest fehlt.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);

console.log(`MID v${pkg.version}: Kopfzeile, Suche und Favoriten sind lesbar und touchfreundlich geschützt.`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,modern,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
  readFile('src/App.tsx','utf8'),
  readFile('src/styles-src/30-modern.css','utf8'),
  readFile('src/styles.css','utf8'),
  readFile('package.json','utf8'),
  readFile('MID_BASELINE.json','utf8'),
  readFile('MID_IMPLEMENTATION_0.9.79.17.md','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);

assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
assert.ok(app.includes("const navigationMode:NavigationMode='bottom-tabs';"),'Die Design-2.0.1-Bottom-Bar muss als obligatorische Hauptnavigation definiert sein.');
assert.ok(app.includes("document.documentElement.dataset.midDesign='next'"),'Der aktive Gesamtdesignmodus muss dauerhaft auf dem neuen MID-Design liegen.');
assert.ok(app.includes("localStorage.removeItem('mid:navigationMode:v1')"),'Der veraltete NavigationMode-Schlüssel muss migriert/entfernt werden.');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Der alte Beta-Schalter muss entfernt sein.');
assert.ok(!app.includes('<span>Bedienkonzept</span>'),'Bedienkonzept darf nicht mehr als Einstellungs-Unterpunkt angeboten werden.');
for(const token of [
  '--settings-switch-width:46px',
  '.settings-toggle-card input[type=checkbox]::after',
  'transform:translateX(20px)',
  '.settings-nav button span{display:block}',
  '@media(prefers-reduced-motion:reduce)',
  'min-height:54px!important',
  'white-space:nowrap!important',
  '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden'
])assert.ok(modern.includes(token),`UI-Polish-Vertrag fehlt: ${token}`);
assert.ok(styles.endsWith(modern),'Aggregiertes styles.css muss das kanonische Modern-Modul vollständig enthalten.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-settings-navigation-polish-097917.mjs'));
assert.ok(implementation.includes('Mitigation'),'Umsetzungsnachweis muss die bewussten Mitigations dokumentieren.');
console.log('Einstellungen und obligatorische Design-2.0.1-Navigation: Typografie, Touchziele und Reduced Motion geprüft.');

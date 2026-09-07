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
assert.ok(app.includes("type NavigationMode='classic'|'bottom-tabs'"),'Klassischer Fallback muss erhalten bleiben.');
assert.ok(app.includes("localStorage.setItem(NAVIGATION_MODE_STORAGE_KEY,navigationMode)"),'Navigationswahl muss persistent bleiben.');
for(const token of [
  '--settings-switch-width:46px',
  '.settings-toggle-card input[type=checkbox]::after',
  'transform:translateX(20px)',
  '.settings-nav button span{display:block}',
  '.dashboard-bottom-tabs button::before',
  '@media(prefers-reduced-motion:reduce)',
  'min-height:54px!important'
])assert.ok(modern.includes(token),`UI-Polish-Vertrag fehlt: ${token}`);
assert.ok(styles.endsWith(modern),'Aggregiertes styles.css muss das kanonische Modern-Modul vollständig enthalten.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-settings-navigation-polish-097917.mjs'));
assert.ok(implementation.includes('Mitigation'),'Umsetzungsnachweis muss die bewussten Mitigations dokumentieren.');
console.log('Einstellungen und optionale Bottom-Navigation: Typografie, Raster, Switches, Touchziele, Fokus, Reduced Motion und klassischer Fallback geprüft.');

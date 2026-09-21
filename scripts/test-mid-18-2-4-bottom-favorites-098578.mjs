import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,css,main,pkgRaw,baselineRaw]=await Promise.all([
  read('src/App.tsx'),
  read('src/midC18BottomFavorites.css'),
  read('src/main.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-4-bottom-favorites-098578.mjs';

for(const token of [
  "label:'Aktuell'","label:'Heute'","label:'Vorhersage'","label:'Karten'","aria-label=\"Mehr\"",
  "behavior:ScrollBehavior='auto'",
  "useEffect(()=>{setBottomBarHidden(false)},[navigationMode,drawerOpen,bottomBarBehavior])",
  "type BottomBarBehavior='fixed'",
  "localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)"
]) assert.ok(app.includes(token),`Bottom-Bar-Vertrag fehlt: ${token}`);

assert.ok(!app.includes("downDistance>=96"),'Bottom-Bar darf nicht mehr durch Scroll-Distanz ausgeblendet werden.');
assert.ok(!app.includes("Beim Scrollen platzsparend minimieren"),'Auto-Hide darf nicht mehr als Bedienoption angeboten werden.');
assert.ok(!app.includes('Dauerhaft verfügbar')&&!app.includes('bottom-bar-display-settings')&&!app.includes('setBottomBarBehavior'),'Der obsolete Bottom-Bar-Einstellungspunkt muss vollständig entfernt sein.');

for(const token of [
  '--mid18-mobile-nav-reserve',
  '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden',
  'transform:none!important',
  'visibility:visible!important',
  'overflow-x:auto!important',
  'white-space:nowrap!important',
  'scroll-snap-type:x proximity',
  '.favorite-bubbles>button.active'
]) assert.ok(css.includes(token),`Bottom-/Favoriten-CSS-Vertrag fehlt: ${token}`);

assert.ok(main.includes("import './midC18BottomFavorites.css';"),'B-Polish-CSS muss als abschließende Designschicht geladen werden.');
assert.ok(String(pkg.version).startsWith('0.9.85.'),'Paketversion muss im aktuellen MID-0.9.85-Wartungszweig liegen.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline- und Paketversion müssen übereinstimmen.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests']) assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
for(const path of [testPath,'src/midC18BottomFavorites.css','MID_BOTTOM_FAVORITES_0.9.85.78.md']) assert.ok((baseline.requiredFiles||[]).includes(path),`${path} fehlt in requiredFiles`);

console.log('MID v0.9.85.78: Bottom-Bar dauerhaft sichtbar, fünf Hauptziele und Favoritenleiste responsiv geschützt.');

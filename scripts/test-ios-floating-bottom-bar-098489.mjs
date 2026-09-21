import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,modern,styles,bottomPolish,main,baselineRaw,pkgRaw]=await Promise.all([
  readFile('src/App.tsx','utf8'),
  readFile('src/styles-src/30-modern.css','utf8'),
  readFile('src/styles.css','utf8'),
  readFile('src/midC18BottomFavorites.css','utf8'),
  readFile('src/main.tsx','utf8'),
  readFile('MID_BASELINE.json','utf8'),
  readFile('package.json','utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
assert.equal(baseline.version,pkg.version);
assert.equal(baseline.releaseVersion,pkg.version);
for(const token of [
  "const navigationMode:NavigationMode='bottom-tabs'",
  "document.documentElement.dataset.midDesign='next'",
  "localStorage.removeItem('mid:navigationMode:v1')",
  "label:'Aktuell'",
  "label:'Heute'",
  "label:'Vorhersage'",
  "label:'Karten'",
  "candidates:['composite']",
  'bottomBarHidden',
  "useEffect(()=>{setBottomBarHidden(false)},[navigationMode,drawerOpen,bottomBarBehavior])",
  'is-scroll-hidden',
  'data-scroll-hidden',
  "if(bottomBarHidden)setBottomBarHidden(false)",
  "openSettings('notifications')",
  "openSettings('favorites')",
  "openSettings('system')"
])assert.ok(app.includes(token),`Floating-Bar-Logik fehlt: ${token}`);
assert.ok(app.includes("{id:'current',label:'Aktuell'"),'Aktuell muss wieder als Bottom-Bar-Tab erscheinen');
assert.ok(app.includes("type BottomBarBehavior='auto'|'fixed'")&&app.includes('setBottomBarBehavior'), 'Fixierbare Bottom-Bar-Einstellung fehlt');
assert.ok(app.includes("return'fixed' as BottomBarBehavior"),'Bottom-Bar muss den fixierten Zustand dauerhaft erzwingen.');
assert.ok(!app.includes('downDistance>=96')&&!app.includes("window.addEventListener('scroll',onScroll,{passive:true})"),'Legacy-Auto-Hide darf nicht zurückkehren.');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Beta-Bezeichnung darf nicht mehr gerendert werden');
assert.ok(!app.includes('navigation-concept-settings'),'Alter Bedienkonzept-Einstellungsblock muss entfernt sein');
for(const token of [
  '--mid18-mobile-nav-reserve',
  '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden',
  'transform:none!important',
  'visibility:visible!important',
  'grid-template-columns:repeat(5,minmax(0,1fr))',
  'overflow-x:auto!important',
  'white-space:nowrap!important'
])assert.ok(bottomPolish.includes(token),`Finaler Bottom-Bar-/Favoriten-CSS-Vertrag fehlt: ${token}`);
assert.ok(main.includes("import './midC18BottomFavorites.css';"),'Finaler B-Polish-Layer muss produktiv geladen werden.');
assert.ok(main.indexOf('midC18BottomFavorites.css')>main.indexOf('midC18WarningTimeline.css'),'B-Polish muss nach der Warnungs-Timeline geladen werden.');
assert.ok(styles.endsWith(modern),'styles.css muss das vollständige Modern-Modul als kanonisches Ende enthalten');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-ios-floating-bottom-bar-098489.mjs'),'Neue Pflichtregression fehlt in Baseline');
console.log('MID 18.2.2: schwebende Bottom-Bar mit fünf eindeutigen Zielen ist im obligatorischen Design aktiv.');

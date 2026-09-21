import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,modern,styles,baselineRaw,pkgRaw]=await Promise.all([
  readFile('src/App.tsx','utf8'),
  readFile('src/styles-src/30-modern.css','utf8'),
  readFile('src/styles.css','utf8'),
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
  'data-scroll-hidden="false"',
  'data-fixed="true"',
  "if(bottomBarHidden)setBottomBarHidden(false)",
  "openSettings('notifications')",
  "openSettings('favorites')",
  "openSettings('system')"
])assert.ok(app.includes(token),`Floating-Bar-Logik fehlt: ${token}`);
assert.ok(app.includes("{id:'current',label:'Aktuell'"),'Aktuell muss wieder als Bottom-Bar-Tab erscheinen');
assert.ok(app.includes("type BottomBarBehavior='auto'|'fixed'"),'Legacy-Typ für sichere Migration fehlt.');
assert.ok(app.includes('localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)'), 'Gespeicherte Auto-Minimierung muss beim Start verworfen werden.');
assert.ok(!app.includes('bottomBarHidden')&&!app.includes('downDistance>=96')&&!app.includes("setBottomBarBehavior('auto')"),'Die Bottom-Bar darf nicht mehr scrollabhängig verschwinden oder Auto anbieten.');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Beta-Bezeichnung darf nicht mehr gerendert werden');
assert.ok(!app.includes('navigation-concept-settings'),'Alter Bedienkonzept-Einstellungsblock muss entfernt sein');
for(const token of [
  '/* MID v0.9.84.89 · kanonische iOS-27-inspirierte Floating Bottom Bar.',
  'position:fixed!important',
  'right:max(10px,var(--mid-safe-right))!important',
  'bottom:max(14px,calc(var(--mid-safe-bottom) + 2px))!important',
  'left:max(10px,var(--mid-safe-left))!important',
  'max-width:620px!important',
  'border-radius:27px!important',
  'backdrop-filter:blur(30px) saturate(1.45) contrast(1.03)!important',
  'grid-template-columns:repeat(5,minmax(0,1fr))!important',
  'white-space:nowrap!important',
  'word-break:keep-all!important',
  'hyphens:none!important',
  'transform:none!important',
  'opacity:1!important',
  'width:42px',
  '@media(max-width:350px)',
  '@media(max-width:850px) and (orientation:landscape)',
  '@media(prefers-reduced-motion:reduce)'
])assert.ok(modern.includes(token),`Floating-Bar-CSS fehlt: ${token}`);
assert.ok(styles.endsWith(modern),'styles.css muss das vollständige Modern-Modul als kanonisches Ende enthalten');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-ios-floating-bottom-bar-098489.mjs'),'Neue Pflichtregression fehlt in Baseline');
console.log('MID 18.2.4: schwebende Bottom-Bar mit fünf eindeutigen Zielen bleibt dauerhaft sichtbar.');

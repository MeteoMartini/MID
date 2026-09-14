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
  "type NavigationMode='bottom-tabs'",
  "const navigationMode:NavigationMode='bottom-tabs'",
  "localStorage.removeItem('mid:navigationMode:v1')",
  "label:'Kurzfrist'",
  "label:'7 Tage'",
  "label:'14 Tage'",
  "label:'Komposit'",
  "candidates:['composite']",
  'bottomBarHidden',
  "window.addEventListener('scroll',onScroll,{passive:true})",
  'requestAnimationFrame',
  'downDistance>=104',
  'upDistance>=10',
  'y<160',
  'is-scroll-hidden',
  'data-scroll-hidden',
  "if(bottomBarHidden)setBottomBarHidden(false)",
  "openSettings('notifications')",
  "openSettings('favorites')",
  "openSettings('system')"
])assert.ok(app.includes(token),`Floating-Bar-Logik fehlt: ${token}`);
assert.ok(!app.includes("{id:'current',label:'Aktuell'"),'Aktuell darf nicht mehr als Bottom-Bar-Tab erscheinen');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Beta-Bezeichnung darf nicht mehr gerendert werden');
assert.ok(!app.includes('navigation-concept-settings'),'Alter Bedienkonzept-Einstellungsblock muss entfernt sein');
for(const token of [
  '/* MID v0.9.84.89 · kanonische iOS-27-inspirierte Floating Bottom Bar.',
  'position:fixed!important',
  'right:max(10px,var(--mid-safe-right))!important',
  'bottom:max(9px,var(--mid-safe-bottom))!important',
  'left:max(10px,var(--mid-safe-left))!important',
  'max-width:620px!important',
  'border-radius:27px!important',
  'backdrop-filter:blur(30px) saturate(1.45) contrast(1.03)!important',
  'min-height:54px!important',
  'white-space:nowrap!important',
  'word-break:keep-all!important',
  'hyphens:none!important',
  '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden',
  'transform:translate3d(0,calc(100% - 13px),0)!important',
  'width:42px',
  '@media(max-width:350px)',
  '@media(max-width:850px) and (orientation:landscape)',
  '@media(prefers-reduced-motion:reduce)'
])assert.ok(modern.includes(token),`Floating-Bar-CSS fehlt: ${token}`);
assert.ok(styles.endsWith(modern),'styles.css muss das vollständige Modern-Modul als kanonisches Ende enthalten');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-ios-floating-bottom-bar-098489.mjs'),'Neue Pflichtregression fehlt in Baseline');
console.log('Schwebende Bottom-Bar: Komposit direkt, Aktuell aus Primärleiste entfernt, Topbar-Schnellzugriffe in Mehr, sanftes Autohide mit sichtbarem Griff geprüft.');

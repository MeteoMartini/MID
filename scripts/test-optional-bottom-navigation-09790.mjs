import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,styles,portable,radarColors,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/portableUserData.ts','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
for(const token of [
 "type NavigationMode='bottom-tabs'",
 "const navigationMode:NavigationMode='bottom-tabs'",
 "localStorage.removeItem('mid:navigationMode:v1')",
 'data-navigation-mode={navigationMode}',
 "label:'Aktuell'",
 "label:'Kurzfrist'",
 "label:'7 Tage'",
 "label:'14 Tage'",
 '<span>Mehr</span>',
 'bottomBarHidden',
 'downDistance>=28',
 'upDistance>=14',
 'is-scroll-hidden',
 'data-scroll-hidden',
 "dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}",
 '<details key={group.id}'
])assert.ok(app.includes(token),`Kanonischer Bottom-Bar-Vertrag fehlt: ${token}`);
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Der alte Beta-Schalter darf nicht mehr in der App stehen.');
assert.ok(!app.includes('<span>Bedienkonzept</span>'),'Der alte Menü-Unterpunkt Bedienkonzept muss entfernt sein.');
for(const token of [
 '/* MID v0.9.84.89 · kanonische iOS-27-inspirierte Floating Bottom Bar.',
 '.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs',
 'position:fixed!important',
 'bottom:max(9px,var(--mid-safe-bottom))!important',
 'max-width:620px!important',
 'backdrop-filter:blur(30px) saturate(1.45)',
 'min-height:54px!important',
 'white-space:nowrap!important',
 'word-break:keep-all!important',
 '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden',
 '@media(max-width:850px) and (orientation:landscape)',
 '@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`Floating-Bottom-Bar-CSS fehlt: ${token}`);
assert.ok(portable.includes("if(!key.startsWith('mid:'))return false"),'Portable Settings Contract fehlt');
assert.ok(!portable.includes("'mid:navigationMode:v1'"),'Veralteter Navigationsschlüssel darf nicht als aktuelle Einstellung behandelt werden');
assert.ok(radarColors.includes('dwd-standard'),'DWD-Standard-Radarfarbvertrag fehlt');
assert.ok(!radarColors.includes('navigation-bottom-tabs'),'Navigation darf den Radarfarbvertrag nicht verändern');
const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-optional-bottom-navigation-09790.mjs'),'Baseline-Regression fehlt');
console.log('Kanonische schwebende Bottom-Bar, Legacy-Aufräumung, Scroll-Autohide und Radarfarb-Isolation geprüft.');

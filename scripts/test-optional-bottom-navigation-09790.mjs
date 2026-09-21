import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,styles,portable,radarColors,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),readFile('src/styles.css','utf8'),readFile('src/portableUserData.ts','utf8'),readFile('src/radarColorTables.ts','utf8'),readFile('MID_BASELINE.json','utf8')
]);
for(const token of [
 "const navigationMode:NavigationMode='bottom-tabs';","document.documentElement.dataset.midDesign='next'","localStorage.removeItem('mid:designMode:v1')","localStorage.removeItem('mid:navigationMode:v1')",'data-navigation-mode={navigationMode}',
 "label:'Aktuell'","label:'Heute'","label:'Vorhersage'","label:'Karten'",'<span>Mehr</span>','data-scroll-hidden="false"','data-fixed="true"',
 "dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}",'<details key={group.id}',"!['current','short-term','forecast','ensemble','composite'].includes(id)", 'place-warning-status'
])assert.ok(app.includes(token),`Kanonischer Bottom-Bar-Vertrag fehlt: ${token}`);
assert.ok(app.includes("{id:'current',label:'Aktuell'"),'Aktuell muss als Primärtab direkt erreichbar sein');
assert.ok(app.includes('localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)'),'Legacy-Auto-Wahl muss verworfen werden.');
assert.ok(!app.includes('bottomBarHidden')&&!app.includes("setBottomBarBehavior('auto')"),'Scrollabhängige Auto-Minimierung darf nicht mehr erreichbar sein.');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Der alte Beta-Schalter darf nicht mehr in der App stehen.');
assert.ok(!app.includes('<span>Bedienkonzept</span>'),'Der alte Menü-Unterpunkt Bedienkonzept muss entfernt sein.');
for(const token of [
 '/* MID v0.9.84.89 · kanonische iOS-27-inspirierte Floating Bottom Bar.','.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs','position:fixed!important','bottom:max(6px,calc(var(--mid-safe-bottom) - 18px))!important','max-width:620px!important','backdrop-filter:blur(30px) saturate(1.45)','grid-template-columns:repeat(5,minmax(0,1fr))!important','white-space:nowrap!important','word-break:keep-all!important','transform:none!important','opacity:1!important','@media(max-width:850px) and (orientation:landscape)','@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`Floating-Bottom-Bar-CSS fehlt: ${token}`);
assert.ok(portable.includes("if(!key.startsWith('mid:'))return false"),'Portable Settings Contract fehlt');
assert.ok(!portable.includes("'mid:navigationMode:v1'"),'Veralteter Navigationsschlüssel darf nicht als aktuelle Einstellung behandelt werden');
assert.ok(radarColors.includes('dwd-standard'),'DWD-Standard-Radarfarbvertrag fehlt');
assert.ok(!radarColors.includes('navigation-bottom-tabs'),'Navigation darf den Radarfarbvertrag nicht verändern');
const parsed=JSON.parse(baseline);assert.ok(parsed.requiredRegressionTests.includes('scripts/test-optional-bottom-navigation-09790.mjs'),'Baseline-Regression fehlt');
console.log('MID 18.2.4: obligatorische, dauerhaft sichtbare Bottom-Bar Aktuell/Heute/Vorhersage/Karten/Mehr.');

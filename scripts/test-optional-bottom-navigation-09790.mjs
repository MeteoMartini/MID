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
 "const NAVIGATION_MODE_STORAGE_KEY='mid:navigationMode:v1'",
 "type NavigationMode='classic'|'bottom-tabs'",
 "return localStorage.getItem(NAVIGATION_MODE_STORAGE_KEY)==='bottom-tabs'?'bottom-tabs':'classic'",
 "[navigationMode,setNavigationMode]=useState<NavigationMode>(readNavigationMode)",
 "localStorage.setItem(NAVIGATION_MODE_STORAGE_KEY,navigationMode)",
 'data-navigation-mode={navigationMode}',
 'navigationMode={navigationMode}',
 'Bottom-Leiste · Beta',
 "label:'Heute'",
 "label:'Prognose'",
 "label:'Karten'",
 "label:'Planen'",
 '<span>Mehr</span>',
 "dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}",
 '<details key={group.id}'
])assert.ok(app.includes(token),`App-Vertrag fehlt: ${token}`);
for(const token of [
 '.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs',
 'position:fixed!important',
 'bottom:0',
 'calc(6px + var(--mid-safe-bottom))',
 'min-height:52px!important',
 '@media(max-width:850px) and (orientation:landscape)',
 '.navigation-bottom-tabs .section-nav-header-button{display:none!important}'
])assert.ok(styles.includes(token),`Bottom-Bar-CSS fehlt: ${token}`);
assert.ok(portable.includes("if(!key.startsWith('mid:'))return false"),'Portable Settings Contract fehlt');
assert.ok(!portable.includes("'mid:navigationMode:v1'"),'Navigation darf nicht versehentlich als gerätelokal/transient ausgeschlossen werden');
assert.ok(radarColors.includes('dwd-standard'),'DWD-Standard-Radarfarbvertrag fehlt');
assert.ok(!radarColors.includes('navigation-bottom-tabs'),'Navigation darf den Radarfarbvertrag nicht verändern');
const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-optional-bottom-navigation-09790.mjs'),'Baseline-Regression fehlt');
console.log('Optionales Bottom-Tab-Bedienkonzept, Persistenz, Fallback und Radarfarb-Isolation geprüft.');

import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,styles,bottomPolish,main,portable,radarColors,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),readFile('src/styles.css','utf8'),readFile('src/midC18BottomFavorites.css','utf8'),readFile('src/main.tsx','utf8'),readFile('src/portableUserData.ts','utf8'),readFile('src/radarColorTables.ts','utf8'),readFile('MID_BASELINE.json','utf8')
]);
for(const token of [
 "const navigationMode:NavigationMode='bottom-tabs';","document.documentElement.dataset.midDesign='next'","localStorage.removeItem('mid:designMode:v1')","localStorage.removeItem('mid:navigationMode:v1')",'data-navigation-mode={navigationMode}',
 "label:'Aktuell'","label:'Heute'","label:'Vorhersage'","label:'Karten'",'<span>Mehr</span>','bottomBarHidden','is-scroll-hidden','data-scroll-hidden',
 "dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}",'<section key={group.id} className="modern-more-group">',"{id:'safety',label:'Sicherheit',modules:['warnings','extreme-outlook']}",'place-warning-status',
 "const BOTTOM_BAR_BEHAVIOR_KEY='mid:bottom-bar-behavior:v1'","type BottomBarBehavior='fixed'","localStorage.removeItem(BOTTOM_BAR_BEHAVIOR_KEY)","return'fixed'","data-fixed={bottomBarBehavior==='fixed'?'true':'false'}"
])assert.ok(app.includes(token),`Kanonischer Bottom-Bar-/I-Vertrag fehlt: ${token}`);
assert.ok(app.includes("{id:'current',label:'Aktuell'"),'Aktuell muss als Primärtab direkt erreichbar sein');
assert.ok(app.includes('useEffect(()=>{setBottomBarHidden(false)},[navigationMode,drawerOpen,bottomBarBehavior])'),'Bottom-Bar muss unabhängig vom Scrollzustand sichtbar bleiben.');
assert.ok(!app.includes('downDistance>=96')&&!app.includes('upDistance>=12'),'Auto-Hide-Schwellen dürfen nicht zurückkehren.');
assert.ok(!app.includes('Bottom-Leiste · Beta'),'Der alte Beta-Schalter darf nicht mehr in der App stehen.');
assert.ok(!app.includes('<span>Bedienkonzept</span>'),'Der alte Menü-Unterpunkt Bedienkonzept muss entfernt sein.');
assert.ok(!app.includes('bottom-bar-display-settings')&&!app.includes('setBottomBarBehavior'),'Auch der nun obsolete Bottom-Bar-Einstellungspunkt muss entfernt sein.');
for(const token of [
 '--mid18-mobile-nav-reserve',
 '.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs',
 '.dashboard-section-quick.dashboard-bottom-tabs.is-scroll-hidden',
 'position:fixed!important',
 'grid-template-columns:repeat(5,minmax(0,1fr))!important',
 'transform:none!important',
 'visibility:visible!important',
 'overflow-x:auto!important',
 'white-space:nowrap!important',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(bottomPolish.includes(token),`Persistenter Bottom-Bar-/Favoriten-CSS-Vertrag fehlt: ${token}`);
assert.ok(main.includes("import './midC18BottomFavorites.css';"),'Finaler B-Designlayer fehlt im Produktionsentry.');
assert.ok(styles.includes('.navigation-bottom-tabs .dashboard-section-quick.dashboard-bottom-tabs'),'Kanonische Basisschicht der Bottom-Bar fehlt.');
assert.ok(portable.includes("if(!key.startsWith('mid:'))return false"),'Portable Settings Contract fehlt');
assert.ok(!portable.includes("'mid:navigationMode:v1'"),'Veralteter Navigationsschlüssel darf nicht als aktuelle Einstellung behandelt werden');
assert.ok(radarColors.includes('dwd-standard'),'DWD-Standard-Radarfarbvertrag fehlt');
assert.ok(!radarColors.includes('navigation-bottom-tabs'),'Navigation darf den Radarfarbvertrag nicht verändern');
const parsed=JSON.parse(baseline);assert.ok(parsed.requiredRegressionTests.includes('scripts/test-optional-bottom-navigation-09790.mjs'),'Baseline-Regression fehlt');
console.log('MID 18.2.2/I.1-I.5: obligatorische, dauerhaft fixierte Bottom-Bar Aktuell/Heute/Vorhersage/Karten/Mehr; Legacy-Designnavigation entfernt.');

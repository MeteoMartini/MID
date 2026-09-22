import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,radar,modernStyles,styles,radarColors,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/RadarPanel.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

assert.ok(app.includes("focusMode={navigationMode==='bottom-tabs'}"),'Map-Focus muss ausschließlich an bottom-tabs gebunden sein');
assert.ok(app.includes("const navigationMode:NavigationMode='bottom-tabs';"),'Das obligatorische MID-Design muss den Bottom-Tab-Modus dauerhaft verwenden.');
assert.ok(app.includes("dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}"),'Mehr-Menü muss seine seltenen Bereiche progressiv offenlegen.');
assert.ok(app.includes('<section key={group.id} className="modern-more-group">'),'Seltene Bereiche müssen in der I.1-I.5-Themenstruktur gruppiert bleiben.');
assert.ok(app.includes("const MODERN_MAP_MODULES:DashboardModuleId[]=['composite','weather-maps']")&&app.includes('candidates:MODERN_MAP_MODULES'),'Karten muss als gruppiertes Bottom-Bar-Primärziel erreichbar sein.');
assert.ok(app.includes("{id:'safety',label:'Sicherheit',modules:['warnings','extreme-outlook']}")&&app.includes("{id:'planning',label:'Planen & Profile',modules:['event-planner','travel-planner','mountain','water']}"),'Übrige Fachmodule müssen über die I.1-I.5-Mehr-Gruppen erreichbar bleiben.');

for(const token of [
 'focusMode=false',
 "className={`card composite-card${focusMode?' composite-focus-mode':''}`}",
 'className="composite-focus-layer-trigger"',
 '>Ebenen</span>',
 'AppPortalPopover anchorRef={focusLayersButtonRef}',
 'className="composite-focus-layer-popover composite-focus-layer-popover-portal"',
 "applyPreset('radar-satellite')",
 "applyPreset('thunder')",
 'composite-focus-layer-switches',
 'focusMode&&(<details className="composite-advanced"',
 'className="composite-timeline-card"',
 'className="radar-playback-buttons"',
 'className="composite-playback-speed"',
 'className={`composite-live-button${liveFollow?\' active\':\'\'}`}'
])assert.ok(radar.includes(token),`Map-Focus-Vertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.2 · optionales Bedienkonzept: gemeinsamer Map-Focus-Modus */',
 '.navigation-bottom-tabs .composite-focus-mode .radarmap{',
 'height:min(72dvh,720px)',
 '.composite-focus-layer-control{',
 'min-height:52px',
 '.composite-focus-layer-popover{',
 '.composite-focus-presets>button{',
 'min-height:44px',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Map-Focus-CSS-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('/* MID v0.9.79.2 · optionales Bedienkonzept: gemeinsamer Map-Focus-Modus */'),'Styles-Aggregat enthält Map-Focus nicht');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('composite-focus-mode'),'UI-Fokus darf Radarfarbtabellen nicht berühren');
assert.ok(contract.includes('keine alternative Radarfarbpalette'),'Radar-Isolation fehlt im Bedienvertrag');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-map-focus-09792.mjs'),'Baseline-Regression für Schritt 3 fehlt');
console.log('MID 18.2.2/I.1-I.5: gruppierter Karten-/Komposit-Fokus und obligatorische Bottom-Bar; Radar-Isolation geprüft.');

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
assert.ok(app.includes("const NAVIGATION_MODE_STORAGE_KEY='mid:navigationMode:v1'"),'persistenter Navigationsmodus fehlt');
assert.ok(app.includes("dashboard-section-nav-list ${variant}${modernDrawer?' progressive':''}"),'Beta-Mehr-Menü muss seine seltenen Bereiche progressiv offenlegen.');
assert.ok(app.includes('<details key={group.id}'),'Seltene Beta-Bereiche dürfen erst nach Aufruf sichtbar werden.');
assert.ok(app.includes("id:'map',label:'Karten'"),'Der Karten-Hauptbereich muss verständlich benannt sein.');

for(const token of [
 'focusMode=false',
 "className={`card composite-card${focusMode?' composite-focus-mode':''}`}",
 'className="composite-focus-layer-trigger"',
 '>Ebenen</span>',
 'className="composite-focus-layer-popover"',
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
assert.ok(styles.includes('.dashboard-section-nav-list.drawer.progressive>details'),'Progressive Beta-Navigation fehlt im Styles-Aggregat.');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('composite-focus-mode'),'UI-Fokus darf Radarfarbtabellen nicht berühren');
assert.ok(contract.includes('keine alternative Radarfarbpalette'),'Radar-Isolation fehlt im Bedienvertrag');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-map-focus-09792.mjs'),'Baseline-Regression für Schritt 3 fehlt');
console.log('Optionales Bedienkonzept Schritt 3: Map-Focus, Ebenen-Overlay, Timeline/Playback, Fallback und Radar-Isolation geprüft.');

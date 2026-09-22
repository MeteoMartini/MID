import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,radar,compositeSettings,radarColors,eventPolicy,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),readFile('src/RadarPanel.tsx','utf8'),readFile('src/compositeSettings.ts','utf8'),readFile('src/radarColorTables.ts','utf8'),readFile('src/eventRecommendationPolicy.ts','utf8'),readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),readFile('MID_BASELINE.json','utf8')
]);
assert.ok(!app.includes('ModernTodayOverview'),'Verworfener Heute-Beta-Fokus darf nicht zurückkehren');
for(const token of ['className="modern-map-focus-shell"',"navigationMode==='bottom-tabs'?<section key={`composite-focus:${layoutMode}:${layoutRevision}`}","focusMode={navigationMode==='bottom-tabs'}",'title="Kompositbild"',"label:'Karten'","const MODERN_MAP_MODULES:DashboardModuleId[]=['composite','weather-maps']",'candidates:MODERN_MAP_MODULES'])assert.ok(app.includes(token),`Gruppierter Kartenfokus fehlt: ${token}`);
for(const token of ['modelLineTone','isobarLineColor','isoheightLineColor'])assert.ok(compositeSettings.includes(token),`Synoptik-Persistenzvertrag fehlt: ${token}`);
assert.ok(compositeSettings.includes("mid:composite-settings:v3"),'Stabiler Composite-v3-Speicherschlüssel fehlt');
assert.ok(!radar.includes('smoothFactor'),'Ungültige smoothFactor-Option darf nicht zurückkehren');
assert.ok(radar.includes('composite-focus-layer-control'),'Map-Focus muss erhalten bleiben');
assert.ok(eventPolicy.includes('Trinkwasserversorgung'),'Event-Hitzeempfehlung muss erhalten bleiben');
assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss genau eine Farbtabellen-ID besitzen');
assert.ok(contract.includes('Komposit'),'Navigationsvertrag muss Komposit als Karteninhalt dokumentieren');
const parsed=JSON.parse(baseline);assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-focus-detail-hierarchy-09796.mjs'),'Baseline-Regression fehlt');assert.ok(parsed.requiredRegressionTests.includes('scripts/test-synoptic-contour-path-options-097884.mjs'),'Synoptik-Buildfix muss geschützt bleiben');
console.log('Gruppierter Karten-/Komposit-Fokus, Current-Beta-Entfernung und Synoptik-Persistenz geprüft.');

import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,radar,compositeSettings,modernStyles,styles,radarColors,eventPolicy,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/RadarPanel.tsx','utf8'),
 readFile('src/compositeSettings.ts','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('src/eventRecommendationPolicy.ts','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

for(const token of [
 'id="mid-modern-today-overview"',
 'const[modernTodayDetailsOpen,setModernTodayDetailsOpen]=useState(false)',
 "if(navigationMode==='bottom-tabs'&&id==='current')setModernTodayDetailsOpen(false)",
 'const openModernTodayDetails=useCallback',
 'const closeModernTodayDetails=useCallback',
 'id="mid-modern-current-details"',
 'className="modern-current-details-focus"',
 '<strong>Aktuelles Wetter · Details</strong>',
 '<span>Übersicht</span>',
 "if(navigationMode!=='bottom-tabs')return currentDetails",
 'className="modern-map-focus-shell"',
 "navigationMode==='bottom-tabs'?<section key={`composite-focus:${layoutMode}:${layoutRevision}`}",
 "focusMode={navigationMode==='bottom-tabs'}",
 'title="Kompositbild"'
])assert.ok(app.includes(token),`Fokus-/Detailvertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.6 · optionales Bedienkonzept: Übersicht → Fokus → Details */',
 '.navigation-bottom-tabs .modern-current-details-focus{',
 'min-height:44px',
 '.navigation-bottom-tabs .modern-map-focus-shell{',
 '.navigation-bottom-tabs .modern-map-focus-shell .radar-gate{margin:0}',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Schritt-7-CSS fehlt: ${token}`);
assert.ok(styles.includes('/* MID v0.9.79.6 · optionales Bedienkonzept: Übersicht → Fokus → Details */'),'Styles-Aggregat enthält Schritt 7 nicht');

for(const token of ['modelLineTone','isobarLineColor','isoheightLineColor'])assert.ok(compositeSettings.includes(token),`Zusammengeführter Synoptik-Persistenzvertrag fehlt: ${token}`);
assert.ok(compositeSettings.includes("mid:composite-settings:v3"),'Stabiler Composite-v3-Speicherschlüssel fehlt');
assert.ok(!radar.includes('smoothFactor'),'Ungültige smoothFactor-Option darf nach v0.9.78.84 nicht zurückkehren');
assert.ok(radar.includes('composite-focus-layer-control'),'Map-Focus aus Schritt 3 muss nach dem Merge erhalten bleiben');
assert.ok(eventPolicy.includes('Trinkwasserversorgung'),'Event-Hitzeempfehlung aus v0.9.78.85 muss erhalten bleiben');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('modern-current-details-focus'),'Bedienhierarchie darf Radarfarben nicht berühren');

assert.ok(contract.includes('Schritt 7'),'Bedienvertrag dokumentiert Schritt 7 nicht');
assert.ok(contract.includes('Übersicht → Fokus → Details'),'Hierarchievertrag fehlt');
assert.ok(contract.includes('v0.9.78.84/.85'),'Merge-Vertrag für parallele Synoptik-/CI-Fixes fehlt');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-focus-detail-hierarchy-09796.mjs'),'Baseline-Regression für Schritt 7 fehlt');
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-synoptic-contour-path-options-097884.mjs'),'Synoptik-Buildfix muss nach Merge geschützt bleiben');
console.log('Optionales Bedienkonzept Schritt 7 sowie Merge v0.9.78.84/.85: Übersicht/Fokus/Details, direkter Kartenfokus, klassischer Fallback, Synoptik-Persistenz und Radar-Isolation geprüft.');

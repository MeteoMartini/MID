import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,modernStyles,styles,radarColors,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

for(const token of [
 'function ModernPlannerHub',
 'id="mid-modern-planner"',
 'MID · PLANEN',
 'Wetter für Entscheidungen',
 "window.addEventListener('mid:navigate-modern-planner',openPlanner)",
 "window.dispatchEvent(new CustomEvent('mid:open-settings'",
 "window.addEventListener('mid:open-settings',openSettings)",
 "className={`dashboard-section-drawer${navigationMode==='bottom-tabs'?' modern-more-drawer':''}`}",
 'className="modern-more-quick-actions"',
 '<strong>Einstellungen</strong>',
 '<small>Darstellung, Inhalte, Daten und System</small>',
 "onClick={()=>openSettings('view')}",
 "{id:'safety',label:'Sicherheit',modules:['warnings','extreme-outlook']}",
 "{id:'climate',label:'Klima & Rückblick',modules:['climate','forecast-verification']}",
 "{id:'planning',label:'Planen & Profile',modules:['event-planner','travel-planner','mountain','water']}",
 "{id:'special',label:'Spezialwetter',modules:['flight-meteorology']}",
 "{id:'tools',label:'Werkzeuge & Export',modules:['widget']}",
 "navigationMode==='bottom-tabs'&&id===modernPlannerAnchor?<ModernPlannerHub",
 "dashboard-planner-section${navigationMode==='bottom-tabs'?' modern-planner-section':''}"
])assert.ok(app.includes(token),`Planen/Mehr-Vertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.5 · optionales Bedienkonzept: Planen-Hub + Mehr-Hierarchie */',
 '.modern-planner-hub{display:none}',
 '.navigation-bottom-tabs .modern-planner-hub{',
 '.navigation-bottom-tabs .modern-planner-actions>button{',
 'min-height:62px',
 '.navigation-bottom-tabs .dashboard-planner-section.modern-planner-section',
 '.navigation-bottom-tabs .modern-more-quick-actions{',
 '.navigation-bottom-tabs .modern-more-quick-actions>button{',
 'min-height:58px',
 '@media(max-width:430px)',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Planen/Mehr-CSS-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('/* MID v0.9.79.5 · optionales Bedienkonzept: Planen-Hub + Mehr-Hierarchie */'),'Styles-Aggregat enthält Schritt 6 nicht');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('modern-planner-hub'),'Planen-UI darf Radarfarbtabellen nicht berühren');
assert.ok(contract.includes('Schritt 6'),'Bedienvertrag dokumentiert Schritt 6 nicht');
assert.ok(contract.includes('Planen-Hub erzeugt keine eigenen Wetterabfragen'),'Planer darf keine zweite Datenlogik einführen');
assert.ok(contract.includes('**Mehr** enthält die vertiefenden Fachmodule'),'Mehr-Erreichbarkeitsvertrag fehlt');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-plan-more-hierarchy-09795.mjs'),'Baseline-Regression für Schritt 6 fehlt');
console.log('Kanonische Bottom-Bar: Planen-Hub bleibt über „Planen & Profile“ erreichbar; I.1-I.5-Mehr-Hierarchie, Einstellungszugang, Touchziele und Radar-Isolation geprüft.');

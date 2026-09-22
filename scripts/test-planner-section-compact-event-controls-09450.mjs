import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [app,modules,settings,planner,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/dashboardModules.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/DashboardModuleSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
assert.ok(app.includes("{id:'planning',label:'Planen & Profile',modules:['event-planner','travel-planner','mountain','water']}"),'Planen & Profile fehlt in der I.1-I.5-Sektionsnavigation.');
assert.ok(app.includes("dashboard-planner-section${navigationMode==='bottom-tabs'?' modern-planner-section':''}"),'Eigenständige sichtbare Planer-Sektion fehlt.');
assert.match(app,/<h2 id="mid-planner-section-heading">Planer<\/h2>/,'Planer-Sektionsüberschrift fehlt.');
assert.match(app,/plannerModuleOrder=dashboardModuleSettings\.order\.filter\(id=>\(id==='event-planner'\|\|id==='travel-planner'\)&&dashboardModuleSettings\.enabled\[id\]\)/,'Planer berücksichtigt die getrennte Sichtbarkeit der beiden Module nicht.');
assert.match(app,/plannerModuleOrder\.map\(plannerId=>/,'Event- und Reiseplaner werden nicht innerhalb der Planer-Sektion gemeinsam gerendert.');
assert.ok(app.includes('<ModernPlannerHub eventEnabled={dashboardModuleSettings.enabled[\'event-planner\']}'),'Bottom-Tab-Modus muss den bestehenden Planer um den Planen-Hub ergänzen.');
assert.match(modules,/{id:'event-planner',label:'Eventplaner'/,'Eventplaner fehlt im Modulkatalog.');
assert.match(modules,/{id:'travel-planner',label:'Reiseplaner'/,'Reiseplaner fehlt im Modulkatalog.');
assert.match(settings,/checked=\{settings\.enabled\[id\]\}/,'Module sind in den Einstellungen nicht separat schaltbar.');
assert.match(planner,/<div className="event-choice-block(?: compact)?"><span>Rahmen<\/span><div className="event-chip-row">/,'Rahmen-Auswahl fehlt.');
assert.match(planner,/<div className="event-choice-block(?: compact)?(?: activity)?"><span>Aktivität<\/span><div className="event-chip-grid">/,'Aktivitäts-Auswahl fehlt.');
assert.match(styles,/\.event-chip-row,\.event-chip-grid\{display:flex;flex-wrap:wrap/,'Rahmen/Aktivität sind nicht als platzsparende Flex-Chips gestaltet.');
assert.match(styles,/\.event-chip-row button,\.event-chip-grid button\{display:inline-flex[\s\S]*?min-height:36px[\s\S]*?border-radius:999px/,'Event-Auswahlflächen sind nicht deutlich kompakt ausgeführt.');
assert.doesNotMatch(styles,/\.event-chip-row\{grid-template-columns:repeat\(3/,'Altes großflächiges Rahmen-Grid ist noch aktiv.');
assert.doesNotMatch(styles,/\.event-chip-grid\{grid-template-columns:repeat\(4/,'Altes großflächiges Aktivitäts-Grid ist noch aktiv.');
console.log('Planen & Profile: sichtbare Planer-Sektion mit separat schaltbarem Event-/Reiseplaner und kompakter Rahmen-/Aktivitätsauswahl geprüft.');

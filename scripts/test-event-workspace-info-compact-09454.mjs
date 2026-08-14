import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [planner,popover,portal,styles]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/AppInfoPopover.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/AppPortalPopover.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

assert.match(planner,/type EventWorkspaceView='overview'\|'editor'\|'detail'/,'Gestufte Eventplaner-Navigation fehlt.');
assert.match(planner,/className="event-workspace-nav"/,'Eventplaner-Bereichsnavigation fehlt.');
for(const label of ['Übersicht','Neu planen','Details & Rat'])assert.match(planner,new RegExp(label),`Eventplaner-Navigation fehlt: ${label}`);
assert.match(planner,/className="event-selected-destination compact"/,'Event-Ort ist nicht als kompakte Zeile umgesetzt.');
assert.match(planner,/locationSearchOpen&&<div className="event-location-search-panel"/,'Ortssuche wird nicht bedarfsgesteuert eingeblendet.');
assert.match(planner,/Ort ändern/,'Kompakte Ort-ändern-Aktion fehlt.');
assert.match(styles,/\.event-selected-destination\.compact>span\{[^}]*flex:none/,'Mobile Flex-Basis-Leerraum ist nicht strukturell neutralisiert.');
assert.match(styles,/@media\(max-width:640px\)[\s\S]*?\.event-selected-destination\.compact>span\{flex:0 1 auto!important\}/,'Mobile Ortszeile besitzt keinen expliziten Flex-Basis-Fix.');
assert.match(planner,/AppInfoHint label="Informationen zum Eventplaner"/,'Eventplaner nutzt nicht die appweite Info-Logik.');
assert.match(popover,/AppPortalPopover/,'AppInfoHint verwendet nicht die gemeinsame Portalprimitive.');
assert.match(portal,/createPortal/,'Info-Inhalte werden nicht über ein Body-Portal gerendert.');
assert.match(portal,/document\.addEventListener\('pointerdown',dismiss,true\)/,'Außenklick-Dismiss fehlt.');
assert.match(portal,/document\.addEventListener\('keydown',escape\)/,'Escape-Dismiss fehlt.');
assert.match(portal,/window\.addEventListener\('scroll',schedule,scrollOptions\)/,'Popover wird beim Scrollen nicht neu positioniert.');
assert.match(styles,/\.event-detail-disclosure/,'Progressive Detailansicht für Stundenverlauf/Daten fehlt.');
assert.match(planner,/Wetterbedingte Hinweise und Maßnahmen/,'Wetterbedingte Hinweise sind nicht direkt in der Detailansicht priorisiert.');

console.log('MID v0.9.45.4: kompakter Event-Ort, gestufter Workflow und appweite Portal-Info-Logik geprüft.');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [planner,app,styles]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);

assert.match(planner,/className="event-center-grid compact"/,'Event-Center-Sektion verwendet nicht die kompakte Liste.');
assert.match(planner,/<details className="event-center-card-disclosure">/,'Gespeicherte Events besitzen keine progressive Detailansicht.');
assert.match(planner,/className="event-center-card-overview"/,'Kompakte Event-Übersicht fehlt.');
assert.match(planner,/className="event-center-card-quick-weather"/,'Wetter-Kernwerte fehlen in der Kurzansicht.');
assert.match(planner,/className="event-center-card-details"/,'Aufklappbare Event-Details fehlen.');
assert.match(planner,/recordPlan\?\.advice\.summary\|\|destinationLabel\(record\.location\)/,'Analyse-Zusammenfassung wird nicht in den Details angeboten.');
assert.match(planner,/className={`event-center-favorite\$\{record\.isFavorite\?' active':''\}`}/,'Favoritenschalter ist nicht direkt in der Kurzansicht erreichbar.');

assert.match(app,/className="event-center-header-popover compact"/,'Glocken-Popover ist nicht als kompakte Variante markiert.');
assert.match(app,/className="event-center-header-list compact"/,'Glocken-Liste ist nicht kompakt.');
assert.match(app,/visibleRecords\.map\(record=>\{const expired=.*return <details key=\{record\.id\}/,'Events unter der Glocke sind nicht einzeln aufklappbar.');
assert.match(app,/className="event-center-header-metrics"/,'Meteorologische Eckdaten fehlen in der kompakten Glockenansicht.');
assert.match(app,/className="event-center-header-entry-details"/,'Detailbereich unter der Glocke fehlt.');
assert.match(app,/>Details öffnen<\/span>/,'Eindeutiger Sprung zum vollständigen Eventplaner fehlt.');

assert.match(styles,/MID v0\.9\.45\.1[^\n]*kompakte Übersicht mit gestuften Details/,'Versionsmarkierung der UI-Änderung fehlt.');
assert.match(styles,/\.event-center-card-disclosure>summary\{/,'Kompakter Summary-Layoutvertrag fehlt.');
assert.match(styles,/\.event-center-card-disclosure\[open\] \.event-center-disclosure-hint svg\{transform:rotate\(180deg\)\}/,'Aufklappzustand ist visuell nicht eindeutig.');
assert.match(styles,/\.event-center-header-entry>summary\{/,'Kompakte Glocken-Summary fehlt.');
assert.match(styles,/:root\[data-theme=dark\]|var\(--surface\)|color-mix/,'Theme-kompatible Farbvariablen fehlen.');

console.log('MID v0.9.45.3: kompakte Events-&-Aktivitäten-Übersicht mit Wetter-Eckdaten und progressiven Details in Sektion und Glocken-Popover geprüft.');

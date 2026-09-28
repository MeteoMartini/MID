# MID v0.9.42.0

## Ziel

Event-Center und Planungswerkzeuge werden im Alltag deutlich ruhiger in die Oberfläche integriert, ohne Funktionen oder gespeicherte Events zu verlieren.

## Event-Center in der Top-Leiste

Der großflächige Event-Center-Block auf dem Dashboard wurde entfernt. Stattdessen besitzt die Top-Leiste eine kompakte Glocke:

- neutraler Zustand ohne neue Event-Änderung,
- dezenter roter Statuspunkt und Akzent bei einer noch ungesehenen Änderung,
- kompaktes Popover mit bis zu drei nächsten gespeicherten Events,
- direkter Sprung in das jeweilige Event sowie in den Eventplaner.

Die Änderung wird erst beim Öffnen des konkreten Events als gesehen behandelt; das bloße Öffnen der Glocke löscht den Änderungsstatus nicht.

## Natürlichere Änderungstexte

Statuswechsel werden nicht mehr als technisch klingendes „Einschätzung jetzt Achtung statt beobachten“ ausgegeben. MID formuliert beispielsweise:

> Bewertung verschärft: jetzt „Achtung“ (zuvor „Beobachten“).

Verbesserungen werden entsprechend als verbessert bezeichnet. Bereits lokal gespeicherte alte Formulierungen werden beim Einlesen automatisch in die neue Form überführt, sodass die Korrektur ohne erneutes Speichern des Events sichtbar wird.

## Oberkategorie Planer

Die Navigation trennt künftig klar:

- **Profile:** Berg-/Wintersport und Wassersport
- **Planer:** Eventplaner und Reiseplaner

Eventplaner und Reiseplaner bleiben eigenständige Dashboard-Sektionen und können in **Einstellungen → Ansicht & Einheiten → Sektionen und Reihenfolge** jeweils separat ein- oder ausgeschaltet werden.

## Regression

Der neue Test `scripts/test-event-center-topbar-planner-group-09420.mjs` schützt Topbar-Event-Center, roten Änderungsindikator, Textmigration, Planer-Gruppierung und die separate Einstellbarkeit beider Planer.

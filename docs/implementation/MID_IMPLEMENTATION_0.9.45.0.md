# MID v0.9.45.0

## Planer

- Eventplaner und Reiseplaner werden im Dashboard nun zusätzlich in einer sichtbaren gemeinsamen Sektion **„Planer“** zusammengefasst.
- Die bestehende Sektionsnavigation führt beide Module weiterhin unter **Planer**.
- Eventplaner und Reiseplaner bleiben technisch eigenständige Dashboard-Module und können in **Einstellungen → Sektionen und Reihenfolge** jeweils separat aktiviert oder deaktiviert werden.
- Wenn nur einer der beiden Planer aktiv ist, bleibt die gemeinsame Planer-Sektion erhalten und zeigt nur das aktivierte Modul.
- Deep-Links, Event-Center-Glocke und direkte Navigation zu Event- bzw. Reiseplaner bleiben auf die jeweiligen Modulanker gerichtet.

## Eventplaner – kompakte Auswahl

- Die Auswahlfelder **„Rahmen“** und **„Aktivität“** wurden von großflächigen Kacheln auf kompakte, umbrechende Chips umgestellt.
- Desktop, Tablet und Smartphone nutzen mehrere Auswahlchips pro Zeile, soweit Platz vorhanden ist; auf schmalen Displays wird automatisch umgebrochen.
- Die aktive Auswahl bleibt klar hervorgehoben, ohne unnötige Kartenhöhe zu erzeugen.
- Flug bleibt als Aktivität vollständig erhalten.

## Regression

- Neuer Test `test-planner-section-compact-event-controls-09450.mjs` schützt die sichtbare Planer-Sektion, die separate Aktivierbarkeit von Event- und Reiseplaner sowie die kompakte Rahmen-/Aktivitätsauswahl.

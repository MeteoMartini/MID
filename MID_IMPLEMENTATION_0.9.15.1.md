# MID v0.9.15.1 – vollständige Gewitter-Orts- und Zugbahnausweisung

## Ausgangsbasis

- Verbindlich verifizierte Stable-Basis: MID v0.9.14.5
- Unmittelbar fortgeführter, zuvor erzeugter Arbeitsstand: MID v0.9.15.0
- Neue Version nach automatischer Umfangsbewertung: MID v0.9.15.1

## Funktionsumfang

### Aktuell betroffene Orte

Der Worker bestimmt aus der aktuellen KONRAD3D-Zellfläche einen konservativen Wirkradius. Orte innerhalb dieses radarbestimmten Bereichs werden mit **„Jetzt“** gekennzeichnet. Der Bezugsort wird unabhängig von der allgemeinen Ortsabfrage geometrisch geprüft und bei Relevanz ausdrücklich aufgenommen.

### Orte auf der Zugbahn

Aus sämtlichen verfügbaren KONRAD3D-Zellprognosepunkten entsteht eine zeitlich geordnete Zugachse. Für Orte entlang dieser Achse werden berechnet:

- Status,
- lokale Ankunftszeit,
- Ankunftszeitfenster,
- Minuten bis zur Annäherung,
- Abstand zur Zugachse,
- Breite des berücksichtigten Korridors,
- Vertrauensstufe und Datenherkunft.

### Statusklassen

- **Jetzt:** innerhalb des aktuell radarbestimmten Zellbereichs.
- **Voraussichtlich:** nahe der prognostizierten Zugachse.
- **Möglicher Treffer:** innerhalb des erwarteten Zellradius, aber nicht achsnah.
- **Unsicherheitskorridor:** nur innerhalb der zusätzlichen Prognoseunsicherheit.

Damit werden mögliche Treffer nicht als sicher dargestellt.

### Ortsquelle

Primär werden Städte, Gemeinden, Dörfer und Weiler aus OpenStreetMap über Overpass innerhalb des geometrischen Zell- und Zugbahnkorridors ermittelt. Bei Ausfall der Ortsabfrage wird ein begrenzter, gecachter BigDataCloud-Reverse-Geocoding-Fallback entlang repräsentativer Zugbahnpunkte verwendet.

### Darstellung

Direkt in der Gewitterkachel erscheinen bis zu fünf priorisierte Orte mit „Jetzt“ oder Ankunftszeit. Die vollständige Ortsliste liegt hinter dem Info-Button und zeigt zu jedem Ort die fachliche Einstufung. Zusätzlich wird aus den chronologisch sortierten Orten ein kompakter Zugbahnsatz nach dem Muster „von A über B nach C“ gebildet.

## Qualitätssicherung

Der Regressionstest `scripts/test-thunder-affected-places-route-09151.mjs` schützt Worker-Geometrie, vier Statusklassen, individuelle Zeitangaben, Ortslisten-UI, Quellenangabe und den erweiterten TypeScript-Datenvertrag.

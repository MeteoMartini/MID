# MID v0.9.53.7

## Event-Center: frischer Wetterstand bleibt erhalten

- Event-Pläne besitzen beim lokalen Speichern und beim Geräteabgleich eine eigene Frischepriorität über `plan.refreshedAt`.
- Ein älterer Geräte-Snapshot darf einen bereits neu berechneten Event-Wetterstand nicht mehr zurücksetzen.
- Remote-Metadaten können weiter übernommen werden; bei einem Konflikt bleibt jedoch der frischere Wetterplan samt Änderungsbewertung erhalten.
- Startet ein Geräte-Pull vor einem lokalen Event-Refresh, wird `pendingChangedAt` nach der Netzantwort erneut gelesen. Eine zwischenzeitliche lokale Änderung gewinnt und wird zuerst hochgeladen.
- Ein bereits laufender Geräte-Push darf eine nach Snapshot-Erstellung entstandene lokale Änderung nicht mehr versehentlich als synchronisiert markieren.
- Der lokale Event-Store schützt zusätzlich vor verspäteten Schreibvorgängen mit älterem `plan.refreshedAt`.
- Die bestehende Regel bleibt erhalten: Ein neuer Datenstand allein erzeugt keine rote Glocke; nur meteorologisch relevante Änderungen.

Worker-Funktionalität unverändert.

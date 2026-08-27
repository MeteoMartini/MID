# MID v0.9.67.2

## Versionsaktivierung

Der Browser-/PWA-Service-Worker lädt weiterhin zuerst den vollständigen App-Shell und prüft alle Kernressourcen. Ist bereits eine ältere MID-Version aktiv, wird das erfolgreich vorbereitete Update anschließend kontrolliert aktiviert und jedes offene App-Fenster mit einem Cache-Buster neu geladen. Erst die Laufzeit-Gesundheitsmeldung bestätigt die neue Version; bis dahin bleibt der vorherige App-Shell als Rückfallversion erhalten.

Damit kann ein bereitgestelltes Release nicht mehr dauerhaft als wartender Service Worker neben einer sichtbar alten App-Version liegen bleiben.

## Event-Center

Die kompakte Wetterzeile enthält wieder Temperatur, Niederschlagsart, Wahrscheinlichkeit, die über den gesamten Eventzeitraum aggregierte Niederschlagsmenge in mm sowie Wind und Böen. Die Menge stammt aus demselben EventSummary-Vertrag wie die ausführliche Niederschlagskarte.

## Plattformvertrag

Die Änderung betrifft den gemeinsamen Browser-/PWA-Kern. Die native Capacitor-iOS-App bleibt service-worker-frei, übernimmt aber die Event-Center-Darstellung aus demselben React-Kern.

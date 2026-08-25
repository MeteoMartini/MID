# MID 0.9.65.12

## Laufende Stundenwarnungen

Die automatische Warnlage verwendet für stündliche Best-Match-Daten nicht mehr den globalen `currentIndex()`, der absichtlich den zeitlich **nächstgelegenen** Stundenwert wählt. Dieses Verhalten war für die Warnlogik ungeeignet: Nach der halben Stunde konnte dadurch bereits die nächste Prognosestunde ausgewählt und der noch bis zum Stundenende gültige Warnzustand aus dem Warnhorizont abgeschnitten werden.

Für Warnungen gilt nun ein eigener Intervallvertrag: **Es wird der letzte Stundenwert mit `epoch <= jetzt` verwendet.** Erst exakt mit Beginn der nächsten Stunde wechselt der Warnhorizont auf diesen neuen Stundenwert. Damit bleibt z. B. eine ab 22:00 Uhr bestehende Warnlage auch um 22:31/22:51 Uhr aktuell, solange ihr berechnetes `validTo` noch nicht erreicht ist.

`validFrom <= jetzt < validTo` bleibt unverändert die Regel für den Warnkopf. Der Fehler lag davor in der Auswahl des Warnhorizonts, nicht in dieser Gültigkeitsprüfung.

## Regression

`scripts/test-warning-current-hour-boundary-096512.mjs` prüft explizit 22:31, 22:59 und 23:00 Uhr und schützt davor, eine laufende Stundenwarnung nach `:30` vorzeitig auszublenden.

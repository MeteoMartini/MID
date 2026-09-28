# MID v0.9.15.3

## Änderung

Die 14-Tage-Zusammenfassung der Cockpit-Registeransicht nennt den Beginn zunehmender Unsicherheit nicht mehr nur als Wochentag. Sie verwendet jetzt durchgehend Wochentag und Datum im Format `dd.mm.`, zum Beispiel `Ab Montag, 10.08.`.

Zusätzlich enthält der Tooltip des 14-Tage-Mini-Ribbons ebenfalls Wochentag und Datum.

## Regression

`scripts/test-cockpit-fourteen-uncertainty-date-09153.mjs` schützt die eindeutige Datumsdarstellung und die Weitergabe der Zusammenfassung an das 14-Tage-Register.

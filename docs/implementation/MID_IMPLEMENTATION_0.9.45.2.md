# MID v0.9.45.2

## Sonne / Mond – nächste Finsternis

- Die Sonne/Mond-Karte zeigt zusätzlich die nächste standortrelevante Sonnen- oder Mondfinsternis mit Datum.
- Sonnenfinsternisse werden lokal für Breite, Länge und Höhe berechnet; angezeigt werden Typ, Beginn, Maximum, Ende und maximale lokale Verdeckung der Sonnenscheibe.
- Mondfinsternisse werden auf lokale Sichtbarkeit zum Maximum geprüft. Partielle/totale Ereignisse zeigen den Umbra-Bedeckungsgrad; Halbschattenfinsternisse werden als „Halbschatten“ bezeichnet statt mit irreführenden 0 %.
- Berücksichtigt werden ausschließlich Ereignisse, deren Maximum nach dem aktuellen Zeitpunkt liegt. Nach dem Maximum rückt automatisch das nächste zukünftige Ereignis nach.
- Die Berechnung nutzt Astronomy Engine 2.1.19 (MIT, keine transitiven Laufzeitabhängigkeiten).
- Im Info-Popover erscheint bei Sonnenfinsternissen zusätzlich ein kompakter Sicherheitshinweis zum geeigneten Sonnenfilter.

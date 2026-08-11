# MID v0.9.40.9

## Niederschlagswahrscheinlichkeit app-weit

- Der echte Ensemble-Tageswert wird überall als **00–24 h** ausgewiesen.
- Kompakte Tagesdarstellungen zeigen zusätzlich das stärkste **6-h-Zeitfenster** (00–06, 06–12, 12–18 oder 18–24 h).
- Die 00–24-h-Wahrscheinlichkeit wird gegen die enthaltenen 6-h-Werte plausibilisiert und kann mathematisch nicht kleiner als ein Teilfensterwert sein.
- Die gleiche Konsistenzprüfung gilt für die zweite Ereignisschwelle **> 5,0 mm**.
- Fehlt eine belastbare Ensembleauswertung, wird `precipitation_probability_max` ausschließlich als **max. Stundenwahrscheinlichkeit** gekennzeichnet, nicht als Tageswahrscheinlichkeit.
- Betroffen sind die zentrale `displayDays`-Reihe und damit klassische Vorhersage, 7-Tage-Cockpit, Ensemble-Best-Match, Widget und PNG-Export.

## Kompositbild / Radar

Alle Änderungen aus v0.9.40.8 bleiben enthalten: echter Satelliten-Zeitstempel in der Legende, robustere Radar-/Modell-Niederschlagsart sowie zusätzliche professionelle Farbtabellen für 1-km-/250-m-Radar.

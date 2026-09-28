# MID v0.9.39.2 – DWD-nahe Niederschlagswahrscheinlichkeit

## Ziel

Die Tagesdarstellung verwendet nicht mehr das Maximum einer stündlichen Niederschlagswahrscheinlichkeit als vermeintliche Tageswahrscheinlichkeit. MID trennt stattdessen Ereignis, Bezugszeitraum und Fallback transparent.

## DWD-Ereignisschwellen und Zeiträume

Für Ensemble-Member werden zwei Niederschlagsereignisse geführt:

- mehr als 0,2 mm,
- mehr als 5,0 mm.

Beide Ereignisse werden für den vollständigen Kalendertag sowie für vier 6-Stunden-Fenster in Ortszeit berechnet: 00–06, 06–12, 12–18 und 18–24 Uhr.

## Darstellung

Kompakte Tagesflächen zeigen das 6-Stunden-Fenster mit der höchsten Wahrscheinlichkeit für >0,2 mm, z. B. `12–18 h · 70%`. Dadurch bleibt die Darstellung schmal und nennt gleichzeitig den zeitlichen Schwerpunkt. Der Tooltip enthält zusätzlich die 24-h-Wahrscheinlichkeiten für >0,2 und >5,0 mm sowie alle vier 6-h-Fenster.

Fehlt eine belastbare Ensembleauswertung, bleibt die höchste stündliche Best-Match-Wahrscheinlichkeit verfügbar, wird aber ausschließlich als `zeitw. bis X%` gekennzeichnet. Sie wird nicht als Tagesereigniswahrscheinlichkeit ausgegeben.

## Statistik

Wahrscheinlichkeiten werden aus allen plausiblen Membern vor der robusten Ausreißerfilterung der Niederschlagsmengen berechnet. Die Filterung bleibt für Mengenquantile und Mittelwerte bestehen, verändert aber nicht die Häufigkeit des Eintritts eines gültigen Ensembleereignisses.

## Cache und Regression

Der Ensemblecache ist wegen der neuen 6-h-Datenstruktur auf v11 angehoben. Eigene Regressionen schützen DWD-Schwellen, Zeitfenster, Fallback-Semantik, kompakte UI sowie die app-weite Verwendung.

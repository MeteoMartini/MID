# MID v0.8.26.19

## Hyperlokal konsistente Kurzfristvorhersage

Die ersten Kurzfrist-Zeitschritte werden bei einer frischen hyperlokalen oder stationsgestützten Analyse nicht mehr ausschließlich aus dem unveränderten Best Match dargestellt. MID gleicht die aktuellen lokalen Abweichungen kontrolliert und zeitlich auslaufend an.

Berücksichtigt werden:

- Temperatur und gefühlte Temperatur
- relative Feuchte und Taupunkt
- QFF-/MSL-Luftdruck
- Wind, Böen und Windrichtung einschließlich korrekter Umrechnung von km/h in kt
- Bewölkung, tiefe Bewölkung und Wetterpiktogramm
- Sichtweite
- Niederschlag und Niederschlagswahrscheinlichkeit
- Wolkenbasis beziehungsweise Ceiling für die Niederschlagsplausibilität

Schnell veränderliche Größen laufen früher zum Best Match zurück; Temperatur, Feuchte und Luftdruck werden etwas länger angenähert. Veraltete Stationswerte werden nicht verwendet. Die Kurzfristkarte kennzeichnet eine aktive Anpassung als „Hyperlokal angepasst“, „Stationsgestützt angepasst“ oder „Eigene Station · lokal angepasst“.

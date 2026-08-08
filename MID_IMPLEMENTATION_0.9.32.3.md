# MID v0.9.32.3

## 24-h-Wetterprofil – Layout- und Usability-Fortsetzung

- Oberer Leerraum reduziert: Overlays, Piktogrammleiste und Plotbeginn enger aneinandergeführt.
- Linke Diagrammbeschriftungen vereinheitlicht; Temperaturachse auf runde Werte umgestellt.
- Tagesextreme (max/min) der Temperatur im sichtbaren Zeitraum markiert.
- Stündliche Wetterpiktogramme durchgehend sichtbar; Zeitlabels oberhalb des Diagramms mobiler entzerrt.
- Wolkenfelder auf einheitlichem Hintergrund mit kontrastreicherem H/M/L-Signal überarbeitet.
- Obere Signalkarten werden nun anlassbezogen eingeblendet; „Ruhiges Fenster“ wurde verständlicher ersetzt.
- Legende ist deaktivierbar; erläuternde Hinweise stehen hinter (i).
- Einzeldatenblöcke thematisch zusammengeführt: Temperatur/Gefühlt, Taupunkt/Schwüle, Sichtweite/Nebelrisiko.

## CI-/Regression-Fix

- Sechs Altregressionen auf den bewusst geänderten Wetterprofil-Vertrag synchronisiert.
- Harte Versionsbindung des v0.9.32.2-Achsensicherungstests entfernt.
- Neue Regression `scripts/test-mid-weather-profile-layout-09323.mjs` schützt die v0.9.32.3-Änderungen.
- Vollständige Suite: 329/329 Tests bestanden.

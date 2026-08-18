# MID v0.9.59.0 – Flugstreckenbriefing und vertikale Schwerpunktströmung

## Flugmeteorologie
- Cross Section reaktiviert, jedoch ausschließlich als textuelles Streckenbriefing.
- 2–8 ICAO-Orte, Flight Level, Start-/Landezeit, Modell und Abtastdichte einstellbar.
- Ausgabe nennt Gefahr, Streckenabschnitt/Entfernung und erwartetes Zeitfenster.
- Amtliche/operative Signale werden an Start, En-route-Schwerpunkt und Ziel ergänzt.

## Radar-Zeitpfeil
- Vertikalprofil 950–300 hPa mit Wolkenbedeckung, relativer Feuchte, Wind und Geopotential.
- Wolken-/Feuchteschicht bestimmt den vertikalen Schwerpunkt; Windvektoren werden dort gewichtet gemittelt.
- Zeitpfeil bevorzugt diese Schwerpunktströmung, Radar-/KONRAD-Verlagerung bleibt Plausibilisierung/Fallback.
- Eigene Rendering-Panes sichern Sichtbarkeit von Achse, Zeitmarken und Zielpfeilspitze.

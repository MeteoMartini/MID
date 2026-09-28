# MID v0.9.15.11

## Niederschlagswahrscheinlichkeit und Radar-Nowcast

- DWD-RV-Standortpunkt in allen verfügbaren 5-Minuten-Schritten bis +120 Minuten.
- GetMap dient nur noch der Umfeld- und Bewegungsdiagnostik.
- RADOLAN YW wird als native aktuelle 1-km-Punktbeobachtung gegengeprüft.
- Getrennte Niederschlagsphasen werden mit Unterbrechungen und letzter Endzeit ausgewiesen.
- Nahe Echos werden nicht mehr als Standorttreffer oder Niederschlagsmenge am Standort gewertet.
- OPERA CIRRUS bleibt räumlicher Kontrollabgleich und überschreibt keinen trockenen DWD-Standortpunkt.
- Radar-/Modellfusion gewichtet bei reinen Umfeldsignalen den trockenen Standortpunkt dominant und begrenzt die aktuelle Wahrscheinlichkeit auf 55 %.

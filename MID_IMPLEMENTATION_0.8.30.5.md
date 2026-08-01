# MID v0.8.30.5

## Umsetzung
- Szenario-Temperaturwerte werden über eine eigene, währungsfreie Formatierung mit festem Gradzeichen ausgegeben.
- Der belastbare Prognosezeitraum verwendet die Differenz der Kalendertage: Samstag bis Donnerstag entspricht fünf Tagen Vorlauf.
- Die versetzte manuelle SVG-Tageslinie im Temperaturdiagramm wurde entfernt. Vertikale Linien werden nun als Recharts-Referenzlinien exakt an den X-Achsenwerten gezeichnet.
- Horizontale Hauptlinien werden in Temperatur, Niederschlag und Wind/Böen jeweils aus den tatsächlich beschrifteten Y-Achsenticks erzeugt.

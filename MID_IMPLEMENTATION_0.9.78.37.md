# MID v0.9.78.37

## Anlass
Nach der Entblockierung des 14-Tage-Ensembles soll der vorläufig sichtbare Mean/Spread-Start möglichst schnell in eine belastbare Mitglieds-/Mehrmodellfusion übergehen, ohne durch unnötige Wiederholungsrequests in Open-Meteo-Abfragegrenzen zu laufen. Gleichzeitig zeigte die relative Sonnenscheindauer in sehr kleinen mobilen 14-Tage-Karten ein unvollständiges bzw. optisch verformtes Sonnensymbol. Release-Run #872 scheiterte außerdem an fünf veralteten statischen PoP-Regressionen nach der 24-h-Skybar-Umstellung.

## Ensemble: schneller, aber request-sparsam
- Mean/Spread-first bleibt als sofort sichtbarer Bootstrap erhalten.
- Die Vollfusion startet nach 2 s statt erst nach 12 s.
- Der Vollensemble-Pfad priorisiert lange unabhängige Familien: ECMWF, NOAA, GEM, Google WeatherNext, BOM; regionale Familien folgen als Ergänzung.
- Ziel sind sechs erfolgreiche Modellrouten mit weiterhin maximal zwei parallelen Open-Meteo-Abrufen.
- Zeitbudget je Vollmodell auf 20 s begrenzt, sodass blockierende Quellen die Gesamtfusion nicht unverhältnismäßig verzögern.
- Netzwerkfehler lösen nicht mehr zusätzlich die komplette Variablen-Abstufung aus. Zusätzliche Variablen-Fallbacks werden nur bei plausiblen Variablen-/Parameterfehlern versucht.
- Hintergrundrequests werden nicht nochmals direkt wiederholt.
- Der finale Ensemblecache bleibt 60 min frisch (vorher 20 min). Die Modellläufe aktualisieren typischerweise deutlich seltener; dadurch entfallen unnötige identische Vollabrufe.
- Der globale Open-Meteo-Guard bleibt bei höchstens zwei aktiven Requests und 220 ms Startabstand.

## 14-Tage-Sonnendarstellung
- Das relative Sonnensymbol zeichnet immer den vollständigen Kern plus alle acht Strahlen.
- Der relative Sonnenscheinanteil wird über Helligkeit und Kernfüllung codiert, nicht mehr durch das Weglassen einzelner Strahlen.
- `vector-effect: non-scaling-stroke` wurde entfernt. Bei 12–14 px skaliert die Strichstärke damit proportional mit dem SVG und erzeugt keine überdicken bzw. zusammenlaufenden Strahlen mehr.

## CI #872
Die fünf fehlgeschlagenen PoP-Regressionen erwarteten weiterhin den etablierten Bezeichner `probabilityHours`. Die 24-h-Skybar bleibt unverändert auf dem vollständigen Kalendertag; zusätzlich wird `calendarDayHours=probabilityHours` verwendet. Damit bleiben sowohl der alte appweite Niederschlagswahrscheinlichkeitsvertrag als auch der neue 24-h-Skybar-Vertrag eindeutig erhalten.

## Regression
Neu: `scripts/test-ensemble-rate-budget-sunshine-097837.mjs` schützt Ensemble-Requestbudget, schnelle Nachladung, PoP-/24-h-Skybar-Koexistenz und unverzerrte vollständige relative Sonnendarstellung.

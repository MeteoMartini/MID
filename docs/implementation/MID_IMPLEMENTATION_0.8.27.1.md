# MID v0.8.27.1 – Kurzfrist-Gewitterprobe Buildfix

## Fehlerbild
Der Produktionsbuild von v0.8.27.0 brach in `src/ShortTermForecast.tsx` mit TS2353 ab. Beim Aufruf von `significantHourlyThunderRisk` wurde ein aus dem vollständigen Stundenobjekt aufgebautes Objekt übergeben, das zusätzliche Felder wie `apparent`, `pressure`, Wind-, Bewölkungs- und Sichtwerte enthielt. Diese Felder sind nicht Bestandteil von `DetailThunderRiskSample`.

## Korrektur
Die Kurzfristvorhersage konstruiert nun eine explizite, typsichere Gewitterprobe aus den tatsächlich ausgewerteten Feldern:

- Wettercode
- CAPE
- Lifted Index
- CIN
- Säulenwasserdampf
- Temperatur und Taupunkt
- Feuchte
- Niederschlag, Regen und Schauer
- Niederschlagswahrscheinlichkeit

Die fachliche Gewitterbewertung und die hyperlokale Kurzfristangleichung bleiben unverändert erhalten.

## Regression
`scripts/test-short-term-thunder-sample-buildfix-08271.mjs` schützt den Feldvertrag und die Versionssynchronität.

# MID v0.9.79.16 — MOSMIX-S/L-Aktualität und Niederschlags-Intervallgeometrie

## Extern
- Modellstand unterscheidet jetzt MOSMIX-S (stündliche Kurzfrist-Aktualität) von MOSMIX-L (03/09/15/21 UTC für den erweiterten Horizont).
- Ein fehlender MOSMIX-S-Laufindex wird nicht mehr durch einen MOSMIX-L-Init kaschiert.
- Skybar und Niederschlagsanzeige verwenden appweit die sichtbare Vorwärtssemantik: ein für 19:00–20:00 erwarteter Niederschlag liegt auch geometrisch in genau diesem Intervall.
- Die Niederschlagswahrscheinlichkeit im 24-h-Profil wird als Stundenintervall stufenförmig dargestellt.

## Intern
- Worker liest beide offiziellen DWD-OpenData-Indizes (`MOSMIX_S` und `MOSMIX_L`) parallel.
- MOSMIX-S wird mit 1-h-Solltakt und eigener Frischebewertung geführt; MOSMIX-L bleibt separate Langfristreferenz.
- `ForecastFusionMosmix` enthält getrennte S-/L-Laufmetadaten.
- `detailSkyBarSegments()` interpretiert explizite x-Positionen als Slotstarts statt als Segmentzentren.
- Das 24-h-Tagesdiagramm verwendet eine 00:00–24:00-Slotgeometrie; Niederschlagsbalken und Hitflächen folgen den Stundenfenstern.
- Bestehende Provider-/Rechenkern-Semantik bleibt unverändert endgestempelt.

## Absicherung
- `scripts/test-mosmix-hourly-run-metadata-097916.mjs`
- `scripts/test-precipitation-forward-geometry-097916.mjs`

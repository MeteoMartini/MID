# MID v0.9.85.64 · RUC-Kurzfristparameter-Audit

## Ergebnis

ICON-D2-RUC-Bewölkung muss in MID **nicht als zweite Zusatzmischung neu eingeführt werden**. Die relevanten Felder laufen bereits über die kanonische Forecast-Fusion in `displayHours` und damit in die 90-Minuten-/24-h-Kurzfristansicht. Eine zweite direkte RUC-Gewichtung im UI würde dieselbe DWD-Modellfamilie doppelt zählen.

## Bereits produktiv genutzt

- `CLCT` → Gesamtbewölkung und `CLCL` → tiefe Bewölkung gehören zum verpflichtenden stündlichen RUC-Zustandskern 0…+14 h.
- `CLCM` / `CLCH` ergänzen Mittel-/Hochbewölkung optional.
- `VIS` und `CEILING` werden als optionale Specialist-Felder vorprozessiert.
- Die Forecast-Fusion übernimmt bei verfügbarem RUC-Feld Gesamt-/Tief-/Mittel-/Hochbewölkung, Sicht und Ceiling in das kohärente Wetterbündel.
- Die Kurzfristansicht interpoliert anschließend ausschließlich die bereits kanonischen Stunden zwischen den Zeitpunkten. Das ist eine Darstellungsinterpolation, keine zweite Modellstimme.
- Bewölkung fließt damit bereits in Wetterpiktogramm, Wetterzustand und Sonnenschein-Plausibilisierung ein; Sicht und Ceiling stützen insbesondere Nebel-/Tiefe-Wolken-/Phasendiagnostik.

## DWD-Verfügbarkeit geprüft

Der offizielle DWD-Open-Data-Baum für ICON-D2-RUC führt aktuell unter anderem `CLCT`, `CLCL`, `CLCM`, `CLCH`, `VIS` und `CEILING`. Bei `CEILING` sind in den geprüften RUC-Läufen native 15-Minuten-Termine (00/15/30/45 min) vorhanden.

## Entscheidung für MID 18.2

1. **Keine Doppelgewichtung von RUC-Bewölkung.** Der bestehende kanonische Pfad bleibt maßgeblich.
2. **Keine pauschale 15-/5-Minuten-Verdichtung aller Wolkenfelder.** Temperatur, Wind, Feuchte und Bewölkung bleiben im gemeinsamen Zustandskern stündlich; feinere Felder werden nur parameter-nativ geführt.
3. **CEILING, VIS, HZEROCL und SNOWLMT werden ab MID v0.9.85.67 zusätzlich nativ 15-minütig für +0…6 h geführt.** Der stündliche Fallback bleibt erhalten. Nutzen: Sicht-/Nebelplausibilisierung, Ceiling sowie Nullgrad- und Schneefallgrenze in der 90-Minuten-Kurzfrist.
4. **CLCT/CLCL/CLCM/CLCH bleiben stündlich.** Laut DWD werden diese Bedeckungsfelder im ICON-D2-RUC mit 60-minütiger Ausgabe bereitgestellt; MID erzeugt daraus keine fiktive 15-Minuten-Modellauflösung.
4. Radar, Stationsdaten und lokale Beobachtungen bleiben nachgelagert höher priorisiert als RUC.

## Schutz

Der Regressionstest `scripts/test-mid-18-2-interaction-ruc-098564.mjs` prüft, dass die vorhandenen RUC-Wolken-/Sicht-/Ceiling-Felder weiterhin im Preprocessor und in der kanonischen Kurzfristkette verdrahtet bleiben.

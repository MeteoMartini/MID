# MID v0.9.65.3 – rollierendes 24-h-Wetterprofil auf Basis v0.9.65.2

## Verbindliche Basis

- Ausgangspunkt ist vollständig **v0.9.65.2** einschließlich lokaler MeteoAlarm-Zuordnung, KV-Scheduler-Index, Geräte-/Wetterzwilling-Sync-Einsparungen, kompakter Info-Buttons und ERA5-Seamless-Reiseklimatologie.
- Keine dieser neueren Funktionen, Kadenzen, Datenquellen oder Persistenzverträge wird zurückgenommen.

## Zeitfenster und Auflösung

- Das Profil läuft exakt von der aktuellen Zeit bis **+24 Stunden** und verschiebt seinen Zeitanker automatisch alle 30 Sekunden.
- **1 h** ist Standard; **3 h** verdichtet nur die sichtbare Darstellung. Stündliche Rohdaten und kurzfristige Prognoseketten bleiben unverändert.
- Die gewählte Auflösung wird ausschließlich gerätelokal gespeichert und erzeugt weder Geräte-Sync- noch KV-Schreibvorgänge.

## Darstellung

- Nachtstunden erhalten dezente Hintergrundflächen; Tageswechsel, Sonnenaufgang und Sonnenuntergang werden eigenständig markiert.
- Zeittexte, astronomische Markierungen, Wettersymbole, Temperaturkurven, Windpfeile und selektierte Werte liegen in getrennten Bahnen.
- Hochformat nutzt die volle mobile Breite. Im mobilen Querformat stehen Diagramm und Einzeldaten platzsparend nebeneinander.
- Temperatur, gefühlte Temperatur und Taupunkt teilen sich eine fachlich gemeinsame Skala. Das thermische Empfinden verwendet die zentrale appweite DWD-Farbpalette.
- Niederschlagsmenge bleibt als mm-Balken sichtbar; die Wahrscheinlichkeit erhält eine eigene %-Kurve und Skala.
- Wolken hoch/mittel/tief werden als getrennte 0–100-%-Zellen sowie am gewählten Zeitpunkt mit exakten Prozentwerten dargestellt.

## Open-Meteo-Audit und Worker

- Die zuletzt korrigierten Wolkenprozent-, Druck-, NOAA-, JMA- und Reiseplanerverträge bleiben unverändert erhalten.
- UKMO UKV besitzt zusätzlich `ukmo_seamless` als aktuellen Browser-/Worker-Fallback und Metadatenvertrag.
- Es entstehen keine zusätzlichen Open-Meteo-Kernabfragen und keine zusätzlichen KV-Operationen.
- Ein Worker-Upload ist erforderlich, weil der UKMO-Fallback auch in Forecast-Fusion und Rapid-Phase-Vertrag ergänzt wurde.

## Regression

- `scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs` schützt Zeitfenster, 1-h-/3-h-Logik, Kollisionsfreiheit, Nacht/Sonne, Niederschlagsmenge/-wahrscheinlichkeit, H/M/L-Wolkenprozente, zentrale DWD-Farben und die aktuellen Open-Meteo-Modellverträge.

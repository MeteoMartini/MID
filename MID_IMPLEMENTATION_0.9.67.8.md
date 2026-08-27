# MID v0.9.67.8 – resilienter Mitteleuropa-Extremwetter-Ausblick

## Anlass
Nach der Erweiterung auf das vollständige ICON-D2-Gebiet in v0.9.67.7 stieg das Analysebudget von der früheren DACH-Größenordnung auf 477 Rasterpunkte. Bei temporären Open-Meteo-Limits oder einem einzelnen Batchfehler konnten dadurch Worker und Browser-Direktpfad gemeinsam vollständig ausfallen.

## Umsetzung
- Das vollständige ICON-D2-Gebiet bleibt geografisch unverändert erhalten.
- Der zentrale Worker nutzt ein 13×23-Vollgebietsprofil; innerhalb der realen gedrehten ICON-D2-Maske liegt die Punktzahl wieder ungefähr in der früher stabilen Größenordnung.
- Der direkte Browser-Rückfall nutzt ein 11×19-Vollgebietsprofil und nur einen Batch gleichzeitig.
- Batches sind auf 32 Punkte begrenzt; Worker-Parallelität maximal 2, Browser-Fallback maximal 1.
- Einzelne fehlgeschlagene Batches werden bis zu zweimal erneut versucht.
- Erfolgreiche Teilbatches werden bis zu 6 h im Teilcache gehalten und können kurzfristige Einzelstörungen überbrücken.
- Der Ausblick bleibt ab 65 % Datenabdeckung nutzbar; eine temporär reduzierte Abdeckung wird transparent angezeigt. Unterhalb dieser Grenze greift weiterhin der letzte vollständige lokale Ausblick.
- Cachegeneration v5 trennt den neuen resilienten Vertrag von älteren v4-Payloads.

## Wirkung
Die Regionenabdeckung bleibt Mitteleuropa / vollständiges ICON-D2-Gebiet. Die Änderung reduziert ausschließlich die externe Abruflast und verhindert, dass ein einzelner Timeout/429 den gesamten Extremwetter-Ausblick unbrauchbar macht.

## Regression
Neuer Vertrag: `scripts/test-extreme-outlook-resilience-096678.mjs`. Zusätzlich bleiben Flächen-, Kontur-, Popup-, MapLibre-, Worker-Fallback-, iOS- und Performanceverträge bestehen.

# MID Test Report 0.9.84.55

## GitHub #1010
Der vollständige Installerlauf der Basis 0.9.84.54 hat npm ci, Dependency-Audit, TypeScript 7.0.2 und Vite 8.2.2 erfolgreich abgeschlossen. Der Abbruch erfolgte erst in drei von 747 Regressionen.

## Korrigierte Regressionen
- Hyperlokale Wolkenkorrektur: neuer CAVOK-Vertrag ohne Gleichsetzung mit 0 % Gesamtbewölkung.
- Radar-Nowcast: direkte Rohübergabe bleibt nur für die aktuelle Wetter-/Nowcast-Karte erlaubt; Prognoseansichten bleiben kanonisch.
- Widget-Light-Export: heller Windpfeil ohne Box-/Filter-/Textschatten.

## Synoptik
- 500-hPa-Isohypsen: kontrastreiche amber/gold Polyline-Konturen mit dunklem Halo.
- Hauptisohypsen durchgezogen, Zwischenisohypsen gestrichelt.
- Leaflet- und MapLibre-Modelllinien-Panes explizit geschützt.
- Label allein gilt nicht als erfolgreicher Layer; Polyline/Grid-Frame-/Stilvertrag ist regressionsgeschützt.

## Lokal ausgeführte Prüfungen
- test-ensemble-wind-selection-cloud-reconciliation-08173.mjs: PASS
- test-radar-nowcast-null-buildfix-091111.mjs: PASS
- test-widget-ensemble-climate-alias-09849.mjs: PASS
- test-performance-openmeteo-contours-071070.mjs: PASS
- test-synoptic-contour-path-options-097884.mjs: PASS
- test-synoptic-isoheight-visibility-098455.mjs: PASS
- test-current-cloud-widget-export-098454.mjs: PASS
- test-versioning.mjs: PASS
- test-release-lineage.mjs: PASS
- test-baseline-079526-contract.mjs: PASS
- worker.js / worker/metar-proxy.js Syntax: PASS

Ein vollständiger lokaler TypeScript-/Vite-Neubuild wurde nicht wiederholt, da im isolierten Arbeitsverzeichnis kein node_modules vorhanden ist. GitHub #1010 hat genau diese Basis vor den Regressionen bereits erfolgreich mit TS7/Vite gebaut; der nächste Installer bleibt das vollständige fail-closed Gate für 0.9.84.55.

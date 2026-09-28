# MID v0.9.77.13 – Open-Meteo Rapid-Refresh/RUC-Quellenkorrektur

## Anlass

Die erneute Prüfung der aktuellen Open-Meteo- und DWD-Quellen zeigte eine wichtige Abgrenzung: Open-Meteo bietet zwar native 15-Minuten-Daten aus ICON-D2, HRRR und AROME und nutzt diese im generischen Best-Match-Pfad, integriert den stündlichen **DWD ICON-D2-RUC** aber Stand 02.09.2026 noch nicht als eigenes Forecast-API-Modell.

Im bisherigen MID-Stand war der echte DWD-RUC bereits korrekt über die eigene DWD→Pages/R2-Pipeline eingebunden. Zwei Open-Meteo-Raster-/Fallbackstellen enthielten jedoch noch vorsorgliche Modellalias-Versuche `icon_d2_ruc`/`dwd_icon_d2_ruc`. Diese konnten nur fehlschlagen und die Quellenbezeichnung missverständlich machen.

## Umsetzung

- DWD ICON-D2-RUC ist in der Forecast-Fusion jetzt ausdrücklich `directOnly` und besitzt keine Open-Meteo-Modellaliasliste mehr.
- Wenn der direkte DWD-RUC-Punktadapter nicht verfügbar ist, erfolgt **kein** 404-Probeversuch gegen Open-Meteo; MID fällt gemäß bestehender Fusion auf reguläres ICON-D2/Best Match/weitere Modelle zurück.
- Die RUC-Frischebewertung verwendet bei der direkten Quelle die tatsächliche DWD-RUC-Initialisierungs-/Verfügbarkeitszeit und fragt keine nicht vorhandene Open-Meteo-Metadaten-URL ab.
- Das Niederschlagsart-Raster probiert ebenfalls keinen Open-Meteo-ICON-D2-RUC mehr.
- Open-Meteo ICON-D2 wird dort korrekt als **15-min Regionalmodell mit 3-stündlichen Modellläufen** geführt; die Metadaten des `dwd_icon_d2_15min`-Datensatzes werden bevorzugt ausgewertet.
- HRRR verwendet explizit den 15-min-Datensatz `ncep_hrrr_conus_15min` mit dem normalen HRRR-Pfad als Fallback.
- Die bereits vorhandenen stündlichen AROME France/HD 15-min-Produkte bleiben Rapid-Refresh-Quellen.
- Der kanonische Open-Meteo-Core nutzt weiterhin den generischen `/v1/forecast`-Best-Match-Pfad mit `minutely_15`; damit bleiben die jeweils regional verfügbaren hochaufgelösten 15-min-Daten erhalten, ohne sie fälschlich als DWD-RUC zu deklarieren.

## Fachliche Priorität in Mitteleuropa

1. Beobachtung/Radar/Blitz/KONRAD3D.
2. Echter DWD ICON-D2-RUC: eigene direkte MID-Pipeline, stündliche Initialisierung, native parameterabhängige 5/15/60-min-Produkte.
3. Open-Meteo Best Match / reguläres ICON-D2 15 min als zusätzlicher regionaler Kurzfristpfad; ICON-D2-Läufe alle 3 h.
4. Weitere unabhängige Regional-/Globalmodelle gemäß Forecast-Fusion.

Die DWD-ICON-Familienbegrenzung bleibt bestehen: RUC und reguläres ICON-D2 sind keine zwei unabhängigen Stimmen.

## Regression

Neu: `scripts/test-openmeteo-rapid-source-contract-097713.mjs` schützt die Trennung zwischen Open-Meteo-15-min-Produkten und dem direkten DWD-RUC, die Best-Match-15-min-Anforderung sowie HRRR-/AROME-/ICON-D2-Metadaten und Worker-Aggregat.

Validierung des konsolidierten Stands: **521/521 umgebungsunabhängige Regressionen bestanden**. Von insgesamt 626 automatisch erkannten Tests benötigen die übrigen 105 ausschließlich die im Transport-ZIP nicht enthaltene lokale npm-/TypeScript-7-Testtoolchain (86 × `typescript-strada`, 16 × TypeScript-7-CLI, 2 × `esbuild`, 1 × lokales `tsc`). Es verbleibt kein anderer fachlicher Regressionstest-Fehlschlag.

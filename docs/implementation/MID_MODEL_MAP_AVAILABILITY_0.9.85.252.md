# MID v0.9.85.252 – Modellkarten-Verfügbarkeit und synoptische Zeitleiste

## Provenienz und unveränderter Rahmen
- Ausgangspunkt: `main = mid-stable = 41ff2bca8eca2d64e4d28466e14a23791e8215f3`, MID v0.9.85.251, geschützte Branches.
- Umsetzung nur in `chatgpt/v0.9.85.252-model-map-availability`. Kein direkter Produktionsbranch-Push, kein neues RUC-Codecformat, kein Wegfall fachlicher Prüfungen.
- Referenz: verifizierter RUC-Publish #38576792833 vom 14. Oktober 2026, mit Pages/Worker-Health für DWD-RUC 13 UTC und 891593102 von 900000000 Bytes publizierter Daten.

## Befunde
1. Gemeinsame Kartenzeitleiste hatte `liveFollow` stets an den jüngsten Beobachtungszeitpunkt gebunden. Für aktivierte Modellkarten kann dieser Zeitpunkt deutlich über 90 Minuten vom nächstliegenden tatsächlichen Synoptiktermin entfernt sein, insbesondere nach budgetbedingtem Entfernen optionaler Termindichte. `synopticCompositePlan` ist korrekt streng (±90 min), weshalb dann kein Feld gerendert wird. Die Modelltermine selbst können gleichwohl publiziert sein.
2. Das getrennte Wolken-/Wetterprodukt `cloudWeatherFrames` hat bisher bei jedem Modell das gesamte verfügbare Zeitinventar bestimmt, sobald mindestens ein separater Termin existierte. Das blockiert einen tatsächlich passenden, veröffentlichten nativen ICON-D2-CLCT/WW-Datensatz für einen nur im separaten Inventar fehlenden Zeitpunkt. Der publizierende DWD-Workflow protokollierte am 14.10.2026 konkret ICON-D2 +0 h und ICON-EU +3 h ohne vollständiges separates Feldpaar. Ein natives Paar ist nicht automatisch für diese Stunden belegt; der Fallback greift ausschließlich, wenn *beide* nativen Publikationsframes für genau denselben ISO-Zeitpunkt vorhanden sind.

## Eng begrenzte Änderung
- `preferForecastFrameIndex` wählt unter aktiven, tatsächlich in der Zeitleiste vorhandenen Modellframes den relativ zum Jetzt nächsten Zeitpunkt. Bei exakt gleichen Abständen hat der künftige Termin Vorrang. Ohne Modellframes bleibt das bisherige Beobachtungs-Liveverhalten.
- Eine bereits veröffentlichte Modellstunde bis 180 Minuten in der Vergangenheit bleibt für eine aktive Modellkarte erreichbar, wenn die gewöhnliche 90-Minuten-Historie den Einstieg sonst ausschließen würde. Keine Stunden oder interpolierten Frames werden synthetisch hinzugefügt.
- `pairedNativeCloudWeatherTimes` bildet die exakte Schnittmenge bereits veröffentlichter ICON-D2-CLCT- und WW-Termine. Der bestehende separate Produktframe bleibt bevorzugt; nur für eine dort fehlende Stunde kann auf ein tatsächliches natives Feldpaar umgestellt werden. `nativeCloudWeatherPair` erzwingt weiterhin identischen Modelllauf, Gültigkeitszeit und Raster sowie Erhalt echter Missing-Werte.
- Keine Quellkorrektur durch fremde Modellläufe; keinerlei Veränderung von GRIB-Dekodierung, RUC-Preprocessing, Daten-/Pages-Budget, WMS-Endpunkten, Worker-Runtime oder Wettervisualisierungsfarben.

## Regressionen und Freigabe
- `scripts/test-c22-synoptic-timeline-0985202.mjs`: tatsächlich bestätigte Modellzeiten bei gleichzeitiger Beobachtungslivezeit, Historie, Gleichstand, kein künstlicher Termin.
- `scripts/test-cloud-significant-weather-0985231.mjs`: exakter nativer CLCT/WW-Schnitt und Priorität für separat verfügbare Frames; bestehende strenge Zeit-/Raster-/NoData-Assertions bleiben.
- Bestehende vollständige Source-PR-Gates mit Core/Heavy-Kartenbrowser, Produktionsbuild, Security, Versions-/iOS-Shell-Identität müssen grün werden; nachgelagerter Installer und Pages-/Worker-Nachweis sind zwingend. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme allein aus Chromium behaupten.
- Offene gesonderte Aufträge: RUC-Kompressionspilot #352, RUC-native Karten #350, CSS-Ladebudget #344, Unified-Map-Timeout #348 und Security-Advisory nach automatischer Revision #38537542054. Sie sind nicht mit diesem schmalen UX-Fix als erledigt deklariert.

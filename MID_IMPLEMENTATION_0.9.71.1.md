# MID 0.9.71.1 – RUC-Appweit-Audit und WidgetKit-Regressionshotfix

## Ausgangslage

v0.9.71.0 enthält die korrekte WidgetKit-Xcode-Struktur. Der Release-Installer-Run #751 scheiterte ausschließlich an vier historischen iOS-Regressionen, die ab v0.9.71.0 weiterhin den bereits erledigten WidgetKit-Meilenstein statt `apple-push-background-refresh-source-preparation` erwarteten. TypeScript, Vite und 561 von 565 Regressionen waren in diesem Lauf bereits grün; Worker, Pages und `mid-stable` wurden durch das Gate nicht verändert.

## Korrektur der vier iOS-Regressionen

Die Tests

- `test-ios-safe-area-header-096671.mjs`,
- `test-native-external-navigation-096681.mjs`,
- `test-native-location-adapter-09680.mjs`,
- `test-native-share-import-export-096682.mjs`

verwenden ab v0.9.71.0 nun den tatsächlich in `MID_IOS_STATUS.json` stehenden nächsten Meilenstein `apple-push-background-refresh-source-preparation`. Historische Versionszweige bleiben unverändert geschützt. Die WidgetKit-Implementierung wird nicht zurückgerollt.

## RUC-Appweit-Audit

Der Audit ist in `MID_RUC_APPWIDE_AUDIT_0.9.71.1.md` dokumentiert. Der kanonische Forecastpfad bleibt Best Match/Mehrmodell → RUC/RUC-EPS → Wetterzwilling → Radar/Beobachtung → sichtbare Stunden/15-Minuten/Tageswerte.

Behoben wurden verbliebene Nebenpfade:

- Lüftungsassistent und Lüftungs-Push verwenden `forecast-fusion` statt eines eigenen Ortsforecasts.
- Prognoseänderungs-Push verwendet `forecast-fusion` statt `models=best_match`.
- `mid.native.widget.v1` übernimmt stündliche/tägliche Forecastwerte aus der kanonischen Fusion; Current/Astronomie bleiben die Rohhülle für aktuelle Beobachtungsnähe und Sonnenzeiten.
- Wasser-/Warn-Quellenbeschriftungen benennen die tatsächlich verwendete kanonische MID-Ortsprognose.
- KNMI HARMONIE Europe/NL und DMI HARMONIE teilen konservativ das UWC-West-HARMONIE-Unabhängigkeitsbudget; die einzelnen Anbieter bleiben diagnostisch sichtbar.

Druckniveau-, Berg-, Marine-, Radar-/Raster- und Extremwetter-Feldpfade bleiben fachlich eigenständige Spezialdaten und werden nicht mit einem bodennahen Punkt-RUC künstlich überschrieben.

## Quellenentscheidung

KNMI HARMONIE-AROME ist als stündliche, hochaufgelöste UWC-West-Rapid-Quelle bestätigt. KNMI stellt die operativen Cy43-Datensätze als Open Data unter CC-BY-4.0 über eine dateibasierte API/Notification-Infrastruktur bereit. MID nutzt vorerst weiterhin die bereits integrierte Open-Meteo-Abbildung; eine zweite direkte GRIB-Pipeline würde API-Key-/Quota-, Download-, Dekodier- und Betriebsaufwand duplizieren, ohne aktuell belegten Zusatznutzen.

Weitere vorhandene kostenlose Regional-/Rapid-Quellen bleiben regional und familienbewusst gewichtet. Es wird kein neuer kostenpflichtiger Dienst und kein R2-Bucket aktiviert.

## Releasegrenze

Der nächste iOS-Meilenstein bleibt `apple-push-background-refresh-source-preparation`. v0.9.71.1 ist bewusst der geprüfte Reparatur-/Auditkandidat vor dessen Umsetzung.

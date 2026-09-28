# MID Test Report 0.9.78.54

## Ausgangslage
GitHub Actions Run #886 (`MID-Release aus ZIP installieren und veröffentlichen`) baute v0.9.78.53 mit TypeScript 7.0.2 und Vite 6.4.3 erfolgreich. Anschließend schlugen 7 von 675 Regressionstests fehl.

## Diagnose
Alle sieben Fehler waren veraltete statische Testverträge, nicht Build- oder Laufzeitfehler:

- `test-current-more-hazard-caption-08242.mjs` – erwartete einen bereits bewusst entfernten Hilfstext.
- `test-ensemble-resume-refresh-097619.mjs` – verglich eine exakte Quelltextzeichenfolge und berücksichtigte den neuen `warningEnsemble`-Reset innerhalb desselben `if(!hadWeather)`-Blocks nicht.
- `test-hazard-hour-direction-08189.mjs` – erwartete den alten angehängten Open-Meteo-Disclaimer.
- `test-hazard-validity-08185.mjs` – erwartete die frühere deterministische Tooltip-Formulierung.
- `test-hazard-wind-direction-08187.mjs` – erwartete den alten angehängten Open-Meteo-Disclaimer.
- `test-hazard-wind-direction-inline-08188.mjs` – erwartete den alten angehängten Open-Meteo-Disclaimer.
- `test-warning-current-summary-disclosure-09657.mjs` – erwartete entfernte Hilfstexte und die frühere Fragment-Markupform.

## Lokale Reprüfung
Die sieben zuvor fehlschlagenden Tests wurden nach der Korrektur erneut ausgeführt und bestanden. Für die drei isolierten TypeScript-Warnrichtungstests wurde lokal wegen eines Container-Transport-Timeouts beim `npm ci` ein reiner Prüfshim verwendet, der ausschließlich die vom globalen TS5.8 noch unbekannte CLI-Option `--ignoreConfig` entfernt und externe TypeRoots ausblendet; der Release-Testcode selbst bleibt unverändert TS7-kompatibel.

Der vollständige TypeScript-7-/Vite-Build wurde nicht erneut lokal behauptet: die Paketinstallation in dieser isolierten Umgebung brach per Transport-Timeout ab. Entscheidend für die Diagnose ist, dass GitHub #886 denselben Produktionscode bereits erfolgreich mit TS7 und Vite gebaut hatte und erst danach ausschließlich an den sieben oben genannten Regressionen stoppte.

## Ergebnis
- 7/7 zuvor fehlschlagende Regressionen lokal korrigiert und bestanden.
- Produktionscode der Warn-/Ensemblelogik funktional unverändert.
- Versions-/Baseline-/Worker-/Service-Worker-Synchronisierung auf 0.9.78.54 abgeschlossen.
- Das finale unversionierte Professional-ZIP wurde nach Neuerstellung erneut entpackt und auf Archivintegrität, Versionskonsistenz sowie die sieben korrigierten Regressionen geprüft.
- Das Worker-ZIP enthält ausschließlich `worker.js`; dessen Inhalt ist bytegleich mit `worker.js` im Professional-ZIP.

# MID Test Report 0.9.78.58

Ausgangsbefund aus GitHub-Actions-Run #889:

- `npm ci`: erfolgreich;
- Produktionsabhängigkeitsaudit: erfolgreich;
- TypeScript 7.0.2: erfolgreich;
- Vite 6.4.3 Produktionsbuild: erfolgreich;
- Abbruch erst in der Regressionssuite: 5 von 677 Tests fehlgeschlagen.

Alle fünf Fehler verlangten den vor 0.9.78.55 verwendeten lokalen 24-h-Hazardadapter (`summarizeDwdWarnings`, `DwdWarningSample`, `DwdWarningSignal`, `shortTermHourWarningSample`). Der Produktivcode nutzt inzwischen absichtlich den appweiten `hazards(...)`-/`HazardItem`-Pfad, um Warnkarten und 24-h-Hazard-Leisten zeitlich und fachlich synchron zu halten.

Nach Aktualisierung auf den neuen Vertrag bestehen alle fünf zuvor fehlschlagenden Regressionen lokal. Der Test `test-weather-profile-pressure-hazards-09656.mjs` prüft zusätzlich ausdrücklich, dass der alte lokale Cockpit-Hazardpfad nicht wieder eingeführt wird.

GitHub #889 belegt bereits den erfolgreichen vollständigen TypeScript-/Vite-Build desselben Produktionscodes; 0.9.78.58 ändert gegenüber diesem Build ausschließlich Regressionstests, Versions-/Baseline-Metadaten und Dokumentation.

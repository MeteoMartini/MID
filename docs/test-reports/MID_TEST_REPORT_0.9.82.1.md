# MID v0.9.82.1 – Freigabeprüfung

## Ausgangslage
GitHub Actions #939: Produktionsbuild und TypeScript-Prüfung erfolgreich; 2 von 720 Regressionstests fehlgeschlagen. Betroffen waren ausschließlich `test-travel-planner-08190.mjs` und `test-travel-planner-request-budget-08191.mjs`.

## Korrektur
Die beiden Tests wurden an den optionalen Böenvertrag von v0.9.82.0 angepasst. Produktivcode blieb unverändert.

## Lokale Prüfung
- statische Vertragspunkte der beiden fehlgeschlagenen Tests: geprüft
- regulärer Reiseplaner-Abruf enthält `wind_gusts_10m_max`: geprüft
- Versions-/Baseline-Synchronisierung: geprüft
- Maintenance-Aggregate und Worker-Syntax: geprüft
- finales Release-ZIP erneut entpackt; beide zuvor fehlgeschlagenen Reiseplaner-Tests, ERA5-Seamless-Klimavertrag, Version, Lineage und Aggregatversionen daraus erfolgreich geprüft

Der vollständige TypeScript-7-/Vite-Lauf wird im kanonischen GitHub-Installer reproduzierbar ausgeführt; der unmittelbar vorherige Lauf #939 hatte diesen Teil bereits erfolgreich abgeschlossen.

- Beide isolierten Reiseplaner-TypeScript-Harnesses erkennen die Compiler-Hauptversion; unter TypeScript 7 wird `--ignoreConfig` gesetzt, ältere lokale Compiler bleiben testbar.

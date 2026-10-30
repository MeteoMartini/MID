# MID-C53 · v0.9.85.371 · Fachprüfung Open-Meteo BOM ACCESS-G

## Ausgangslage und externe Belege
- Vor Sourceänderung `main=mid-stable=v0.9.85.370` @ `e27f5256c3c5d41348adbb3a7b85c22c9d473a5a`, vollständige GitHub-Verträge `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `package.json` und fünf aktive Rulesets geprüft.
- Offizielle Anbieterquellen: https://github.com/open-meteo/open-meteo-website/commit/d3801da55f29cfdb29a00d5de4fbb70a2306e487 , https://open-meteo.com/en/docs/historical-forecast-api , Maintainer-Stellungnahme https://github.com/open-meteo/open-meteo/issues/1891 . Enddatum des letzten offenen deterministischen BOM ACCESS-G-Laufes **2025-06-26 18Z**, dokumentierte Nichtaktualisierung seit diesem Zeitpunkt. Kein behaupteter neuer Ausfall im Oktober 2026.
- Eine erlaubte OpenAPI-Modellkennung (sie erscheint weiterhin in manchen statischen Schemas) belegt keine aktuelle Gültigkeit. MID darf `bom_access_global` nicht als aktuellen Konsens-/Fallback-Beitrag zählen. Die Produktiv-API wurde in dieser Änderung nicht mit einer erfundenen erfolgreichen aktuellen Probe bezeichnet.

## Sichere Umsetzung
1. `src/weather-src/00-types-models-search.tsfrag` und generiertes `src/weather.ts`: ausschließlich aktiven deterministischen ForecastCandidate entfernen.
2. `worker-src/00-core-observations.js`, `worker/metar-proxy.js`, `worker.js`: die deterministische Modellzeile aus `FORECAST_FUSION_MODELS` sowie die Aufnahme in `forecastFusionSelection.globalIds` entfernen. Bestehende globale Quellen und 20er-Budget unverändert.
3. Die bisher positive BOM-Behauptung in `test-model-family-consistency-09416.mjs` durch eine explizite Negativassertion ersetzen; historischen KMA-Stale-Guard in `test-openmeteo-watch-ensemble-ui-098468.mjs` unabhängig sichern.
4. Neuer `test-openmeteo-bom-retirement-0985371.mjs` prüft die echte Worker-Funktionsauswahl an drei weit entfernten Standorten, Best-Match, unabhängige globale Rückfallebenen, eindeutige Selektion und Budget, kanonische/generierte Worker- und Forecast-Parität.
5. **Bewusst erhalten:** `bom_access_global_ensemble`, `bom_access_global_ensemble_mean` als getrennte Ensemble-Produkte und `bom-access-s2` in der saisonalen C3S-Verarbeitung; andere historische Forecast-Artefakte bleiben unverändert. `Missing` wird nicht durch künstliche Nullen ersetzt.
6. Zwei verbindliche Regressionsinventare enthalten neu 1049 Tests; alle Versionsspiegel, iOS Build 372 und Dokumentations-/Release-Dateien aktualisiert.

## Getrennte Prüf- und Releasepflichten
Noch offene unabhängige Arbeiten: #352 RUC-Frische-/Vollabnahme, #508 Anzeigepräferenzen, #509 C-LAEF/INCA, #510 amtliche Schneemessungen und #405 übrige Open-Meteo-Verträge. GeoSphere AROME endet nach der Upstream-Ankündigung am 04.11.2026; **kein** unvalidiertes `geosphere_claef_austria` oder `geosphere_seamless` in den produktiven Modellkatalog aufnehmen. Ein upstream Pull Request ist kein bestätigtes API-Payload.
Source-Gate, kompletter Build/Regressionen, Pages/Worker und Stable erst nach überprüften CI-Run-/SHA-Belegen als erfolgreich kennzeichnen. Kein künstlicher Browser-/Geräte- oder echter iOS-Abnahmebericht. Kein GitHub-Override, keine direkten `main`-/`mid-stable`-Writes.

# MID Audit 1.0 – unabhängige Referenzdaten sind parameterweise gültig

**QA-Spezialdraft vom 17.11.2026**. Veröffentlichtes `main=mid-stable=ee70a92ae6ed83d3fa46445f4941e3db8b8675d4` = `v0.9.85.487` nach erfolgreich beendetem `install-mid.yml`-Run 44107815367. **Kein Merge, keine Ready-/Releasefreigabe.** Ausgangspunkt: Original-PDF `20261117_MID-Audit(1).pdf`, S. 4–5 (unabhängige Messverifikation, Unsicherheit und physikalische Plausibilität). Frühere Lösung #895 basierte noch auf .486 und wurde **nicht** als vollständige Datei übernommen.

## Exakter Quellbefund
`migrateReference` kappte negative/ungültige Niederschlagsmengen auf 0 mm. `migrateStore` verwarf sogar bei gültigen Böen oder Temperatur unvollständige Zeilen, wenn Tmax/Tmin/Regen nicht sämtlich numerisch waren. `modelParameterErrors`, `calibrationBins` und `modelBiases` konnten anschließend fehlende Beobachtungen durch JavaScript-Koerzierung oder NaN-Summen als reale Null-/Fehlerfälle behandeln. Das bewirkt falsche Brier-Proben, Parameterfehler oder verzerrte lokale Modellbias-Korrekturen.

## Lösung und Grenzen
- `src/twinObservationEvidence.ts`: reine Guardfunktionen für tatsächlich finite, nichtnegative Messwerte und endliche Tmax>=Tmin; echte 0 mm bleiben valide, meteorologische Extreme werden nicht ungeprüft auf Grenzwerte gekappt.
- `src/forecastVerification.ts`: `migrateReference` übernimmt nur echte Finite-Messwerte, ungültige Daten bleiben intern `NaN`. `migrateStore` erhält Tage mit wenigstens einem gültigen Messparameter, ohne den Typ/die Qualität der unabhängigen Quellen umzudeuten. `modelParameterErrors`, `calibrationBins` und `modelBiases` verlangen jeweils beide gültigen Parameterwerte; fehlender Regen sperrt **nur** Regen/Brier/Kalibrierung, nicht gültige Böen/Temperatur. Die Bias-Schrumpfung verwendet die Anzahl tatsächlich gültiger **Parameterpaare** statt aller Tage.
- `scripts/test-paired-verification-0985311.mjs`: Bestehende unveränderte Paired-Fairness-Assertions behalten die echte Prognose-PoP- und die neuen Beobachtungs-Guards beim AST-Extrahieren. Keine Abschwächung.
- `tests/unit/mid-audit-observed-nodata-qa.test.ts`: 7 synthetische unabhängige Fälle mit 2 Regen-/PoP-, 3 Temperatur-, 7 Böenpaaren, aus einer originalen v3-Archivzeichenfolge; vier-plus Regressionstests für NoData, reale 0 mm, Extreme, inkonsistente Temperatur, endliche lokale Bias-Korrekturen.
- Diese Dokumentation.

**Nicht geändert**: WMO/DWD-Warnungen, Live-Prognosedaten, Zeit-/Modelllaufsemantik, Radar/Nowcast, Archive-Schema, Netzlast, CSS/Responsive-Markup, iOS, Worker, Rulesets, Release-Bot, Versionsspiegel. Bestehende `isVerifiableTwinRainProbability`-Prüfung (#886) und `isFullDayForecastEvidenceIssuedBeforeDay` (#890) sind erhalten. Gesonderte LeadHours-Validierung #892 bleibt eigener Draft.

## Offene methodische Einschränkungen
`inferRegime` ist eine breit genutzte Meteorologiefunktion und verwendet bei fehlendem Regen interne Fallbacks. Das ist **keine echte Trockenreferenz**. Die vorliegende Änderung sichert unabhängige Parameter-Scores und lokale Bias-Korrekturen ab; Wetterlage-Stratifizierung fehlender Regenbeobachtungen muss gesondert geprüft und mit Forecast-Regime-Vertrag abgeglichen werden. Bei Legacy-Key-Migration kann `readStore` weiterhin auf v3 migrieren: vor jeder Produktionsfreigabe vollständigen Export-/Import-/Roundtrip-/Idempotenzvertrag prüfen; archivierte Rohdatei-Nachweise aus der Testfixture bleiben unverändert, dies ist keine Behauptung über jeden Legacy-Writeback.

## Reproduzierbare QA
Pflicht: Draft-CI/TypeScript/Vitest/V8, `scripts/test-paired-verification-0985311.mjs`, `tests/unit/mid-audit-observed-nodata-qa.test.ts` und bestehenden #886/#890-Archivsuites, Source/Core/Heavy/Review/Installer/Worker/Pages/Stable-Gates erst nach selektivem Intake auf dem finalen LC-/Release-SHA. Vor Intake neue SHAs, Regeln, parallele PRs und vollständigen Handoff erneut lesen. Browser-/native iOS-/VoiceOver- oder reale DWD-Prognose-Skill-Tests nicht vortäuschen. Kein zusätzlicher Client-Render oder Datenabruf.

## Wissenschaftliche Einordnung
ECMWF Forecast Evaluation https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation ; ECMWF „Behind every forecast: millions of observations we trust“ https://www.ecmwf.int/en/about/media-centre/focus/2026/behind-every-forecast-millions-observations ; ECMWF local recommendations https://www.ecmwf.int/en/elibrary/75847-recommendations-verification-local-weather-forecasts .

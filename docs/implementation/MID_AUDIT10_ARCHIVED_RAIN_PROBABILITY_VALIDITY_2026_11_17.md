# MID Audit 1.0 – gültige archivierte Wahrscheinlichkeiten / sichere Kalibrierung

**Datum:** 17.11.2026. **Base:** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` · v0.9.85.486 · fünf aktive Rulesets. **DRAFT, NO READY/MERGE/RELEASE.**

## Wissenschaftlicher Befund
Aus Nutzer-Audit 17.11.2026 S. 4 „Verifikation fehlt sichtbar“, S. 5 „Physikalische Plausibilitätsprüfung“ und S. 6 Fallback-/NoData-Standards. In `src/forecastVerification.ts` verwendet der Brier-Pfad `clamp(prediction.probability/100,0,1)`, und `calibrationBins` übernimmt Archivwerte via `clamp(prediction.probability,0,100)` ohne finite/Typ-/Bereichsgate. JSON serialisiert `NaN` zu `null`; `Math.max(0,null)` ergibt 0. Ein ungültiger Rohwert wird so zu scheinbar gültigem 0 % Niederschlagsereignis. Ungeprüfte Zeichenketten wie `'unbekannt'` können zu `NaN` führen, worauf die Kalibrationsklasse `buckets[NaN]` undefined und das UI/Report einen Fehler werfen kann.

Unabhängiger externer Standard: ECMWF Probabilistic Forecast Verification, https://confluence.ecmwf.int/pages/viewpage.action?pageId=250026294; JMA 2026 `Verification Indices for Probability Forecasts`, https://www.jma.go.jp/jma/jma-eng/jma-center/nwp/outline2026-nwp/pdf/outline2026_Appendix_A.pdf. Nur numerische Wahrscheinlichkeiten in [0,100] auf der exakt gleichen Ereignis-/Akkumulations-/Beobachtungsreferenz auswerten. Fehlerhafte Werte dürfen keine Fehl-/Treffer-Stichproben erzeugen.

## Kleine isolierte Korrektur
- `src/twinProbabilityValidity.ts`: reine, O(1)-gültige Zahlprüfung inklusive 0 und 100.
- `src/forecastVerification.ts`: Brier-Fehler pro Parameter und tägliche Kalibrationsbins verlangen dieselbe gültige Wahrscheinlichkeit. Kein Clamping/NoData→0 bei archivierten Daten; invalid wird für **diesen Parameter** ausgeschlossen. Andere tatsächlich beobachtete Parameter bleiben auswertbar. `probabilityKind`-Semantik und unabhängige Messreferenzfilter unberührt.
- `tests/unit/mid-audit-archived-rain-probability.test.ts`: Tests für Null/string/NaN/Infinity/negative/>100; echte 0/100; synthetisches unverändertes v3-Archiv mit sieben Tagen, von denen **nur zwei** gültige Niederschlagswahrscheinlichkeiten besitzen. Prüft Brier .5, nur zwei Fälle, keine Kalibrationsklasse mit NaN oder Laufzeitfehler.
- Diese SHA-gebundene Dokumentation.

**Unverändert:** `ForecastVerificationReport`-/Archiv-/Worker-/API-Schema, Wetterwerte, Warnungen, geschützte Version, Fusionsgewichte, Gewitter-/Radarlogik, CI-/Release-Gates und CSS. Kein zusätzlicher Netzwerkverkehr, keine neue Dependency, keine UI-Schichten. Die bereits existierende KPI-Aussage #885 und Quellenfrische #884 bleiben separate, disjunkte PRs.

## Abnahme
Unit/Source-Regressionen + bestehende `scripts/test-weather-twin-stages-0800.mjs`, `scripts/test-model-skill-twin-consistency-09600.mjs`, `scripts/verify-paired-verification-browser-0985311.mjs` auf demselben HEAD. Browser- und echte iOS-/VoiceOver-/520-/320px-/200%-Zoom-QA nicht durch Unit-Läufe ersetzen. **Kein behaupteter empirischer Skillgewinn.** Vollständiger LC-Intake mit SHA-/Blob-Readback und Core/Heavy/Source/Review/Installer/Worker/Pages/Stable-Gates nach bewährtem Releasepfad.

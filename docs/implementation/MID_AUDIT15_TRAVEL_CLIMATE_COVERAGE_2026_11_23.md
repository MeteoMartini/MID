# MID Audit 1.5 · research-only Reise-Klimareferenz/NoData-Oracle (2026-11-23)

**Status: QA DRAFT ONLY – keine Änderung am MID-Produktionscode, keine Releasefreigabe.**

## Belegte Ausgangslage

GitHub \`MeteoMartini/MID\`: \`main=mid-stable=331fffff081303e1c597badddfa4ae41c4b4e0f0\`, veröffentlichte \`v0.9.85.513\` (package, MID_BASELINE, contract registry, releases/latest), fünf aktive Rulesets. Vor Erstellung wurden \`AGENTS.md\`, \`MID_SOURCE_OF_TRUTH.md\`, \`MID_TRAVEL_CENTER_FORECAST_FUSION_CONTRACT.md\`, \`MID_FORECAST_CONSISTENCY_CONTRACT.md\` und offene PRs geprüft. Original-Audit-PDF \`20261117_MID-Audit(1).pdf\`, Seiten 2–7. Bestehendes P1-Issue: #999, übergeordneter Handoff #422.

Veröffentlichter Quell-Blob \`src/travelPlanner.ts\` = \`b3ad2cd7a40e725717e3149aba20179280116872\`. \`summarizeTravelPeriod\` behandelt für Summen nicht-endliche Felder als Null und verwendet stets den Gesamttagedivisor; so kann 20 °C + missing als 10 °C erscheinen. \`aggregateTravelClimate\` berechnet die Gültigkeitsjahre über \`max(Temperatur-/Regen-Feldzahl)\` statt pro Parameter. Physikalisch unzulässiger negativer Regen und Schnee gelangen über generisches \`addFinite\` in Klimamittel. \`mode(codes)\` beginnt mit Wettercode 3, sodass eine komplett leere Wettercode-Verteilung scheinbar „bedeckt“ werden kann. Beim JSON-Cache-Roundtrip wird JavaScript-\`NaN\` zu \`null\`; \`Number(null)\` in späteren Aggregaten wird dann zu 0.

Diese Befunde sind **Quellcode- und synthetische Logiknachweise**, keine gemessene Live-App-Auswirkung. Realistische Quellenlücken können an unterschiedlichen Stellen entstehen; sie wurden hier nicht durch echte Archive belegt.

## Isolierter, ausführbarer Lösungsbaustein

- \`tools/audit/travelClimateCoverageEvidence.ts\`: **nur QA-Oracle**, keine Runtime-Integration, kein Fetch, kein Timer und keine Speicherung. \`assessTravelFieldCoverage\` berechnet die per-Feld-Abdeckung \`n/N\`, gibt \`completeSum\` und \`completeMean\` ausschließlich für vollständige Intervalle aus und kennzeichnet partielle Mittel ausdrücklich \`observedMean\`. \`assessTravelClimateYears\` prüft unterschiedliche gültige Einzeljahre **1991–2020**; Mehrfachbelege desselben Jahres werden nicht doppelt gewertet. 20/30 ist eine transparent deklarierte, **nicht vollständige** Referenz; kein erfundener WMO-Qualitätsstatus.
- \`tools/audit/verifyTravelClimateCoverage.mjs\`: 14 deterministische Smoke-Checks mit \`node --experimental-strip-types tools/audit/verifyTravelClimateCoverage.mjs\` auf **Node 22.16**.
- Strenge Zahlentypen: \`null\`, \`undefined\`, Text-\`0\`, \`NaN\`, \`Infinity\`, \`false\` ≠ 0. Nicht-negative Menge, Schnee, Wind, Sonnenschein; Wahrscheinlichkeit 0–100%; WMO-Code als Integer 0–99; Temperatur ohne ungeprüftes Kappen. Dies ist reine QA-Typologie, **keine** automatische Korrektur von Originalquellen oder offizielle Qualitätsbewertung.
- **Zeitaufwand**: Feldscan O(N) / O(1) zusätzlicher Speicher; Klima-Jahresscan O(N) / O(30) mit begrenzter Jahresschlüsselmenge. Keine zusätzliche API/Abhängigkeit/CSS/Graphik. Für einzelne Reisetage numerisch praktisch konstant.

## Abnahmegrenzen und Vorbehalte

1. Die isolierten **14/14 Checks liefen lokal** mit Node v22.16.0 an demselben TypeScript-Modul; dieser GitHub-Draft benötigt einen unabhängigen Originalblob-Readback und SHA-gebundenen Node-Test. Weder volles MID-CI noch Browser, TestFlight, iOS, VoiceOver oder echte ERA5-Payloads wurden hier ausgeführt.
2. 29. Februar ist ein Sonderfall: Von 1991 bis 2020 gibt es nur acht echte Schalttage. Die QA-Jahresprüfung gibt darum \`insufficient\`; eine klimatologische 29.02.-Interpolation muss **separat als abgeleitet** kenntlich sein, niemals als 30 gemessene Einzeljahre.
3. \`observedMean\` ist ein deskriptiver Teilstichprobenwert und darf **nicht** als unqualifizierter Reisewert, Vollperiodensumme, Optimierungsziel oder „Bedingungen erfüllt“ verwendet werden. Bei unvollständiger Abdeckung: „Nicht verfügbar“, optional „x/y Tage belegt“.
4. Die 1991–2020-Jahresregel ist **nicht** für EC46-/GEFS-/Saison-Vorhersageintervalle anzuwenden; solche Modelle benötigen eigene native Lauf-/Gültigkeits-/Akkumulations- und Modellklimatologie-Verträge. ERA5-Seamless ist keine unabhängige Stationsmessung.
5. Es fehlt absichtlich die echte produktive Adapter- und UI-Verdrahtung; diese nach laufendem Source-Train #996 nur auf dann **neu bestätigter Stable-SHA** mit gezieltem Test-/Regressionsintake in #999 ergänzen. **Nicht** die historische Datei \`src/travelPlanner.ts\` über neuere Änderungen kopieren.
6. Für stabile App-Implementierung zusätzlich Originaldaten-Metadaten \`timezone, utc_offset_seconds, time, daily_units\`, 30-Jahres-Gitter-/Höhenkennzeichen, Cache-Fingerprint und eine fachlich nachvollziehbare Einheitenvalidierung führen. Caches mit unklarer Zeitbasis oder Nullkoerzierung invalidieren; nie stille Datenmigration.
7. UI-Abnahme: 320, 390, 430, 834, 1440 px; 200% Zoom, Touch-/Keyboard-/Fokus-/Screenreader, Light/Dark, Web/iOS/Widgets/Export. Bestehende \`scripts/test-travel-center-forecast-fusion-098429.mjs\`-Regression und Release-Gates unverändert.

## Vergleichs- und Quellenbezug

- Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api – Tagesakkumulation, Zeitstempel/Offsets, ERA5-Herkunft.
- ECMWF Forecast Evaluation: https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation – echte Validierungsmetriken und Referenzvergleich.
- MID \`MID_TRAVEL_CENTER_FORECAST_FUSION_CONTRACT.md\`, \`MID_FORECAST_CONSISTENCY_CONTRACT.md\`; WMO-/DWD-Grundsatz: Missing nie als gemessenen Nullwert ausgeben.
- Ähnliche Premium-Wetteroberflächen verwenden kompakte Frontdarstellung plus aufklappbare Quellen-/Unsicherheitsdetails. Das QA-Modul erzeugt **keine** zweite UI oder Animation.

**Leit-Reihenfolge:** P0 #541 RUC; laufenden #996/.514 nach echten Gates abschließen; **#999** mit diesem Oracle auf neuem Stable/CI/Originalantworten qualifizieren; keine konkurrierende Reiseimplementierung. #914/911/922/923/964 bleiben eigenständige Fach- und Daten-QA-Owner. Dieser QA-Branch darf weder Ready noch Merge/Deploy/Stable selbstständig auslösen.

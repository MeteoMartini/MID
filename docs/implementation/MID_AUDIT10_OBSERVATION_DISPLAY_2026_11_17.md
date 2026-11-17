# MID Audit 1.0 – Beobachtete Datenlücken im Wetterzwilling ehrlich darstellen

2026-11-17 | QA-DRAFT, kein Ready/Merge/Release.
Verifizierte Grundlage: main=mid-stable 9fe4dfbcdfd5a1f8fec55efa868e22110a612953 / v0.9.85.488, fünf aktive GitHub-Rulesets, AGENTS.md, MID_BASELINE.json, MID_SOURCE_OF_TRUTH.md und relevante Forecast-/Datenverträge.

## Wissenschaftlicher PDF-Auditbefund
Original: 20261117_MID-Audit(1).pdf, S. 4–5 (unabhängige lokale Beobachtungsverifikation / physikalische Plausibilität) und S. 6 (sichtbare Datenlücken). Die bereits veröffentlichte NoData-Migration #897 bewahrt Referenztage, für die z. B. nur eine gültige Böe vorliegt. ForecastVerificationPanel.tsx stellte fehlende Temperaturen aus internen NaN-Werten jedoch als NaN–NaN °C dar und hängte an einen fehlenden Regenwert eine Mengeneinheit an. Fehlender Regen ist kein tatsächlich gemessener 0-mm-Tag.

## Minimale Korrektur
- src/twinReferenceReadout.ts: pure O(1) Darstellung anhand bestehender physikalischer Input-Guards. Fehlende Temperatur => Temperatur nicht gemessen; fehlender Regen => Niederschlag nicht gemessen; reale 0 mm => 0 mm; echte Regenextrema bleiben unverändert.
- src/ForecastVerificationPanel.tsx: nur den einen Referenztext auf denselben Formatter umstellen; Source-Label und responsive DOM-/CSS-Struktur unverändert.
- tests/unit/mid-audit-twin-reference-readout.test.ts: sechs Regressionsfälle für NaN, null, negative Mengen, Temp-Pair, echte 0 mm und 250 mm und Quell-/JSX-Wiring.
- docs/implementation/MID_AUDIT10_OBSERVATION_DISPLAY_2026_11_17.md: dieses QA-/Provenienzprotokoll.

## Abgrenzung und Risiken
Die auf dem Panel angezeigte Wetterlage ist aus capture.predictedRegime (PROGNOSE) abgeleitet, nicht aus der gemessenen Referenz. Die separate inferRegime-Funktion faltet fehlenden Regen auf 0 mm; eine explizite Referenzwetterlagen-Provenienz ist als gesonderter Auditpunkt offen, darf aber nicht über diesen reinen Anzeige-Fix in die Skill-Metrik eingeschleust werden.

Keine Mess-/Prognose-/Archiv-/API-/Warn-/Karten-/Worker-/iOS-Änderung, kein Fetch, neuer React-State oder CSS. Ein echter Browser-/iOS-/VoiceOver-/WCAG-/Perf-Nachweis bleibt erforderlich. Nicht direkt in laufenden LC #902-Release-Train integrieren; neuer autorisierter Branch auf dann aktuellem Stable, SHA-gebundener Intake und vollständige Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Gates.

Fachlicher Kontext: ECMWF Observing System Monitoring (2026) und WMO Guide to Climatological Practices zur Unterscheidung fehlender von tatsächlich gemessenen Nullmengen.
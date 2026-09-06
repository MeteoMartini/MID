# MID v0.9.79.8 – CI-Regressionsfix Run #920

## Befund

Release-Run #920 (`129191bad92818f3d315aed8ef0f5f507edb6806`) absolvierte `npm ci`, Dependency-Audit, TypeScript-Prüfung und den vollständigen Vite-Produktionsbuild erfolgreich. Der Abbruch erfolgte erst in `test:regressions`: 5 von 708 Tests verwendeten noch starre Quelltextmuster aus der Dashboard-Struktur vor dem optionalen Bottom-Bar-/Planen-Hub-Umbau.

## Korrektur

- `test-best-match-sunshine-suffix-strategy-08350.mjs`: Current-Wiring auf die heutige `currentDetails`-Struktur angepasst; `displayHours`/`displayDays` bleiben zwingend.
- `test-forecast-precipitation-support-083317.mjs`: identische Anpassung an die neue Current-Fokusstruktur; zentrale reconciliierte Stunden bleiben Pflicht.
- `test-fourteen-day-pill-favorite-tap-097866.mjs`: Mindestversionsprüfung auf numerischen SemVer-Vergleich umgestellt, damit spätere 0.9.79+-Releases den v0.9.78.66-Vertrag weiterhin erfüllen können.
- `test-planner-section-compact-event-controls-09450.mjs`: bestehende sichtbare Planer-Sektion plus optionalen `ModernPlannerHub` als gültige aktuelle Struktur geschützt.
- `test-short-term-modules-qr-sync-08220.mjs`: Dashboard-Einbindung auf aktuellen Planer-Hub-/Horizont-Navigationspfad aktualisiert; Kurzfrist-, Modul-, Gewitter-Windeinheits- und QR-Verträge bleiben unverändert.

## Unverändert

Keine Änderung an App-Fachlogik, Forecast-Fusion, Radar/Satellit, Standardradarfarben, Parametern, Einheiten oder Worker-Fachlogik.

## Verifikation

Die fünf in Run #920 fehlgeschlagenen Regressionen werden einzeln erneut ausgeführt. Der finale Release wird zusätzlich strukturell entpackt und auf Versionskonsistenz geprüft.

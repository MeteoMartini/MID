# MID v0.9.76.34 – CI-Hotfix für Run #805

## Ursache
GitHub-Run #805 scheiterte nach erfolgreich bestandenem TypeScript-/Vite-Produktionsbuild ausschließlich an sechs veralteten Regressionstests des 24-h-Wetterprofils. Die Tests enthielten noch Geometrie- und Strichstärkenwerte aus dem Layout vor v0.9.76.33.

Betroffen waren:
- `test-cockpit-meteogram-overlay-scale-09186.mjs`
- `test-mid-weather-profile-layout-09323.mjs`
- `test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `test-weather-profile-pressure-hazards-09656.mjs`
- `test-weather-profile-rolling-openmeteo-audit-09653.mjs`
- `test-weather-profile-story-axis-09750.mjs`

## Korrektur
Die sechs Tests wurden an den tatsächlich freigegebenen v0.9.76.33-Vertrag angepasst:
- Wetterpiktogramm-Zeile: `y={78}` statt `y={83}`.
- Wolkenkopf: `cloudTop=101`; Wolkenbänder bleiben zwischen Wetterpiktogrammen und Temperatur.
- Temperaturbereich: `tempTop=150`; die Kollisionsprüfung berücksichtigt nun Wetterpiktogramme → Wolkenbänder → Temperaturbahn.
- Luftdruckspur: `pressureTop=498,pressureBottom=550`.
- Temperaturkurve: `stroke-width:2.75` statt der älteren `3.35`.

## Bewusst unverändert
- Der Produktcode aus v0.9.76.33 wird nicht zurückgebaut.
- Der stundenweise Tageswechsel 23:00 → 00:00 bleibt bestehen.
- Die Wolkenbänder bleiben im oberen Profilkopf.
- Die dünneren Temperaturkurven bleiben bestehen.

## Validierung
Alle sechs in GitHub-Run #805 tatsächlich fehlgeschlagenen Regressionen wurden lokal erneut ausgeführt und laufen grün. Zusätzlich bleiben die v0.9.76.33-Regressionsprüfung `test-weather-profile-stepper-layout-097633.mjs` und die Stundenwechsel-Regression grün.

Der vollständige lokale 608er-Lauf ist in der Containerumgebung ohne installierte `typescript-strada`-Dev-Abhängigkeit nicht repräsentativ; der GitHub-Run #805 selbst belegt jedoch bereits, dass TypeScript 7.0.2, Vite 6.4.3 und alle übrigen Regressionen bis auf exakt diese sechs Tests erfolgreich waren.

## Worker
Keine fachliche Worker-Änderung; kein manueller Worker-Upload erforderlich.

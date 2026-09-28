# MID Test Report 0.9.78.70

## Neue Regression

`scripts/test-confidence-event-symbols-097870.mjs` prüft:

- ein meteorologisch `high` bewerteter Tag bleibt trotz `dataQuality=poor` Teil eines hohen Konfidenzfensters,
- `high → unknown` am Prognoserand wird nicht als meteorologischer Konfidenzabfall interpretiert,
- rein nachlaufende `unknown`-Tage werden als Randabdeckung erkannt,
- Prognose-Kompass nutzt `Hohe Prognosekonfidenz`, 0–100-Index und getrennte Randtag-/Datenbasisterminologie,
- 14d-Badge zeigt Index bzw. `teilw.` am Rand,
- 14d-Mikrometriken behalten zugängliche Textbezeichnungen bei Icon-only-Sichtdarstellung,
- Event-Intervallsemantik lässt einen reinen Niederschlagscode am Stundenende ohne Intervallniederschlag nicht rückwirkend die ganze vorangehende Stunde als Regen erscheinen,
- Event-Stundenkarte nutzt Wind-/Sonnensymbolik,
- redundante Widget-Sonnenscheintextzeile bleibt entfernt.

## Aktualisierte historische Regressionen

Die historischen Kompass-Wordingtests wurden auf den neuen fachlichen Vertrag aktualisiert; alte Texte wie `Gut vorhersagbare Zeiträume` werden nicht wieder in die UI eingeführt.

Lokal bestanden:

- `test-confidence-event-symbols-097870.mjs`,
- `test-professional-ui-wording-08337.mjs`,
- `test-forecast-compass-secure-range-082713.mjs`,
- `test-compass-scenario-wording-08304.mjs`,
- `test-forecast-confidence-layout-090505.mjs`.

Zusätzlich wurden alle geänderten TypeScript-/TSX-Dateien mit der lokal verfügbaren TypeScript-Transpilation syntaktisch geprüft.

## Dependency-/Vollbuild-Situation

Ein frisches lokales `npm ci` wurde gestartet, konnte aber wegen DNS/Registry-Fehlern des Containers (`EAI_AGAIN` gegen registry.npmjs.org) nicht vollständig installiert werden. Deshalb wird lokal **kein vollständiger TS7/Vite-/687+-Regressionslauf behauptet**. Der unmittelbar vorherige Produktionsstand 0.9.78.68 hatte in GitHub Run #903 TypeScript 7 und den Vite-Produktionsbuild erfolgreich durchlaufen; 0.9.78.70 erhält deshalb zusätzlich fokussierte Regressionen für jede jetzt geänderte Logik.

Vor ZIP-Ausgabe werden Version, Baseline, Aggregate, Worker-Syntax, Importziele, neue/historisch betroffene Regressionen und ZIP-Reextraktion erneut geprüft.

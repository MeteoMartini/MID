# MID v0.9.40.1

## CI-/Regression-Fix für Rapid-Update-Modelle

Die beiden mit v0.9.40.0 eingeführten RUC-Regressionsprüfungen verwendeten feste Modelllaufzeiten vom 10.08.2026. Dadurch wurden die Mock-Läufe einige Stunden später im GitHub-Actions-Runner von der produktiven Frischeprüfung korrekt als veraltet abgewiesen, obwohl die RUC-Implementierung selbst funktionsfähig war.

### Korrektur
- Radar-/Regionalmodell-Phasentest erzeugt Zielzeit, Modellinitialisierung und Stale-Fall relativ zu `Date.now()`.
- DWD-ICON-D2-RUC-Metadatentest erzeugt die drei Apache-Indexläufe, deren Änderungszeit und den `s/`-Pfad relativ zur jeweiligen Testlaufzeit.
- Neuer Regressionstest `test-ruc-time-robustness-09401.mjs` verhindert erneut hart codierte aktuelle Modellläufe.
- Produktive RUC-, Radar-, Worker- und Forecast-Logik bleibt gegenüber v0.9.40.0 unverändert.

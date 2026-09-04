# MID Test Report v0.9.78.48

## GitHub-Befund #881
- Release-ZIP sicher entpackt: erfolgreich.
- `npm ci`: erfolgreich.
- Produktions-Dependency-Audit: erfolgreich (OSV-Fallback nach npm-Bulk-Timeout).
- TypeScript 7.0.2: erfolgreich.
- Vite 6.4.3 Produktionsbuild: erfolgreich.
- Regressionen: 19 von 669 fehlgeschlagen.

Die 19 Fehler waren Regressionstest-Kompatibilitätsfehler nach der neuen zentralen Niederschlagsintervall-Abhängigkeit bzw. veraltete Quelltext-Erwartungen. Der Produktionsbuild selbst war erfolgreich.

## v0.9.78.48
Die 19 betroffenen Tests wurden auf den aktuellen Forward-Slot-, 7d-Beschriftungs-, Wasser-, Solar-, Radar- und Höhenwettervertrag migriert. Isolierte `forecastFusion`-Harnesses kapseln `precipitationPresentationHours` explizit.

Von den 19 in #881 fehlgeschlagenen Tests wurden **17/17 lokal ausführbare Tests einzeln grün** nachgeprüft. Die übrigen zwei (`test-appwide-precipitation-and-daily-heat.mjs` und `test-precipitation-form-snow-units-093222.mjs`) verwenden explizit die TypeScript-7-CLI-Option `--ignoreConfig`; ihre in #881 tatsächlich gemeldeten veralteten Quelltextassertionen wurden korrigiert, können mit der lokal vorhandenen TypeScript-5.8-CLI aber nicht vollständig ausgeführt werden. GitHub bleibt hierfür das verbindliche TypeScript-7-Gate.

Die Suite erkennt mit der neuen Meta-Regression nun **670 Regressionstests**.

## Worker
Keine fachliche Worker-Änderung. Worker wird nur versionssynchron mit ausgeliefert.

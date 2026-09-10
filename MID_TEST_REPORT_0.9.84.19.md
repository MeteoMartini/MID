# MID Testreport v0.9.84.19

Gezielt geprüft und bestanden:
- `test-widget-wind-temperature-export-098419.mjs`: Wind/Böen bleiben exakt zweizeilig; ECMWF-Temperaturfarben sind optional, persistent, kontrastiert und in Standard-Exporten aktiv.
- `test-widget-url-exports-098413.mjs`: alle 12 festen Widget-Live-URL-Varianten bleiben gültig.
- `test-widget-ensemble-selector-098414.mjs`: Ensemble-Widgetvertrag einschließlich migriertem Persistenzschema bleibt gültig.
- `test-appwide-parameter-colors-09779.mjs` und `test-parameter-color-contract-097711.mjs`: bestehender appweiter Farbvertrag bleibt erhalten.
- Versions-, Baseline-, Release-Lineage- und lokale Importprüfung: bestanden; 160 TypeScript-Dateien besitzen vollständige relative Importziele.
- Syntaxprüfung der geänderten TSX-Dateien per TypeScript-Parser: bestanden.
- Worker- und Service-Worker-Syntax: bestanden; `public/service-worker.js` und `public/sw.js` sind identisch.

Die lokale vollständige `npm ci`-Installation konnte in dieser isolierten Arbeitsumgebung wegen eines Transport-Timeouts nicht abgeschlossen werden. Der unmittelbar vorherige stabile Stand v0.9.84.18 wurde jedoch im GitHub-Release-Lauf vollständig mit TypeScript 7.0.2 und Vite gebaut und anschließend als `mid-stable` veröffentlicht. Für v0.9.84.19 werden daher zusätzlich die gezielten Änderungen sowie der finale ZIP-Inhalt regressionsgeprüft; der kanonische vollständige TS7/Vite-Lauf erfolgt beim GitHub-Release.

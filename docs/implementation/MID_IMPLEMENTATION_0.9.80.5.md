# MID v0.9.80.5 – CI-/Release-Hotfix

Stand: 7. September 2026

## Extern

- Der fehlgeschlagene GitHub-Release-Lauf #934 wird gezielt korrigiert. Die App-Funktionen aus v0.9.80.4 bleiben fachlich unverändert.
- Der Schutz gegen abgeschnittene Wetterwerte im kompakten Widget bleibt bestehen; die Prüfung versteht nun zusätzlich die dynamisch gesetzte Böen-Warnstufe.

## Intern

Der GitHub-Lauf #934 hat den TypeScript-Projektcheck und den Vite-Produktionsbuild erfolgreich abgeschlossen und ist erst in drei Regressionstests gescheitert.

- `scripts/test-appwide-precipitation-and-daily-heat.mjs` und `scripts/test-travel-planner-era5-seamless-units-09652.mjs` rufen für isolierte Modulprüfungen `tsc` mit einzelnen Quelldateien auf. TypeScript 7 lädt dabei vorhandene `tsconfig.json` nicht mehr zusammen mit Dateiangaben und verlangt `--ignoreConfig`.
- Beide Testhüllen ermitteln nun die tatsächlich verwendete `tsc`-Hauptversion und setzen `--ignoreConfig` ab TypeScript 7. Damit bleibt der GitHub-Vertrag für TypeScript 7.0.2 korrekt und die lokale Rückwärtskompatibilität zu älteren Compilern erhalten.
- `scripts/test-no-clipped-weather-values-09394.mjs` erwartete noch eine statische Klasse `widgetmeta-wind`. Seit v0.9.80.4 trägt das Widget korrekt eine dynamische Klasse `widgetmeta-wind warning-*`. Die Regression erkennt diese Struktur nun und schützt zusätzlich weiterhin die separate Böenzeile.
- Die produktive Wetter-, Klima-, Hazard- und UI-Logik wurde nicht verändert.
- Maintenance-Aggregate wurden nach der Versionssynchronisierung erneut erzeugt; `worker.js` und `worker/metar-proxy.js` bleiben bytegleich.

## Worker

Keine funktionale Workeränderung gegenüber v0.9.80.4. Ein Cloudflare-Worker-Upload ist nicht erforderlich.

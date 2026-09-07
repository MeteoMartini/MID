# MID v0.9.80.5 – Freigabeprüfung

Stand: 7. September 2026. Ausgangspunkt ist v0.9.80.4; der stabile GitHub-Zweig `mid-stable` stand beim Abgleich weiterhin auf v0.9.80.3, weil Release-Lauf #934 vor dem Installationscommit in der Regressionstufe abgebrochen ist.

## Fehlerbild aus GitHub-Lauf #934

- TypeScript-Projektprüfung: erfolgreich.
- Vite-Produktionsbuild: erfolgreich.
- Regressionen: 717/720 erfolgreich, drei fehlgeschlagen.
- Zwei Fehler: TypeScript 7 TS5112 bei isolierten direkten Dateicompiles ohne `--ignoreConfig`.
- Ein Fehler: veraltete statische Widget-Klassenerwartung trotz vorhandener dynamischer Wind-Warnklasse und vorhandener Umbruch-CSS-Verträge.

## Korrektur

- Direkte TypeScript-Testcompiles setzen `--ignoreConfig` automatisch ab Compiler-Hauptversion 7.
- Die Widget-Nicht-Abschneiden-Regression akzeptiert die fachlich erforderliche dynamische `warning-*`-Klasse und prüft weiterhin Regen-, Wind- und Böen-Unterzeilen.
- Versions- und Maintenance-Aggregate auf v0.9.80.5 synchronisiert.

## Erfolgreiche gezielte Prüfungen

- `scripts/test-appwide-precipitation-and-daily-heat.mjs`
- `scripts/test-travel-planner-era5-seamless-units-09652.mjs`
- `scripts/test-no-clipped-weather-values-09394.mjs`
- Syntaxprüfung der drei geänderten `.mjs`-Dateien
- `scripts/test-versioning.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`
- `scripts/test-maintenance-modularization-09560.mjs`
- `scripts/test-release-lineage.mjs`
- Worker-/Service-Worker-Syntax und Bytegleichheit der beiden Worker-Aggregate

## Umgebung

Eine erneute lokale `npm ci`-Installation wurde durch denselben Container-Transportfehler wie beim vorherigen Stand blockiert. Das GitHub-Protokoll von #934 belegt jedoch, dass Lockfile-Installation, TypeScript-Projektcheck und Vite-Produktionsbuild des fachlich identischen v0.9.80.4-Quellstands erfolgreich waren; die drei nachgelagerten Regressionen sind Gegenstand dieses Hotfixes. Der GitHub-Installer führt beim nächsten Upload den vollständigen TypeScript-7-/Vite-/Regressionstest erneut aus.

## Worker

Keine funktionale Workeränderung; nur Versionssynchronisierung auf v0.9.80.5. Kein erneuter Worker-Upload erforderlich.

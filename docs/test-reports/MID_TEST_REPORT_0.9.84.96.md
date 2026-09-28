# MID v0.9.84.96 – Test- und Releasebericht

## GitHub-Ausgangslage

- `mid-stable`: v0.9.84.95, Commit `bc4c0100f6d7034ee2d1c46461d51dcc1865c139`.
- Installer #1049: erfolgreich.
- DWD RUC preprocessing #541: erfolgreich.
- Spätere Dependabot-/PR-Prüfungen sind vom MID-Installer getrennt und ändern die kanonische Releasebasis nicht.

## Fokussierte Regressionen

Die folgenden für v0.9.84.96 relevanten Verträge wurden lokal erfolgreich geprüft:

- `test-synoptic-startup-ceiling-098496.mjs`
- `test-composite-native-history-navigation-097875.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-composite-visibility-quality-08251.mjs`
- `test-composite-wms-lightning-k3d-wind-08250.mjs`
- `test-german-weather-terminology-performance-098461.mjs`
- `test-startup-splash-preload-097843.mjs`
- `test-synoptic-contour-path-options-097884.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-synoptic-regional-fronts-098488.mjs`
- `test-hyperlocal-fields.mjs`

Dabei werden insbesondere DWD-WMS-Isohypsen, Canvas-Fallback, Front-Canvas, beschleunigter Startpfad, beobachtetes-vs.-modelliertes Ceiling, Kurzfristfusion und Flug-/Eventwetter abgesichert.

## Lokale Vollprüfung – Einschränkung

Die isolierte Build-Umgebung kann `registry.npmjs.org` aktuell nicht per DNS auflösen. Deshalb ist ein frisches `npm ci` und damit der kanonische vollständige lokale Release-Preflight nicht reproduzierbar. Ein partieller Regressionslauf wurde zusätzlich durch die lokal verfügbare TypeScript-5.8-CLI statt der im Release verwendeten TypeScript-7-/Strada-Umgebung begrenzt. Diese Umgebungsfehler werden nicht als bestandene Vollprüfung gewertet.

Die endgültige vollständige TypeScript-/Vite-/Regression-Gate-Prüfung erfolgt deshalb weiterhin fail-closed im GitHub-Installer. Vor Paketübergabe werden Versionsschema, Release-Lineage, Worker-/Service-Worker-Syntax, fokussierte Regressionen, Responsive-Verträge sowie ZIP-Integrität separat geprüft.

## Worker

Keine neue Worker-Fachlogik gegenüber v0.9.84.95. Ein separater manueller Worker-Upload ist für die fachlichen Änderungen in v0.9.84.96 nicht erforderlich.

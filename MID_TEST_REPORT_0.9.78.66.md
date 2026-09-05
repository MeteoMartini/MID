# MID Test Report 0.9.78.66

## Geprüfte Regressionen

- `scripts/test-fourteen-day-pill-favorite-tap-097866.mjs`
- `scripts/test-fourteen-day-orientation-layout-09642.mjs`
- `scripts/test-favorite-quick-strip.mjs`
- `scripts/test-versioning.mjs`
- `scripts/test-release-lineage.mjs`
- `scripts/test-baseline-079526-contract.mjs`

Die neue Regression schützt den finalen einzeiligen 14d-Pillenvertrag in Quell- und Aggregat-CSS sowie die Trennung von Favoriten-Tap und Drag-Schwelle.

## Buildstatus

Die Änderung enthält nur TypeScript-/TSX-Interaktionslogik und CSS. Der vollständige Projektbuild wird zusätzlich im GitHub-Installer validiert. Lokal werden die verfügbaren statischen und versionsbezogenen Regressionen sowie Syntax-/Aggregatprüfungen ausgeführt.

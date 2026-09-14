# MID v0.9.84.101 – Testbericht

## GitHub-Referenz

- letzter erfolgreicher stabiler Stand: v0.9.84.98 / `mid-stable`
- fehlgeschlagener Kandidat: v0.9.84.100
- Installer #1055 / Run `34842845051`
- Fehlerphase: TypeScript-Prüfung vor Vite und Gesamtregressionen
- exakter Fehler: ungenutzte Deklaration `compositeFrontDash` in `src/RadarPanel.tsx`

ZIP-Prüfung, Projektübernahme, Node 22, `npm ci` und Dependency-Audit waren im GitHub-Lauf erfolgreich. Der verfügbare Advisory-Pfad enthielt keine HIGH/CRITICAL-Befunde.

## Lokale fokussierte Prüfungen

Nach Entfernung des toten Helpers bestanden die relevanten Verträge:

- `test-synoptic-phase-pictogram-cleanup-098499.mjs`
- `test-synoptic-regional-fronts-098488.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs`
- `test-bottom-bar-current-persistence-isohypses-098492.mjs`
- `test-radar-phase-echo-recovery-09406.mjs`
- `test-viewport-textflow-098485.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-map-chart-responsive-continuation-098482.mjs`
- `test-overlay-viewport-continuation-098480.mjs`
- `test-ios-floating-bottom-bar-098489.mjs`
- Versionsschema, Release-Lineage und Release-Uploadbudget

Ein zusätzlicher lokaler TypeScript-Quelllauf mit der vorhandenen globalen Compilerinstallation meldete nach der Korrektur **keinen TS6133-Befund** mehr. Wegen fehlender lokaler Projektabhängigkeiten ist dies kein Ersatz für den vollständigen TypeScript-7-/Vite-Lauf im GitHub-Installer.

## Release-Gate

Der vollständige GitHub-Installer bleibt das definitive Gesamt-Gate. v0.9.84.101 ändert gegenüber v0.9.84.100 ausschließlich den toten Helper und Versions-/Dokumentationsmetadaten; keine sichtbare UI-Geometrie oder meteorologische Fachlogik wurde geändert.

# MID v0.9.84.100 – Testbericht

## GitHub-Referenz

- letzter erfolgreicher stabiler Stand: v0.9.84.98 / `mid-stable`
- fehlgeschlagener Kandidat: v0.9.84.99
- Installer #1054 / Run `34841143619`
- Fehlerphase: TypeScript-Prüfung vor Vite und Gesamtregressionen
- exakte Fehler: zwei nicht verwendete Deklarationen in `src/RadarPanel.tsx` (`MemoCompositeFronts`, `SynopticFrontCanvasFallback`)

Der GitHub-Lauf hatte zuvor ZIP-Prüfung, Projektübernahme, Node 22, `npm ci` und Dependency-Audit erfolgreich abgeschlossen. Es gab keine HIGH/CRITICAL-Befunde im verfügbaren npm-Advisory-Pfad.

## Lokale fokussierte Prüfungen

Nach Entfernung der beiden toten Renderer bestanden die relevanten Synoptik-/Phasenverträge, darunter:

- `test-synoptic-regional-fronts-098488.mjs`
- `test-synoptic-phase-pictogram-cleanup-098499.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-bottom-bar-current-persistence-isohypses-098492.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-synoptic-contour-path-options-097884.mjs`
- `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs`
- `test-radar-phase-echo-recovery-09406.mjs`
- Versionsschema und Release-Lineage

Die Viewport-/Readability-Verträge für iPhone-/Telefon-/Tablet-/Desktop-Geometrien werden vor dem Release erneut fokussiert ausgeführt. v0.9.84.100 ändert gegenüber v0.9.84.99 keine sichtbare UI-Geometrie.

## Lokaler npm-Hinweis

Ein erneuter lokaler `npm ci`-Versuch in der isolierten Arbeitsumgebung blieb wegen der dortigen Netzwerk-/Transportbedingungen hängen und wurde beendet. Daher wird kein lokaler vollständiger TypeScript-7/Vite-/Gesamtregressionslauf behauptet. Der vorangegangene GitHub-Lauf #1054 hat jedoch exakt denselben v0.9.84.99-Produktionsstand bis zum TypeScript-Gate reproduzierbar installiert; v0.9.84.100 entfernt genau die beiden dort gemeldeten TS6133-Ursachen und verändert die übrige Produktionslogik nicht.

Der nächste GitHub-Installer bleibt das definitive vollständige Release-Gate.

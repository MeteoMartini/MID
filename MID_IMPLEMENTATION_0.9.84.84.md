# MID 0.9.84.84 – Implementierung

## Anlass
GitHub Actions Release #1037 (Commit `c54d978ef8299ac631cc41ced5bf8bfc6a81d557`) baute MID erfolgreich mit TypeScript/Vite, scheiterte anschließend jedoch an vier Regressionstests. Die Fehler waren eine Mischung aus drei veralteten Testverträgen und einer realen Architekturabweichung im Meteogramm.

## Korrektur
- `MeteogramPanel.tsx`: direkte `createPortal`-Nutzung entfernt; gemeinsame `AppPortalPointTooltip`-Primitive verwendet.
- `AppPortalPopover.tsx`: gemeinsame Punkttooltip-Primitive ergänzt, viewportgebunden positioniert und Touch-Auto-Dismiss zentralisiert.
- `RadarPanel.tsx`: die bereits neuere `AppPortalPopover`-Architektur bleibt unverändert maßgeblich; es wurde kein überholter lokaler `focusLayersRef` wieder eingeführt.
- Die drei älteren Regressionen `test-code-quality-0783`, `test-modern-map-focus-09792` und `test-react19-ref-climate-colors-09832` wurden auf den aktuellen Architekturvertrag migriert.
- `test-map-chart-responsive-continuation-098482` prüft nun die gemeinsame Portalprimitive statt ein direktes Meteogramm-Portal zu verlangen.
- Neuer `test-release-gate-architecture-098484.mjs` schützt diese Vertragskonsistenz.
- RADOLAN 1-h-/24-h-Anzeige aus 0.9.84.83 bleibt geschützt.

## Fachliche Auswirkung
Keine Änderung der meteorologischen Berechnung oder Datenquellen. Es handelt sich um UI-/Architektur- und Release-Gate-Wartung.

## Worker
Keine fachliche Worker-Änderung. Nur Versionsmetadaten auf 0.9.84.84 synchronisiert; kein manueller Worker-Upload erforderlich.

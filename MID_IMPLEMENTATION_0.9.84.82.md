# MID v0.9.84.82 – Implementierung

## Karten-/Diagramm-Audit

Meteogramm-Tooltips wurden von lokaler SVG-/Scrollcontainer-Positionierung auf ein `react-dom`-Portal mit `clientX/clientY` umgestellt. Dadurch kann der Tooltip nicht mehr vom horizontalen Diagramm-Overflow abgeschnitten werden. Auf Touch verschwindet er nach 4,2 Sekunden automatisch.

Wetterkarten, DWD-Kombinationskarte, Synoptik und Extremwetter erhielten zusätzliche mobile Layoutregeln für vollständige Metadaten, Safe-Area-Legenden, lesbare Mikrotexte und verlustfreien Textumbruch. Für flache Landscape-Viewports werden Kartenhöhen begrenzt, ohne die Karteninhalte oder meteorologische Layerlogik zu verändern.

## Regression

Der neue Vertrag `test-map-chart-responsive-continuation-098482.mjs` schützt die Änderungen und die zwölf MID-Referenzviewports. `src/styles.css` wird weiterhin exakt aus den fünf kanonischen Stylesheet-Modulen erzeugt.

## Buildfix nach Installer #1036

Der GitHub-Installer des vorherigen Uploads v0.9.84.81 scheiterte erst im vollständigen TypeScript-Build, nachdem ZIP-Entpackung, `npm ci` und Dependency-Audit erfolgreich waren. Ursache war ein nach der Portalumstellung nicht mehr verwendeter lokaler `clamp`-Helfer in `SubseasonalTrendPanel.tsx` (`TS6133`). Der Helfer wurde entfernt und der bestehende Overlay-Vertrag um einen entsprechenden Rückfallschutz ergänzt.

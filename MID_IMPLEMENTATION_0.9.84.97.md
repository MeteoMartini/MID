# MID v0.9.84.97 – Implementierungsstand

## Basis

- Letzte kanonisch stabile Basis: `mid-stable` v0.9.84.95, Commit `bc4c0100f6d7034ee2d1c46461d51dcc1865c139`.
- Zu korrigierender Kandidat: v0.9.84.96 aus GitHub Actions `MID-Release aus ZIP installieren und veröffentlichen` #1050, Run `34827211600`.
- Der Produktionsbuild von v0.9.84.96 war erfolgreich: `npm ci`, Dependency-Audit, TypeScript 7.0.2 und Vite 8.2.2 bestanden. Das Release wurde ausschließlich durch zwei von 789 Regressionstests blockiert.
- Release-Ziel: v0.9.84.97.

## Ursache des Installerabbruchs #1050

Beide Fehlschläge waren veraltete statische Quelltextverträge und keine fachlichen Laufzeitfehler:

1. `test-ensemble-wind-selection-cloud-reconciliation-08173.mjs` erwartete weiterhin die frühere direkte Zuweisung von `cloudSource`. v0.9.84.96 trennt die Bewölkungsprovenienz jetzt bewusst in `baseCloudSource` und ergänzt bei modelliertem Ceiling die explizite Quelle des ICON-D2-RUC-Ceilings. Die Informationsdichte ist dadurch höher, nicht geringer.
2. `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs` verlangte für den Isohypsenmodus ausschließlich einen renderbaren Vektorframe. v0.9.84.96 verwendet dagegen absichtlich das native DWD-WMS als Primärpfad und den geglätteten Vektor-/Canvas-Pfad als Fallback. Die neue Bereitschaftslogik muss daher beide Wege akzeptieren.

## Korrektur

- Der Bewölkungs-/Hyperlokaltest schützt nun sowohl die vorhandene `cloudAnalysisMethod`-Provenienz als auch die zusätzliche Modell-Ceiling-Quellenangabe.
- Der Viewport-/Isohypsentest schützt nun `hasRenderableIsoheights`, also natives DWD-WMS **oder** den Vektor-/Canvas-Fallback, und weiterhin die getrennte Bereitschaft für Isobaren, Isohypsen und beide Linienarten.
- Produktionscode, meteorologische Berechnungen, Datenquellen, UI-Geometrie und Worker-Fachlogik wurden gegenüber v0.9.84.96 nicht verändert.

## Worker

Keine neue Worker-Fachlogik. Ein separater manueller Worker-Upload ist für v0.9.84.97 nicht erforderlich; die Worker-Dateien unterscheiden sich von v0.9.84.96 nur durch synchronisierte Versionsmetadaten.

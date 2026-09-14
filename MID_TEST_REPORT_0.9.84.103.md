# MID v0.9.84.103 – Testbericht

## Projekt-/Datenstand
- Letzter bestätigter `mid-stable`: v0.9.84.102, Commit `311d90cc77b9dcdd27de3ae7bfc6a3fcbda586d1`.
- DWD-RUC-Workflow #549: erfolgreich. Der Lauf 2026-09-14T12:00 dekodierte `CEILING` in 15/15 stündlichen Zeitstufen und veröffentlichte den RUC-Snapshot erfolgreich.

## Fokussierte Regressionen
Erfolgreich:
- `test-current-ceiling-visible-098500.mjs`
- `test-synoptic-startup-ceiling-098496.mjs`
- `test-hyperlocal-fields.mjs`
- `test-current-header-density-098472.mjs`
- `test-appwide-readability-continuation-098479.mjs`
- `test-responsive-layout-tooltip-098474.mjs`
- `test-viewport-textflow-098485.mjs`
- `test-current-observation-multisource-cloud-098460.mjs`

## Aussage
Der Test schützt nun ausdrücklich, dass Ceiling nicht nur im `(i)`-Popover existiert, sondern als Teil des sichtbaren `detail`-Texts der Bewölkungskachel gerendert wird. Beobachtung bleibt gegenüber Modellwerten vorrangig; die Modellprovenienz bleibt sichtbar.

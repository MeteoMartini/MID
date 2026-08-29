# MID v0.9.69.4 – Worker-Auto-Deploy Placement-Hotfix

## Anlass
Der erste echte v0.9.69.3-Auto-Deploy bestand Build, Dependency-Audit, vollständige Regressionen, Release-Commit, Secret-/Variablen-Gate und Remote-Konfigurationsspiegel. Wrangler stoppte anschließend vor jeder Traffic-Umschaltung, weil die Workers-API für den bestehenden Worker ein leeres `placement`-Objekt lieferte und die temporäre Konfiguration daraus `placement: {}` erzeugte.

## Korrektur
- Leeres oder fehlendes Remote-Placement wird vollständig weggelassen; MID erfindet keinen Modus.
- `mode: smart` sowie genau ein expliziter `region`-/`host`-/`hostname`-Hinweis werden erhalten.
- Unbekannte Modi, konkurrierende Hinweise, Smart plus Zielhinweis oder `targeted` ohne Ziel brechen fail-closed ab.
- Binding-, Secret-, 0-%-Staging-, Versionsoverride-, Promotion- und Rollback-Verträge bleiben unverändert.

## Regression
`scripts/test-worker-auto-deploy-09693.mjs` reproduziert `placement: {}` und verlangt, dass kein Placement-Block an Wrangler geht.

## Sicherheit des fehlgeschlagenen Erstlaufs
Der v0.9.69.3-Lauf veränderte den produktiven Worker nicht: der Upload scheiterte vor Staging/Traffic; Pages und `mid-stable` wurden übersprungen.

# MID v0.9.76.20 – Regression-Contract-Hotfix nach Install-Run #793

## Anlass
Der GitHub-Installer für v0.9.76.19 entpackte das Professional-ZIP erfolgreich, installierte 244 Pakete, bestand das Dependency-Audit, den TypeScript-7.0.2-Typecheck sowie den Vite-6.4.3-Produktionsbuild. Erst die Regressionsebene brach mit exakt drei veralteten Erwartungen ab.

## Korrektur
- `test-cloud-profile-structures-09740.mjs` erwartet nun die bewusst nicht überlappende Wolkenzellgeometrie des 24-h-Profils (`columnLeft + .7`, `columnWidth - 1.4`).
- `test-logo-cloud-profile-09739.mjs` schützt dieselbe kontinuierliche, aber kollisionsfreie Wolkenbandgeometrie.
- `test-learning-scenarios-mountain-zones-071110.mjs` schützt nun den neuen Resume-Vertrag: vorhandene Ensemble-Szenarien bleiben bei transient leerer Teilantwort erhalten (`setEnsembleScenarios(current => value.scenarios?.length ? value.scenarios : current)`).

## Produktwirkung
Es gibt keinen Produktcode-Rollback. Die Ensemble-Resume-Recovery, die automatische 45-s-Wiederholung, das Beibehalten des letzten erfolgreichen Ensemble-Stands sowie die 24-h-/DWD-UI-Finalisierung aus v0.9.76.19 bleiben unverändert erhalten.

## Worker
Keine fachliche Worker-Änderung. Nur die zentrale Releaseversion wird synchronisiert; ein manueller Worker-Upload ist nicht erforderlich.

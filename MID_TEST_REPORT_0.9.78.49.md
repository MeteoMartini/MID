# MID Test Report v0.9.78.49

## Schwerpunkt
- Hybrid-Reihenfolge **amtlich → MID**
- amtliche Warnfarben exklusiv
- MID-Parameterfarben
- gewählte Windeinheit in kompakten amtlichen Zusammenfassungen
- unveränderte amtliche Originaltexte
- Unsicherheits-/Depräzisionsdarstellung für Wind, Gewitter, Regen, Schnee, Nebel, Glätte, Hitze und Frost
- iPhone-/responsive Warnlayout

## Neue Regression
`scripts/test-warning-hybrid-uncertainty-097849.mjs`

## Angepasste Altverträge
- `test-warning-current-summary-disclosure-09657.mjs`
- `test-current-warning-compact-responsive-09654.mjs`
- `test-day-character-late-rain-warning-wording-08339.mjs`
- `test-hazard-validity-08185.mjs`
- `test-hazard-wind-direction-inline-08188.mjs`
- `test-hazard-wind-direction-08187.mjs`

## Lokal erfolgreich geprüft
- `test-warning-hybrid-uncertainty-097849.mjs`
- `test-current-warning-compact-responsive-09654.mjs`
- `test-warning-current-summary-disclosure-09657.mjs`
- `test-current-more-hazard-caption-08242.mjs`
- `test-hazard-validity-08185.mjs`
- `test-hazard-wind-direction-inline-08188.mjs`
- `test-appwide-parameter-colors-09779.mjs`
- `test-maintenance-modularization-09560.mjs`
- `test-release-upload-budget-097410.mjs`
- `test-release-lineage.mjs`
- `test-local-imports.mjs`
- `test-regression-continuity.mjs`

Die Warnungs-Auditgruppe wurde zusätzlich breit ausgeführt. Nach Anpassung der drei durch den neuen UI-Vertrag tatsächlich veralteten statischen Erwartungen blieben unter den lokal ausführbaren Warnprüfungen **keine fachlichen Fehler**. Einzelne weitere Tests benötigen die vollständige GitHub-Umgebung mit TypeScript 7 / `typescript-strada` bzw. vollständigem `node_modules` und sind deshalb lokal nicht aussagekräftig.

Die Suite erkennt **671 Regressionstests**. Die geänderten `App.tsx`, `weather.ts` und `dwdWarnings.ts` wurden zusätzlich mit dem TypeScript-Parser auf Syntaxfehler geprüft: keine Parse-Diagnosen.

## Fachliche Grenze
Die neu sichtbaren Wertebereiche sind bewusst **Depräzisions-/Darstellungsbänder und keine statistischen Konfidenzintervalle**. Die internen exakten Modellwerte und Schwellen bleiben erhalten.

## Worker
Keine fachliche Workeränderung. Der Worker wird nur versionssynchron mit ausgeliefert.

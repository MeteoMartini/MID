# MID v0.9.85.207 · Intensivaudit – Schritt 1 von 8

## Verifizierte Ausgangslage
- `main` und `mid-stable` waren `541ba0b77dc932288bf68ab78b0efd7925045a47` (MID v0.9.85.206).
- Aktive GitHub-Rulesets `MID Production Branch Guard` und `MID Stable Protection` kontrollieren die geschützten Branches; Stable erfordert `MID / release-candidate-quality`. Gesonderte Rulesets für Trusted Agents und Replit bestehen.
- Der Auditbefund `protected: false` als vermeintlicher Nachweis eines fehlenden Branchschutzes war falsch; keine Änderung bestehender Schutzregeln.

## Umsetzung
- `npm run build` erstellt nach Vite eine Web-Build-Identität `dist/mid-build-identity.json` mit Version, Source-Git-SHA soweit verfügbar, UTC-Zeit, Asset-Zahl und SHA-256 über Dateinamen und individuelle Asset-Hashes.
- Fail-closed bei Versionsdifferenzen `package.json`/`src/version.ts`/`dist/version.json`/`dist/index.html`, ungültiger Provenienz oder fehlenden JS-Assets.
- Die Quell-SHA ist ausdrücklich NICHT die Installer-/Stable-SHA; Source-PR, Merge, Packaging, Installer und Stable dürfen verschiedene vertragskonforme Commits aufweisen.
- Keine neuen Secrets, Datenquellen, Telemetrie, iOS-Auslieferung oder Kosten.
- Neue deterministische Regression für gültige Identität, Versionkonflikt, Provenienzkonflikt und Asset-Veränderung.

## Nachweis und Folgearbeiten
- Geprüfter Build muss vollständige Source-PR-/Installer-Gates bestehen.
- Schritt 2 erweitert anschließend die existierenden RUC-/DWD-Fachgates; Schritt 6 ergänzt später den iOS-Simulator-Nachweis.

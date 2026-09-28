# MID v0.9.84.104 – Testbericht

Erfolgreich ausgeführt:
- `node scripts/sync-version.mjs`
- `node scripts/test-chatgpt-github-write-contract-098510.mjs`
- `node scripts/test-versioning.mjs`
- `node scripts/test-release-lineage.mjs`

Zusätzlich geprüft:
- GitHub `main` und `mid-stable` waren vor Beginn identisch auf v0.9.84.103.
- Installer #1059 war erfolgreich.
- ChatGPT-App-Berechtigungsmodus: „Allow all actions“.
- Direkter GitHub-Schreibtest: `create_branch` -> HTTP 403 `Resource not accessible by integration`.
- Direkter GitHub-Issue-Schreibtest: ebenfalls HTTP 403.

Ein vollständiger lokaler npm/Vite-Regressionslauf wird für diesen reinen Repository-/CI-Vertrag nicht behauptet, da in der isolierten Laufzeit kein vollständiger npm-Abhängigkeitsbestand garantiert ist. Das neue PR-Gate selbst führt nach Aktivierung genau den bestehenden vollständigen `npm run verify`-Pfad aus.

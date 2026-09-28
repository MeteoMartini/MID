# MID v0.9.84.104 – nachhaltiger GitHub-Schreibworkflow

## Ausgangslage
`main` und `mid-stable` standen vor Beginn auf demselben erfolgreich veröffentlichten v0.9.84.103-Commit. Der jüngste Installer #1059 war erfolgreich.

Die in ChatGPT konfigurierte GitHub-App hat auf ChatGPT-Seite bereits „Allow all actions“. Ein realer Schreibtest (`create_branch`) sowie ein Issue-Schreibtest wurden von GitHub jedoch jeweils mit HTTP 403 `Resource not accessible by integration` abgewiesen. Damit ist die tatsächliche GitHub-Verbindung in diesem Chat weiterhin read-only.

## Umsetzung
- `AGENTS.md`: verbindlicher Codex-/Agentenvertrag für MID.
- `MID_CHATGPT_GITHUB_CONTRACT.md`: dauerhafte Branch-/PR-/Release-Regeln.
- `ci/github/workflows/chatgpt-pr-gate.yml`: read-only Pull-Request-Gate für `chatgpt/*` und `codex/*` mit sicherem ZIP-Entpacken, reproduzierbarem `npm ci`, Dependency-Audit und `npm run verify`.
- `scripts/sync-github-workflows.mjs`: neues Gate in die explizite Workflow-Synchronisierung aufgenommen.
- `scripts/test-chatgpt-github-write-contract-098510.mjs`: schützt Branchschema, Least-Privilege, SHA-Pins und Vollverifikation.

## Nachhaltiger Releasepfad
1. Codex/Write-Agent erzeugt einen Branch vom aktuellen stabilen Stand.
2. Änderung + Tests + Version/Changelog werden im Kandidaten erstellt.
3. Der Agent committet das unversionierte `MID-professional-replacement.zip` in den Branch und eröffnet einen PR nach `main`.
4. Das Agent-PR-Gate validiert das ZIP selbst.
5. Erst nach grünem Gate wird gemergt.
6. Der bestehende `install-mid.yml` bleibt die einzige Installations-/Deploy-/Stable-Promotion-Strecke.

So bleibt `mid-stable` fail-closed und die heutige, bereits bewährte ZIP-Releasearchitektur erhalten.

## Einmaliger Bootstrap
Das neue Workflow-Gate liegt zunächst als kanonische Quelle unter `ci/github/workflows/`. Die aktive `.github/workflows`-Datei muss einmal explizit über `npm run sync:github-workflows` in einem Repository-Wartungs-PR aktiviert werden. Das automatische Release darf `.github` bewusst nicht selbst verändern.

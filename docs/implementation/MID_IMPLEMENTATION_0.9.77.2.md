# MID 0.9.77.2 – GitHub Actions Wartung: PR #25 + #24

## Umfang

- PR #25 fachlich übernommen: `actions/upload-artifact` 6.0.0 → 7.0.1, SHA `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`.
- PR #24 korrigiert übernommen: CodeQL 4.37.9, SHA `cdf488f595d80d6e07e03d4674febd5ab45fa938`.
- Anders als der unvollständige Dependabot-PR werden **init und analyze gemeinsam** auf exakt denselben CodeQL-SHA synchronisiert.
- `ci/github` bleibt kanonische Quelle; `sync-github-workflows.mjs` pinnt checkout, setup-node, upload-artifact und beide CodeQL-Schritte.
- Der Release-Installer verändert `.github` weiterhin nicht automatisch. Aktivierung erfolgt ausschließlich über den expliziten administrativen Workflow-Sync.

## Nicht enthalten

- React 19 / React DOM 19 / react-is 19 bleiben zurückgestellt.
- `@vitejs/plugin-react` 6 bleibt zurückgestellt.
- Keine Worker-Fachlogik geändert.

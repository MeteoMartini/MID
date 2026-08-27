# MID v0.9.67.4 – Release-Installer-/Workflow-Pin-Hotfix

## Ursache
Der v0.9.67.3-Release erreichte erfolgreich `npm ci`, Dependency-Audit, TypeScript und den Vite-Production-Build. Von 551 Regressionen scheiterte ausschließlich `test-dependency-actions-maintenance-096673.mjs`, weil dieser Test die aktive `.github/workflows/mid-code-revision.yml` auf CodeQL 4.37.7 prüfte. Der MID-Installer schützt `.github` jedoch absichtlich vor Selbstmodifikation und übernimmt Workflow-Dateien aus einem Professional-ZIP nicht in denselben Release-Commit.

## Korrektur
- Der Wartungstest prüft den auslieferbaren Release-/Sync-Vertrag statt den bewusst konservierten aktiven Workflowzustand während des Installationslaufs.
- `scripts/sync-github-workflows.mjs` besitzt jetzt zusätzlich den kanonischen CodeQL-4.37.7-SHA-Pin und aktualisiert `github/codeql-action/init` sowie `analyze` beim expliziten administrativen Sync.
- `test-github-actions-v7-sync-09570.mjs` simuliert zusätzlich einen historischen CodeQL-4.37.6-Workflow und verifiziert dessen Upgrade auf 4.37.7.
- `test-release-workflow-pin-boundary-096674.mjs` schützt die Trennung zwischen sicherem ZIP-Installer und explizitem Workflow-Sync gegen Rückfälle.
- `sync-version.mjs` synchronisiert zusätzlich die kanonische Worker-Teilquelle vor dem Aggregate-Neubau; dadurch bleibt Worker-Version 0.9.67.4 auch nach `maintain:aggregates` erhalten.

## Unverändert
Lucide React 1.34.0, MapLibre GL JS 6.5.0, React 18.3.1, TypeScript 5.9.3, Vite 6.4.3 und @vitejs/plugin-react 4.7.0 bleiben unverändert. Es gibt keine fachliche Wetter-/UI-Änderung gegenüber v0.9.67.3.

## Worker
Nur Versionssynchronisierung auf v0.9.67.4; keine fachliche Workerlogik geändert.

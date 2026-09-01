# MID PR-Housekeeping · v0.9.77.8

Stand: 01.09.2026

## Bereits im kanonischen MID-Stand umgesetzt

Die folgenden Dependabot-PRs sind fachlich/technisch bereits im Quellstand enthalten und deshalb als **superseded/erledigt** zu behandeln:

- PR #24 – `github/codeql-action` 4.37.9, SHA-gepinnt und für `init` + `analyze` gemeinsam synchronisiert.
- PR #25 – `actions/upload-artifact` 7.0.1, SHA-gepinnt.
- PR #26 – `actions/setup-python` 7.0.0, SHA-gepinnt im RUC-Pfad.

Der vorhandene Regressionstest `scripts/test-github-pr-maintenance-09773.mjs` schützt diese Übernahmen.

Ein Schließversuch über die verbundene GitHub-Integration wurde durchgeführt, aber von GitHub mit `403 Resource not accessible by integration` abgewiesen. Deshalb werden die PRs im Repository nicht fälschlich als geschlossen dokumentiert; sie können bei Schreibberechtigung gefahrlos geschlossen werden.

## Bewusst nicht erledigt

Diese offenen Major-PRs bleiben gemäß Dependency-Policy ausdrücklich zurückgestellt und dürfen nicht im Zuge des Housekeepings geschlossen oder automatisch übernommen werden:

- PR #6 – React DOM 19 / `@types/react-dom` 19
- PR #18 – `@vitejs/plugin-react` 6
- PR #20 – React 19 / `@types/react` 19
- PR #21 – `react-is` 19

Damit unterscheidet MID klar zwischen „bereits umgesetzt, PR nur noch offen“ und „inhaltlich noch zurückgestellt“.

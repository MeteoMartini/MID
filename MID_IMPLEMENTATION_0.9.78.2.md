# MID Implementation v0.9.78.2

Datum: 2026-09-02

## Ziel

Fehlerbehebung für den fehlgeschlagenen GitHub-Installer-Run #840. Der Release-Workflow auf GitHub selbst blieb aktiv, aber die mit dem Professional-Release transportierte Spiegeldatei `workflow-patches/install-mid.yml` war gegenüber der kanonischen Pipeline `ci/github/workflows/install-mid.yml` veraltet. Dadurch konnten workflowbezogene Regressionen im Installer fehlschlagen.

## Umsetzung

- `workflow-patches/install-mid.yml` wurde vollständig auf den kanonischen Stand von `ci/github/workflows/install-mid.yml` synchronisiert.
- Damit sind wieder identisch enthalten:
  - sicherer `main`-Race-Schutz,
  - expliziter Ausschluss automatischer `.github`-Selbstmodifikation,
  - Worker-Deploy-Gate mit semantischem Diff, 0-%-Smoke, Promotion und Rollback,
  - serieller `mid-pages`-Lock mit `cancel-in-progress: false`,
  - fail-closed Stable-Promotion inklusive Qualitätsstatus.
- Keine fachliche Änderung an App, Forecast-Fusion, Worker-Fachdaten, UI oder iOS-Fachkern.

## Versionierung

- Wartungsrelease von `0.9.78.1` auf `0.9.78.2` fortgeschrieben.
- `package.json`, `package-lock.json`, `MID_BASELINE.json`, `MID_IOS_STATUS.json`, `src/version.ts`, `public/version.json`, Service Worker und Worker-Versionen wurden via `scripts/sync-version.mjs` konsistent aktualisiert.

## Ergebnis

Der mit dem Release transportierte Installer-Spiegel ist wieder konsistent zum kanonischen Workflowstand. Künftige ZIP-Uploads laufen damit nicht mehr gegen eine veraltete workflowbezogene Regressionsbasis.

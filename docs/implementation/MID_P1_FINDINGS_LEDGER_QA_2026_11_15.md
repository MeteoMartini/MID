# MID Release Konzept 1.3 – Complete P1 scanner evidence QA (15.11.2026)

Source parent: `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` / released v0.9.85.483, main=mid-stable at candidate creation. This is a **read-only QA Draft**, not a new application build, release approval, change of GitHub rules, scanner suppression or a replacement for Source/Installer/Worker/Pages gates.

## Gap and bounded implementation
- Existing checked-in `tools/ci/mid-workflow-quality-pilot.mjs` accurately totals all zizmor findings but caps the textual JSON excerpt to 32,768 characters. The prior report has 31 findings (2 High, 13 Medium, 2 Low, 14 Informational), but not all 31 details can be independently reviewed. Historical `#760` owns that script, therefore **do not edit it**.
- New pure `tools/ci/mid-p1-findings-ledger.mjs` preserves complete **compact structured** findings: rule, severity, confidence, exact workflow path, line, column, symbolic route, annotation and SHA-256 fingerprint. No raw workflow code, secrets, credentials, task execution or automatic code fixing is stored in the compact ledger.
- The already-existing SHA-256-verified zizmor v1.32.0 executable is rerun offline for the same seven verified workflow mirrors. Check the second run's exit code, full JSON, item count, severities, rule counts and workflow counts against the first run's independently generated summary. On truncation, altered exit, invalid path/location or mismatched summary, explicitly report `SCANNER_EVIDENCE_INCOMPLETE`, never `PILOT_PASS`.
- The existing optional P1 step remains `continue-on-error: true` with the same 7-day artifact. No new dependencies, permissions, status checks, workflows, paid tools or release blocking semantics. Complete ledger is additive to `mid-p1-tool-report.json`; the original scanner excerpt remains available for short context.

## Source-independent recent result
The immediately prior [Unit QA #43737279495](https://github.com/MeteoMartini/MID/actions/runs/43737279495) on Draft #823 (`345040d548004769a6fb290a06b23d9af57551bd`) has `PILOT_FINDINGS_OR_FAILURE`, actionlint 8, zizmor 31, and **Biome exit 1** on `src/CurrentSurroundings.css` `!important` style diagnostics. This is not a production failure and must not be called a clean scan. CSS belongs to independent maps/design work; do not auto-remove `!important` without checking actual map overlays, contrast, mobile and Light/Dark.

## Current security follow-up
Both High `dangerous-triggers` risks remain on `agent-source-release.yml` and `release-self-heal.yml` (see [#740](https://github.com/MeteoMartini/MID/issues/740) and [#775](https://github.com/MeteoMartini/MID/pull/775)). This read-only ledger does not resolve their privilege/review race or justify changing established release transport. Full per-finding disposition and guarded independent review remain required before attributing false positives.

## Acceptance
The new deterministic unit checks and actual GitHub Unit/Coverage run on the immutable Draft SHA must succeed; exact artifact must expose `zizmorLedger.status='COMPLETE'` with all 31 findings. An optional scanner exit with findings is still a non-green pilot. Source-PR, CodeQL, full Installer and Stable promotion are **not** executed for this Draft. Integration, if accepted by the Lead release train, must use the established next version and all protected gates.

# MID Release Self-Heal: Single unified-map timeout classification (QA Draft)

**Status: QA ONLY / NO RELEASE / NO READY / NO MAIN-STABLE-WRITE.** Proposed scope is exclusively the established `MID Release Self-Heal` workflow and its canonical mirror. Not a new workflow or release authorization. The originally reviewed Stable base was `0.9.85.455`; the current integrated QA release candidate #754 is `0.9.85.456`, not yet promoted. Source/Installer/Worker/Pages/Stable gates remain binding.

## Exact live incident (11 Nov 2026)

- Successful Source Gate [#42971296717](https://github.com/MeteoMartini/MID/actions/runs/42971296717), including `heavy-unified-map 2/3`; all eight browser cases passed on Source HEAD `e38cb32284dfdef393a15053e07cbf8002a4bfba`.
- Installed release attempt 1 [#42972384988](https://github.com/MeteoMartini/MID/actions/runs/42972384988), same source version and SHA-bound release snapshot, failed only `Release-Heavy · heavy-unified-map · 2/3`. Seven browser cases passed. The eighth failed `page.waitForFunction: Timeout 30000ms exceeded.`, within `scripts/verify-unified-map-browser-0985167.mjs`; wrapper printed `1 von 1 Regressionstests fehlgeschlagen: test-unified-map-layers-0985167.mjs`.
- Existing Self-Heal [#42973795604](https://github.com/MeteoMartini/MID/actions/runs/42973795604) classified this as `deterministic` because it matches the broad word `Regression` in the wrapper text, so it **did not** retry. Manual GitHub `rerun-failed-jobs` on the same installer run attempt 2 later succeeded, Installer `completed/success`, `main=mid-stable=7272a54ef9a9bd02fa1b6523f0cbf352b9412963` v0.9.85.455.

The timeout may reflect a transient runner/browser delay; a later passing rerun is not proof that all similar timeouts are harmless. **No browser assertion, timing budget, meteorological test or Source/Installer requirement is relaxed.**

## Proposed existing-path change

- `tools/ci/release-self-heal-classify.mjs` is a pure, read-only, bounded retry classifier: it requires exactly one reported failed job, complete current GitHub job inventory (`total_count` not truncated), exact existing matrix-shard name, the known timeout signature, exact browser script, one failing regression wrapper and no independent hard deterministic evidence. It authorizes exactly **one** repeat of this signature, only on workflow attempt 1. Generic previously permitted transient transport errors remain retryable; deterministic, unknown, multiple-job, missing/inconsistent evidence and attempt 2+ browser failures stop.
- The already established `ci/github/workflows/release-self-heal.yml` and `.github/workflows/release-self-heal.yml` are modified **byte-identically**, not replaced. Only known pinned `actions/checkout` and `actions/setup-node` are reused. The helper is checked out from **promoted `mid-stable`**, not from any untrusted failed PR head; checkout persists no credentials. The existing token's exact `actions:write` permission and `gh api .../rerun-failed-jobs` command are unchanged. The replay is bound to the original workflow-run ID, never a new build, merge or deploy permission.
- The existing registered `scripts/test-release-train-plan-0985376.mjs` adds independent negative and boundary tests. No new regression-discovery file, partition change, workflow name or cost service.
- First rollout is deliberately fail-closed: the promoted Stable must contain the trusted classifier before future failed release runs can use it. This QA Draft is not authorized to update Stable directly.

## Separate release P1, NOT solved here

[#740](https://github.com/MeteoMartini/MID/issues/740) documents the release-bot's missing enforced review/Cubic-finding triage. [#749](https://github.com/MeteoMartini/MID/pull/749) is an independent native merge-time rule-policy QA. This Self-Heal patch does not touch them. **Do not use automated retry to accelerate release of candidates with unresolved premerge findings.** A future actual integration and deployment of this improvement must separately address the outstanding review-risk decision and perform all regular source/installer gates.

This file is durable handoff evidence; it is not proof of a successful build or permission to merge.

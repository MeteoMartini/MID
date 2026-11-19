# MID Release Konzept 1.9 – RUC-Source-Gate nach Dateiscope beschleunigen (QA-Draft, 19.11.2026)

## Verified origin

- Stable when scoped: v0.9.85.496, `main=mid-stable=256aabe286f7daa00dc0e320815dd8dacb7b4706`; five repository rulesets active.
- Original source gate [#44459366629](https://github.com/MeteoMartini/MID/actions/runs/44459366629) succeeded on head `e93805c4de15ec1b5b05ffb8c33c179042d82991`; measured wall time 21 min 57 sec. The original RUC DWD full-admission parallel job took around 21 min 42 sec, source core (including its separate original-run probe) 16 min 15 sec. They are parallel, not additive.
- Root cause: previous `git diff HEAD^1 HEAD -- tools/ruc/` selected both 3-run native original DWD verification branches even when the only two changed RUC paths belonged to Pages snapshot restore.

## Code contract and test scope

1. One reusable `tools/ci/ruc-source-admission-classifier.mjs` identifies changed paths from GitHub's synthetic source PR merge HEAD against HEAD^1, with no rename collapsing (`--no-renames`) and NUL-separated output, no PR API/token/network. Failure to read the diff or ambiguous/corrupt input fails closed.
2. Exactly two exempt restore paths are allowed: `tools/ruc/restore_ruc_pages_snapshot.py` and `tools/ruc/test_restore_ruc_pages_snapshot.py`. Any other `tools/ruc/*` change, original DWD composite verifier, native synoptic/cloud map consumer, either source-workflow mirror, the classifier itself or its tests require the full native original run and codec/contour admission **in both existing gate branches**.
3. The existing restore test is now explicitly mandatory on every Source core run, alongside RUC native sidecar, hourly inventory and related Python/Node regressions; this preserves HTTP retry, canonical manifest/path uniqueness, SHA, atomic restore, rollback and compressed snapshot scenarios. This is not a replacement for a full Source/Installer/Pages gate.
4. The original optional-sidecar test's three **mocked** source-unavailability warnings are captured inside the tests, and their exact expected warning text asserted. Production `tools/ruc/run_ruc_native_sidecar.py` stays byte-for-byte unchanged: real errors and official data warnings are neither hidden nor relabelled. SIGABRT/SIGSEGV/nonzero child exits remain fatal in native production.
5. Classifier negatives have 30 cases covering restore-only, mixed changes, unknown RUC paths, renames/moves, prefix/suffix/newline tricks, workflow and classifier modifications, all prior original-map triggers, invalid input and no changed paths. Executed both as an unprivileged Vitest-Draft wrapper and as required source-core Node regression.

## Release admission and speed claims

- **This initial workflow change is deliberately full-admission-triggering:** two source-workflow mirror blobs and the classifier itself change, so BOTH original DWD 3-run gates must pass on any future lead integration of this QA code. No approval of a skipped required job.
- Only after a normal full Source PR review and controlled SHA merge, immutable server ZIP, installer core/heavy, affected Worker/Pages and Stable promotion may a *future restore-only* PR omit live native original DWD rechecks. Its restore, other core, heavy, security and release checks remain mandatory.
- Expected subsequent source wall time may approach the longest remaining Heavy shards (roughly 9–11 minutes in run #44459366629), but it is an **untested target**, not a measured saving. Re-check with real published Stable, a separate SHA-bound restore-only PR and GitHub job timings before any performance-success declaration.
- Do not cache/reuse live original-run evidence from another SHA without a separate proven provenance/capability/expiry policy. No reduced DWD freshness, WMO/DWD obligations, completeness, unit, accumulation, NoData, EPS20/27h, warnings, RUC production publication or release gates.
- #944 and #945 belong to #541 RUC operational source/fast-lane work; no overlap with these 6 QA paths. No second merge pipeline, subscription, background task, workflow dispatch or direct writes to main/stable.

## Lead work handoff

Read back exact original Git blobs/parent SHA, review classifier and 30 negative cases, run full independent QA and adopt selected source/test/workflow/doc blobs in the next existing, versioned combined `chatgpt/*` lead candidate only. Sync both workflow mirrors and all usual version/changelog mirrors in that combined build. Do not directly merge this specialized Draft. Pair later with issue #526 timing evidence; keep the actual RUC P0 #541 independent.


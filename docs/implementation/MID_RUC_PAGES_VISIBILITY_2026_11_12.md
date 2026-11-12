# MID RUC Pages upload/index race – QA and recovery (12.11.2026)

## Source and failure evidence

- Published source, not modified: main=mid-stable=e84d2d2418cc9f1c190fd95539fb8335960c9d93 / v0.9.85.460; five active Rulesets.
- GitHub RUC run 43315778438: the sealed PREPARE stage passed. Pages deploy job 131538577309 failed at 22:29:35 UTC with "Found 5 artifact(s)" and "No artifacts named mid-ruc-pages-43315778438-1". The exact artifact is present in the official run's artifact list with ID 13991150239, digest sha256:8bebb64ee86d6a52ca72ae540429e20b7d90e73c9571eb36eda0063c4264accd, size 603787176 bytes, created 22:29:35 UTC. This is consistent with upload-to-artifact-index propagation lag; no observed evidence that the DWD GRIB payload failed.
- Earlier run 43307554030 completed success on the exact same Stable. The later run 43320532702 was in progress at investigation time; results must be checked separately.

## Implemented scope – QA DRAFT, NO RELEASE

The existing source/active RUC publish workflow pair is extended, without changing the DWD fetch, codec, lossless fallback, 900MB/950MB ceiling or 27h/EPS20/NoData gates. After normal and raw rollback pages uploads, a small GitHub API read-only preflight checks that the artifact is **from the current run and attempt**, has exactly one matching name, a valid SHA-256 digest, a positive size, not expired, and is visible **twice**, separated by at least four seconds. Maximum eight reads, no cross-run reuse, no retry of authentication failures, malformed metadata, duplicates, expired or changing artifact. After readiness the existing main/mid-stable SHA lock is rechecked; no Pages deployment runs if readiness/drift fails. Both canonical and active workflows are kept byte-identical. The established required free-Pages regression is extended with bounded positive and negative tests; no new dependency or cost.

## Verification still required

Exact candidate SHA Source/Core/Heavy/RUC/browser/worker and GitHub native review checks; original run/attempt and current-branch identity, new full 27h/EPS20 sealed artifact when available, actual Pages deployment/readback, scientific NoData/accumulation/unit gates, and normal authenticated release path through SHA Bot -> server ZIP -> installer -> Worker/Pages -> Stable. This QA candidate is not a production upgrade and not an independent D2 FullDomain 73-object/SLSA approval.

## Handoff

This draft overlaps the RUC workflow and Pages test in QA PR #773 (actions/download-artifact v8.0.2); integrate **once** at the exact file/hunk level if both qualify, never blind merge. Draft #774 (OPERA Radar) edits disjoint frontend/worker paths; Draft #775 addresses separate native review policy and must not enable an unverified Main ruleset.

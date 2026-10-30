# MID .377: Release qualification

Verified base: `c8ec5614a5d2b6833b87029e59d048ef90029c2d`, .376, main=mid-stable.

## Completed .376 evidence

- Source head `aa415173480793728915663dc5d0db33ec7869c0`; Source run 41064710553 attempt 2 success (attempt 1 had five cancelled Heavy jobs).
- Bot 41074882254; merge `21aad7ccf02a85e9a5c1aca04095f1243c129408`; package `eacc9ccd4aa7734298902a86f239ef95b4653f90`.
- Installer 41074944208: 14:48:43Z–15:01:19Z (12m36s); four Core and six Heavy jobs successful. Worker functional delta=false, existing deployed .372 Worker smoke/RUC fresh successful, Pages attempt 1 success; no unnecessary Worker redeployment.
- Finalize job 124135026193 promoted Stable without force to `c8ec5614a5d2b6833b87029e59d048ef90029c2d` at 15:01:15Z.
- This is one new-installer observation, not a new p50/p95 cohort or complete PR-to-user measurement. The Source run's retry delay must remain visible.

## Two independently saved input candidates

- #527: `093f112cdcbb93104aa5b31d7cfc497f9cff9e72` (build parity), five paths.
- #528: `6d2a4c317226af60747ffcd8b8176ab59de192f3` (timing/source queue), six disjoint paths.
- Both are planning-only Drafts. Combined baseline, versions and domain review belong to the integration head. A partial candidate's generic inventory check is not a combined release result.
- Exact manifest: `MID_RELEASE_TRAIN_377.json`. Revalidate live heads/base before integration; planning never grants release.

## Scope and acceptance

All independent builds are read-only and run the same public VITE variables and Node 22.16.0 as the established Source/Installer. The full Git tree binds workflows/test inventory; output inventories cover every dist file with byte count and SHA256, including actual empty files. The first real Draft run 41078743189 built both copies successfully and refused full byte equivalence. Existing mid-build-identity.json carries a real build timestamp; that file is independently validated against source and the complete asset digest. Both full-byte equality and additional payload equality are explicitly reported. Timestamp differences stay visible, unchanged original bytes are retained, and payload equality never grants artifact reuse. Only generated dist and Capacitor public output may change during build; source/lockfile/environment mutation prevents a match. Compiler equivalence, backend/ZIP/Worker/RUC gates, attestation, provenance expiry and cross-event reuse are not inferred from matching hashes.

The timing auditor uses bounded API pagination and caps earlier attempts at 20; absent or unstable API data yields no manufactured metric. Skipped sentinel timestamps are excluded; earlier cancelled executions are retained. The queue change affects only the existing serial source bot, not Source checks, RUC, Pages or Installer supersession. No reviewer, Ruleset, secret, token scope or release gate is relaxed.

## Primary documentation checked 30.10.2026

- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency (queue:max, 100 pending, incompatible with cancellation).
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations (attestation creation/consumer verification requires a separate permission and identity design).

## Remaining #526 qualification

At least ten fully linked Source/Bot/package/Installer/Worker/Pages/Stable chains, new-path cohort, representative identical-tree A/B trials, trusted signed producer/consumer attestations and negative tests for poisoning/expiry/foreign workflow identity are still required before any productive reuse. No artificial duplicate releases are created to fill a sample. Cache egress warnings do not establish the cause of a cancelled runner.

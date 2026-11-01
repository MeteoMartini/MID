# MID RUC Data 1.3 – P1/P2/P3/P5 integration candidate (NOT released)

## Verified source and parallel provenance (2026-11-01)
- `main=mid-stable` at **v0.9.85.396**, SHA `d32201fbb541f4c5189e549c1250de0964bd61d1`.
- The full .396 installer #41292437081 passed Core/Heavy/Worker/Pages/Finalize; five rulesets remain active. This branch starts from precisely that released Stable.
- P1/P3/P5 code and Python QA workflows were copied from existing **Draft #569** head `f5a4646696947dbabdde8cb0f2d7b23b2c1764bc`; the original Git blobs were confirmed identical on the new branch.
- The EPS-independent native P2 fast candidate producer, selector, local inactive pointer, offline adversarial tests and isolated manual workflow were copied from **Draft #565** head `7672b4f445a6d99af63eccf2aa60228d9b7ffa43`; every original Git blob was read back SHA-identically. The previous drafts remain untouched. No unverified historical ZIP/workspace source was used.
- Parallel ICON-D2 full-domain and ongoing other application work remain separate.

## Newly fixed real P1 observation integrity
The existing 15-min observer marks some GitHub runs `success` even when a MID release causes a deliberate no-op. Its original artifact-upload job was skipped entirely during SHA drift. The new read-only module `tools/ruc/ruc_observer_execution_status.py` emits an explicit per-run record during `always()`, including run ID/attempt, SHA consensus, whether a directory sample exists, and whether public Pages and Worker are both verified. It never infers an observation from job success. Drift/unknown guard, missing files, partial Worker readbacks and invalid records are separate states; missing is never converted to zero. The pre-existing artifact collection now runs on every attempt and includes this status JSON. Tests use real schema shapes but offline fixtures.

No GRIB, 20-EPS member values, DWD first publication timestamp, consumer adoption or P95 SLO is authenticated by these directory or public metadata records. 168 observed model hours and independent native/actual-client evidence remain mandatory.

## P2 offline native fast-lane qualification
The native candidate producer requires all 12 0..6h deterministic fields, the native grid, 73 genuine 5-minute TOT_PREC times, 25 genuine 15-minute CAPE/CIN times, original DWD ecCodes/grib checks, source SHA inventory and strict physical site budget. A separate local fast pointer is always `publicationAuthorized=false`, `productionEnabled=false`, `realtimeConsumerEnabled=false`; the older 27h/20-EPS RUC and production `ruc/latest.json` remain unchanged.

`mid-ruc-fast-lane-qualification.yml` is `workflow_dispatch` only, with no consumer switch, no Pages/R2/Worker write permissions, and no scheduled new provider load. Before a manual real DWD run it needs **an actual MID Source-PR release on default branch and Stable promotion**: GitHub `workflow_dispatch` cannot run an unmerged Draft-only workflow. After deployment, select `run=auto` or an exact UTC model run; its own Stable/Main identity guard blocks release drift. Passing offline PR CI is not evidence of passing live DWD GRIB qualification.

## P3 actual timing limitation, P4/P5 release blockers
The P3 module from #569 identifies the genuine 3603s unaccounted job/step timing difference in prior GitHub RUC logs without falsely attributing it to DWD download or ecCodes decode. True P3 improvement requires SHA-identical raw GRIB inputs and CPU/RAM A/B evidence.

P4 still needs one authenticated shared single-flight/fencing control across production RUC publish and any later Fast-Publisher. GitHub Actions concurrency, independent trigger checks and an offline decision alone do not guarantee atomic remote pointer publication; no Fast-Publisher is activated. The existing complete 27h/20-EPS publish remains sovereign.

P5 168-hour client-observed E2E + real P95<=60 min is **not** verified. Current Python tests/CI are qualification only.

## Release eligibility
Draft only, currently app version still .396 on this branch. Never merge it as a normal .397 release without:
1. fresh Stable/Main SHAs and parallel PR scan, confirmed source ancestry,
2. coherent .397 release version and ALL package/lockfile/baseline/contract/iOS/PWA/Worker mirrors and German user changelog,
3. passing exact PR-head Source-Core/Heavy/Vitest/browsers/build and all **1059+** required regression inventory,
4. controlled MID SHA-source release bot, server-side ZIP, `install-mid.yml`, Worker/Pages/Finalize successful and Stable SHA promotion,
5. separate post-release real DWD P2 manual qualification, and independent P4/P5 acceptance before enabling any production Fast-Publisher.

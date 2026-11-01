# RUC Data 1.6 – 168h observer evidence archival resilience (P1/P5 draft)

**Live canonical base:** MID v0.9.85.404, main=mid-stable at `8cf0c99ecc0a4c6502c188a9ca108466b53bb128`. This is a new isolated source-only Draft on an authorized `chatgpt/*` branch, not a published release.

## Root cause / threat model

The original read-only seven-day collector `ruc_github_observer_collect.py` inventories all **repository** Actions artifacts and hard-stops if the historical count exceeds 64 × 100 = 6400 records. A project with many unrelated CI/release artifacts can therefore fail to archive valid recent RUC original evidence, even if the required observer attempts are present. No bypass by treating missing pages as DWD non-availability is acceptable.

## Narrow, authentic fallback

1. Keep the original fully paginated repository-wide path for up to 6400 artifacts, including stable `total_count`, duplicate-ID and missing-page rejection.
2. Only when GitHub's **first** repository-inventory page reports more than 6400 artifacts, stop that broad scan and resolve each of the already selected ≤800 exact observer run/attempt pairs via GitHub's official `GET /actions/runs/{run_id}/artifacts` endpoint using the existing `GH_TOKEN` with **actions:read**.
3. For every selected run independently bound total pages (≤3 / 300 artifacts per run), require complete and self-consistent pagination, authenticated parent workflow run ID, unique artifact IDs, exact `dwd-ruc-observation-{runId}-{runAttempt}` name and no ambiguous duplicates.
4. Keep unchanged: exact original ZIP SHA256 (when supplied by GitHub), artifact schema and internal SHA/attempt verification, UTC observation status, DWD directory-only vs real GRIB distinction, Pages/Worker same-run readback, censored P50/P90/P95, no overwrite, no missing-to-zero conversion, no additional producer dispatch.
5. Report `artifactInventoryFetchMode=bounded-exact-run-pagination` only when that fallback actually runs. Failure of either pagination path is fatal, never classified as a negative weather event. Historical artifacts outside the selected bounded 192h observer window are not fetched.

## Adversarial QA

The original `test_ruc_github_observer_collect.py` is extended with six concrete hostile fixture cases: huge unrelated repository inventory with good original authenticated ZIP; missing original as an explicit gap; missing per-run page; spoofed run parent; duplicate named observer archive; tampered ZIP digest. Existing negative tests of contradictory samples, release drift, SHA mismatch, artifact size and missing data remain mandatory.

The implementation intentionally **does not** assume an artifact-list ordering or an undocumented timestamp cursor and does not request expanded rights. The exact-run API may consume up to 800 additional read-only calls in a full seven-day window, bounded by existing selection caps and GitHub Action runner/API quotas; if quota is exhausted, collector must fail closed.

## Evidence boundary / release

This fixes potential P1/P5 **collection availability**, not the 168h observation itself, a first actual DWD publication timestamp, original GRIB/20-EPS bitmap verification, a device telemetry signal, a speedup or a 60-minute production P95 SLO. No fast-lane/CAS/Worker/Pages production path changed. The existing 27h/20-EPS producer remains authoritative.

Draft only. Coordinate with parallel `.405` integration branch, PR #595, separate snapshot-fingerprint PR #596 and ICON-D2 PR #597. For actual release: new verified stable source and correct version mirrors/changelogs → full Source/Core/Heavy/meteorological gates → MID SHA-bound bot → server ZIP → install-mid.yml → affected Worker/Pages/Finalize → stable. Never direct-write main/mid-stable.

# MID-C18 – RUC download resilience (integration pending)

Verified released base: v0.9.85.170, `53671910a16d5bd0d6cf9fe47945891789bb0dff`.
At preparation time main contains v0.9.85.171, `abe4c5f3e60977c62fd5fc6b0e48f4d0d9a054c6`, which has not reached stable.
This is a protected source checkpoint, not a released build. Final release version,
version mirrors, changelog and complete release verification remain pending until
the parallel release finishes and the patch is reconciled against that stable base.

## Findings

Runs 37327955504, 37333361699 and 37345146461 failed on DWD network resets/timeouts.
Run 37356442102 rejected missing temperature validity times, then exhausted older
candidates on network failures. Run 37364904977 prepared a valid artifact but its
publish job was cancelled. These are not interchangeable failure classes.

## Changes

- At most four attempts per directory/file operation, exponential backoff and jitter.
- Retry connection/timeouts, interrupted streams and HTTP 408/429/500/502/503/504 only.
- TLS errors, permissions/not-found errors, malformed data and filesystem errors do not retry.
- Failed streams remove their `.part` file; completed files remain reusable on retry.
- Required hourly fields are checked immediately after staging using actual GRIB
  validityDate/validityTime headers, not filename lead-time claims. This precedes
  optional/EPS downloads. Full builder grid/value/member validation remains intact.
- Candidate logs distinguish exhausted downloads from data/build rejection.
- No workflow, Pages lock, release gate, worker, forecast or UI changes.

## Tests / next integration steps

Offline tests: `python tools/ruc/test_fetch_resilience.py` with production requests
dependency installed. Covers retry limits, permanent errors, directory failures,
stream interruptions, atomic cleanup, completed-file reuse and early missing-hour rejection.
Focused existing cadence, scheduler and free-storage contracts are also required.

The new Python regression runs in canonical/active RUC CI immediately after the
existing production dependency installation and before network ingestion.

Before release: reconcile newest stable/main; choose the
next free version and synchronize mirrors/changelogs; full mandated checks and
source/installer gates. Confirm a real subsequent RUC prepare and publish separately.
Do not claim operational recovery based only on mocked network tests.

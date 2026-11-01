# MID RUC P4 – GitHub Pages Single-Writer safeguards (v0.9.85.406)

**Source of truth:** GitHub MeteoMartini/MID. Release base v0.9.85.405, SHA `6410cf049f097b1d0518beac601e1baa08583f4a`, installer #41346300018 completed/success. Work on authorized PR #601. No direct stable/main writes. Five active rulesets unchanged.

## Verified narrow lock scope

The canonical `ci/github/workflows/mid-ruc-preprocess.yml` RUC `publish` job and all `ci/github/workflows/install-mid.yml` Pages-deploy attempts and release finalization share `concurrency.group: mid-pages`, `queue: max`, `cancel-in-progress: false`. RUC `calculate`/ `prepare` deliberately run independently from this short publishing lock, with separate `mid-dwd-ruc-preprocess` no-cancel concurrency. RUC normal and raw rollback Pages uploads/`deploy-pages` occur under the same publish-job lock. An authenticated immutable data artifact and authenticated rollback artifact each use `digest-mismatch: error`. The RUC publishing job rechecks current mid-stable/main version, sealed producer receipts, current stable/source lineage, JS decoder parity, UTC run monotonicity and final SHA before publishing.

The Watchdog only requests the existing RUC workflow under its own source checks; it cannot write Pages or R2 directly. The new `tools/ruc/test_ruc_p4_pages_serialization_contract.py` denies missing lock, changed cancellation semantics, a prematurely removed integrity readmission, missing original/rollback artifact SHA requirements, disjoint MID retry/finalize lock, and direct Watchdog Pages writer. Its six adversarial test methods are executed in the SHA-pinned `mid-ruc-prepared-snapshot-qa.yml` on the PR head. These are intentionally **structural negative checks**, not runtime distributed lease race evidence.

## Remaining P4 release barrier

GitHub Actions concurrency **does not establish global multi-provider compare-and-swap**, and the existing Worker/R2 optional paths do not have a separate independently verified durable cross-provider fencing token/lease. P4 is NOT complete until a globally shared authenticated coordinator with fencing/expiry, stale-owner and double-publisher race tests, marker/readback after Worker/Pages, and rollback behavior are demonstrated. Do not activate alternate production dispatch or independent fast-lane writes without that proof; no new paid provider or broad secret grants.

## Meteorological invariants

Never replace missing EPS, field, grid or time with zero; original +27h/20-EPS, native 5/15m, 542040 original geometry, SHA-authenticated GRIB, strict lead/accumulation, full lossless codec, under-900MB Pages and native old-run monotonicity remain unchanged. Actual DWD first-publication timestamps and client adoption/P95 cannot be inferred from GitHub workflow success.

## Operational status

Source candidate only until non-Draft PR head has full Source/Core/Heavy required regression approval, controlled SHA-bound MID source bot merge, server ZIP, `install-mid.yml` and Worker/Pages/Finalize/Stable confirmation. The currently running Draft/QA is **not** a publication or P1–P5 closure.

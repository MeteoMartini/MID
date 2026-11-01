# MID RUC Data 1.4 – P3 EPS20 quantile research candidate (v0.9.85.400 Draft)

**Live verified source base:** `MeteoMartini/MID` main=mid-stable v0.9.85.400 SHA `a6c644fef9762ffad1f4f48a8ddfdf77d4fe2fe7`; installer #41311115993 completed/success, 5 active branch Rulesets and >=1,059 baseline regression entries. The historical .399 candidate source was first checked against the original ZIP's SHA-256 file manifest; all five inventoried sources were byte-identical. This is NOT a new MID build or production release. Parallel PR #578 native D2 and Draft #577 observer archive remain untouched. The file names of this self-contained research candidate carry no production gate authority.

## Actual operational evidence

GitHub Actions original calculate-job logs have exact `RUC_P3_PHASES` for complete DWD native 27h/EPS20 runs:

| DWD run UTC | Download/index+GRIB header stage | Native builder | GitHub workflow |
| --- | ---: | ---: | --- |
| 2026-11-01 09Z | 101.608s | 700.850s | #41301262261 |
| 2026-11-01 10Z | 106.434s | 550.729s | #41304449395 |
| 2026-11-01 11Z | 93.578s | 388.688s | #41310087720 |

The 12Z run at #41310087720 was rejected for missing DWD RUC-EPS members at 21Z. Missing must never be filled with zero. These numbers are **production duration decomposition**, not evidence that EPS quantiles cause all builder latency: deterministic, rapid, lookup, extrema and EPS packaging contribute. Even a ~46x quantile-kernel gain cannot be extrapolated to total pipeline speedup.

## Candidate and exact preserved semantics

`tools/ruc/ruc_p3_eps_quantile_candidate.py` sorts the EPS member axis in bounded 4,096-native-point NumPy 2.x blocks and implements the documented default `method='linear'` index `(n-1)*q`, preserving original NumPy right-side interpolation order. It returns P25, P50, P75 only. Nonfinite values are excluded; zero is a valid meteorological zero; all-missing remains NaN; individual extremes are retained. Units, accumulation, member-count completeness, SHA, GRIB bitmap and quantization are never altered. Production `tools/ruc/build_ruc_bundle.py` remains exactly untouched and DOES NOT import this module.

**Offline negative/positive tests:** 13 adversarial tests including randomized sparse EPS20, fully missing/single valid member, half-step quantization thresholds, ±inf exclusions, large extremes, all member-counts 1–20, member permutations, bounds and determinism. One executable test loads the **actual `eps_summary` function from `tools/ruc/build_ruc_bundle.py` on the PR checkout** with AST isolation; on 9 different member-completeness regimes it asserts the three candidate quantile arrays equal the unchanged production arrays exactly and the complete EPS summary is byte-identical after invoking the actual `ruc_pack.pack_cell_major(...,EPS_SUMMARY_FIELDS)` routine. A changed production function or packing schema must fail closed. The local developer run with NumPy 2.3.5 passed all 13 tests using local exact-code stubs of the two production functions; GitHub CI must rerun the tests against actual .400 source before any acceptance.

**Synthetic timing only:** on 28 times × 20 members × 4,096 points, the historical local reference runtime was 4.026s versus 0.088s for the candidate (about 46× for this kernel). A previous local shape-only stress test covered 542,040 logical cells in 133 blocks, and 5 scattered blocks matched the reference; this was synthetic, not DWD-original GRIB data. Time, available memory, CPU, NumPy implementation and missingness distribution must be rebenchmarked on the same GitHub native runner before any speedup claims for the complete pipeline.

## Admission and release limits (ALL UNMET)

1. Acquire original DWD source GRIB headers, all 28 × EPS20 × 542040 points including native bitmap, accumulation and unit validation for multiple independently archived runs. Record GRIB SHA256 and exact runner/commit/contract, compare complete EPS summary and complete output object bytes/SHA against production; no synthetic replacement is admissible.
2. Run independent raw-identical baseline/candidate A/B on actual CI hardware with bounded RAM/CPU, same downloads and ≤900MB published physical storage budget, while preserving all 1,059+ regression tests. Compare client Pages/Worker/Widget/Export and verify no missing/extremes regression.
3. Include an explicit, disabled-by-default source activation, documented atomic rollback, full v0.x.y.z version mirrors/changelog/iOS counters, Source-PR Gate, SHA-bound MID release-bot merge, server ZIP, install-mid.yml, Worker/Pages/Finalize and Stable-Promotion before ever affecting a production forecast.

P1 168h original-GitHub observer Draft #577, P2 isolated manual native 0–6h GRIB qualification, P4 single-writer/CAS/fencing and P5 true client p95 remain independently open. The dry CI workflow has only `contents:read`, no provider downloads, no secrets, no writes, no app or runtime activation. NEVER merge this Draft automatically or claim a 60-minute RUC freshness SLA.

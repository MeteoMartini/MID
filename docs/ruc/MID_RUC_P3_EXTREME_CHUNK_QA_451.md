# MID RUC P3 · bounded regional EPS20 extreme-period candidate (.451 QA DRAFT)

**No production activation, no build, no release approval.** The source-of-truth base for this isolated read-only scientific experiment is released `mid-stable` v0.9.85.451, SHA `d8852f672a40d26348d214dc85e9a3a1b9d79c1f`. The canonical `tools/ruc/build_ruc_bundle.py` and deployed 0–27 h DWD RUC/EPS20 data, UTC model/valid-time semantics, meteorological units, NoData and official warnings remain untouched.

## Hypothesis and implementation

The released `rapid_extreme_eps_period_summary()` uses NumPy advanced integer indexing `cube=arr[indices]`, allocating a temporary full-native-grid `(time,20,542040)` copy for each regional time window. At 6 h/20 EPS20/f64, a temporary alone is `6 × 20 × 542040 × 8 = 520,358,400 bytes` (~496 MiB). That is not proof of a ~496 MiB reduction of actual observed process peak, because memory allocator/RSS behavior and other live arrays matter. Prior authentic P3 original DWD builder A/B on `#717` HEAD `8858b970c0ad3906384bb1bddca28c18885fc63a`, action #42567577935: original peak 8,073,008 KiB, accelerated candidate peak 8,074,580 KiB. Strict candidate budget `<6,800,000 KiB` remains unmet; chunking one function alone is **not** expected to prove overall P3 completion.

New QA-only `tools/ruc/ruc_p3_extreme_chunk_shadow.py` computes the same 0–6, 6–12, 12–14 UTC windows, each over at most 4096 spatial points at once; it uses a NumPy view when original indices are consecutive and `np.take()` on a spatially pre-sliced block for nonconsecutive UTC axes. It does **not** insert hours, force missing values to zero, blend different model cycles, alter all-member counting, modify 1 h/6 h rainfall thresholds or recompute non-native times. It retains released float64 arrays, including finite real zero, all-NaN masks, Q75 interpolation and exact output keys. It is not imported from the production module, not attached to an environment variable or CLI and not referenced by the default builder.

## Independent qualification

`python -m unittest tools/ruc/test_ruc_p3_extreme_chunk_shadow.py` loads the **released** production `rapid_extreme_eps_period_summary` function directly from `tools/ruc/build_ruc_bundle.py` via AST and compares every output field with the isolated candidate for independent random 28×20×97 cells, 0/NaN masks, exact 0.2/5/15/20/25/35/40/60/90 mm thresholds, four chunk sizes, a nonconsecutive UTC axis, all-missing/true-zero and invalid-chunk rejection. All reference-vs-candidate arrays must match in shape, float dtype, values and NaN positions. A changed/renamed official source function or signature fails closed.

In the author's isolated offline fixture, 5 tests passed. These synthetic checks are **not** an original DWD GRIB bitmap/values/packed-wire SHA comparison or an authentic full-builder RAM/CPU benchmark. No official first DWD availability, 60-minute P95, 900 MB Pages combination, distributed CAS/fencing, browser/iOS/widget/exports, 27 h native map or worker adoption is approved.

## Admission and handoff

- Keep this PR Draft; versioned production builds and releases are out of scope.
- Coordinate incorporation with existing P3 experiment #717 rather than creating a separate active P3 production integration. Do not merge the shadow by itself into released app code.
- After full-source SHA compatibility and current Stable/parallel PR review, integrate into **QA process only** and run a single same-original-DWD, 28 h/20-member full-builder A/B with whole-output SHA256, 542040-point geography, all field/bitmap/accumulation/NoData checks, real process RAM/CPU phase attribution, independently retained strict candidate peak `<6,800,000 KiB` and unchanged production default. Additional peak sources beyond regional EPS windows must be addressed if needed.
- Only afterward consider separately authorized reviewed production optimization and source→bot→ZIP→installer→Worker/Pages→Stable gates. No change to existing WMO/DWD or MID source/release rules.

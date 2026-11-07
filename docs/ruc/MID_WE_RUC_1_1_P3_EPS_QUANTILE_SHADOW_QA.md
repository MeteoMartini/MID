# WE RUC 1.1 – P3 EPS20 Quartile Performance Shadow (QA-only)

**NO PROD, NO RELEASE, NO MODEL CHANGE.** Baseline `main=mid-stable` v0.9.85.445, SHA `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`.
The production `tools/ruc/build_ruc_bundle.py` and canonical CI/worker/Pages/version/contracts remain completely untouched.

## Objective and source proof
Real [RUC 17Z producer run 42402462745](https://github.com/MeteoMartini/MID/actions/runs/42402462745) logged 682.269 s for core download+decode+builder, 528.421 s for its nested native builder and 413.042186 s **inside that builder** for 133 chunks' `eps_summary` (28 times, 20 EPS members, 542040 cells). Do NOT add these nested times together. This numerical kernel is a candidate P3 bottleneck, not proof of 168h origin latency or app E2E P95.

Original NumPy `nanquantile(...,(.25,.50,.75),axis=1)` uses default method `linear`. The independent `shadow_eps20_quartiles` sorts only 20 member values per cell using vectorized NumPy and reproduces the same symmetric linear interpolation. This is isolated, never imported by the RUC producer or called by production. Only exact float64 arrays with 20 members are admitted. `collect_eps` constructs float64 cube; a local comparison found that naively converting float32 arrays did **not** preserve bit equality and is therefore explicitly rejected.

## Offline tests
Executed using Python 3.13.5, NumPy 2.3.5: `python test_ruc_eps_quantile_shadow.py -v` **6/6 PASS**. Cases: all missing vs true dry zero; every member count 0..20; random native float64 masks and tied/extreme values; nonfinite handling; byte-equal representative packed int16 wire values; wrong members/shape/type fail closed. A synthetic block (28 ×20 ×4096) gave ~3.8 s for the reference quantile vs ~0.04 s for vectorized quantile, roughly 90–100x **for this isolated kernel on this one environment**. This cannot be extrapolated to an entire 27h RUC pipeline or official DWD availability.

## Admission gates still required
- SHA-bound real original three DWD cycles: same exact run/input/bitmap/NoData/units/validity and 28 ×20 ×542040 member matrix.
- Complete float64 shadow-versus-reference value and exact `eps-summary.bin` wire SHA parity; negative input, all-NaN, EPS20 and physical maxima protected.
- P50/P90/P95 real A/B runs on same original source; peak CPU/RAM, NUMPY 2.x compatibility and 900MB pages site.
- Only after independent all-gates PASS may a separate, versioned, protected production change consider replacing the original algorithm. No automatic activation or cost-bearing original downloads authorized here.
Related #541, earlier A/B Draft #554 (separate, untouched) and real D2 QA #695 (separate).

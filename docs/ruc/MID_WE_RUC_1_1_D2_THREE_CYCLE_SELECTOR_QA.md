# MID WE RUC 1.1 – QA-only explicit native ICON-D2 three-cycle selector

**Status:** SHA-fenced QA candidate only; `productionApproved=false`. No production pipeline, Pages, Worker, 27h/EPS20, source gate or release change.

Baseline: v0.9.85.445 `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`; existing original D2 candidate PR #686 HEAD `51b2b70991bc2900f9bbfb2e76910a2f657b2801`. The prior real-original job #42385686243 verified three D2 cycles (03/06/09Z on 2026-11-07), but built the full 8 kinds × 9 leads (=72) only for 09Z.

This small, non-overlapping unit of work adds `--run YYYYMMDDTHHMM` to the already read-only `d2_native_eight_bundle.py`. The chosen run MUST be one of the exact three native cycles admitted by the existing SHA/WMO/bitmap inventory; the caller cannot invent a fourth model run. Calling without `--run` still selects the latest admitted run. Each source component, previous-hour `TOT_PREC`, native grid, SHA, metadata and precipitation ambiguous cell mask remains independently checked by existing code. Eight kinds and original extrema are unchanged.

The new adversarial test exercises each of the three choices, missing/foreign/fourth cycles, malformed run strings, and refusal of incomplete three-cycle inventories. No new DWD access, large downloads, workflows or paid service.

**Next integration step (NOT DONE):** coordinate with the owner of #686 and independently import this exact helper/test after source-SHA and overlap review; run the 9×8 QA for EACH of the three already-inventoried cycles (3×72), verify 216 original-field records with per-cycle run/valid time and original TOT_PREC quantization, and retain `productionApproved=false` until the separate 73-object/900 MB/end-client/source-release gates. Do not schedule duplicate large DWD downloads or claim those 216 fields proved merely because this selector exists.

Related requirements: #446, #541; original 3×1000 RUC (different product) in #684 does NOT qualify these three full D2 cycles.

### 216-field guarded GitHub QA – candidate, not a completed run

The two existing D2 original-source audit workflow mirrors were selectively ported, SHA-checked, then extended on this QA-only branch to derive nine leads × eight kinds for EACH of the three verified original cycles after one bounded download of the original three-cycle inventory. The unchanged latest-cycle 72-field shadow transport is preserved; the other two cycles remain QA-only. A compact immutable 216-field source/cell/interval/wire-hash report is uploaded when successful. The old one-shot branch guard was rebound to this exact branch and a unique commit message; all GitHub rules, read-only permissions, original inventory gates and 45-minute bound remain unchanged. **No pass or source admission can be claimed until the exact GitHub run finishes successfully and the artifact is independently reviewed.**

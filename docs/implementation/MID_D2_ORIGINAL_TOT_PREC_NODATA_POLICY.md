# MID – native ICON-D2 TOT_PREC: GRIB packing uncertainty and explicit NoData

**State:** qualified prototype only, not an official DWD correction, not a map release. Base: mid-stable v0.9.85.411 `9bf44c3354f98937fa058aac5d6dceb5895d29e5`. Candidate branch `chatgpt/v0.9.85.412-d2-ruc-native-qa-from411`.

## Original physical issue
Original DWD `TOT_PREC` GRIB2 contains cumulative precipitation from model run 0 to lead H. A 1-hour amount is `T(H)-T(H-1)` from the identical original model cycle and identical R19B07 native 542,040-cell ordering, not an interpolated or invented field.

Native `grid_ccsds` encoding can choose different binaryScaleFactor between consecutive leads. Decoded quantization quantum is `q=2^binaryScaleFactor * 10^(-decimalScaleFactor)` mm (kg/m²). Different quantums can make 1-hour decoded differences slightly negative even when source physics imposes a nonnegative true increment.

**Necessary but not sufficient test:** if original GRIB quality/bitmap, `stepType=accum`, `startStep=0`, `endStep=H`, exact point count, packing family, decimal scaling, reference and source run agree, then a negative decoded difference is *packing-compatible only when* its magnitude does not exceed `(q_current+q_previous)/2` (plus floating point comparison epsilon).

This does not prove the physically true precipitation, and cannot justify reporting **0 mm** or changing accumulation totals. The policy is to emit **NaN/NoData for that exact native negative cell**, never a synthetic zero. Genuinely valid original 0 mm increments remain exact zero. Valid positive increments remain untouched; no spatial or temporal smoothing or clipping. Source original extrema and native source hashes are retained.

## Strict admission and negative tests
- All original GRIB fields must have the expected native geometry and same-run preceding T(H-1), units, packing, WMO accumulation, bitmap and checksum.
- All negative original cells must be packing-compatible. Any unqualified negative cell blocks the full pilot.
- Masks must identify **exactly** those original negative native indices and be boolean vectors with the source grid size; a missing cell cannot be disguised as valid zero.
- If more than 15% of the native cells have unresolved 1-hour precipitation, the whole field fails admission. This is a conservative *quality ceiling* for the pilot, not a claim of physical validity or an official DWD standard.
- Original missing source cells are always NaN and are counted separately. NoData propagation must remain transparent across nearest-cell map lookup, point probes, legends, PNG/SVG, widgets and iOS. The producer index includes `negativePackingUncertainNoDataCells` and `unresolvedPrecipitationNoDataCells`; the source hash, WMO fields and evidence are preserved.
- `d2_tot_prec_quantization_qa.py` only classifies data; `d2_native_full_fields.py` consumes exactly the separately qualified mask. Source original test is **still read-only** and all product outputs carry `productionApproved=false`.
- No direct changes to the 27h/20EPS source production, the RUC latest pointer or protected branches.
- Regression: `test_d2_tot_prec_quantization_qa.py`, `test_d2_native_full_fields.py`, `test_d2_native_eight_bundle.py`.

## Independent real-data release gate
Original three DWD cycles, WMO, SHA, bitmap, geography; nine offered lead hours × eight kinds = 72 full-domain fields; 12 MB decoded per field; 350 MB native D2 total sidecars; 900 MB entire RUC profile including 27h/20EPS; model run versus validity and 1-hour accumulation; original maxima kept without smoothing. Zero/NoData and extreme/non-complete coverage must be visibly distinguishable in the Web/iOS/Widgets/Exports.

The read-only 72-frame CI must succeed on **the current head SHA** before contemplating a productive bridge. At that point reproduce in a fresh three-cycle sample and verify a fixed original 72-frame inventory, independent source ranges, nearest-native map/marker/isolines, and atomically published immutable manifest. Publication follows Source-PR-Gate → SHA-bound bot → server ZIP → install-mid.yml → Worker/Pages/Finalize → Stable.

This documented policy is **MID pilot inference**, not a DWD-issued corrected precipitation product or official warning.

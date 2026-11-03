# MID RUC · Open-Meteo Spatial Shadow – read-only technical starter (03.11.2026)

> **Status: DRAFT / NO RELEASE / NO PRODUCTION READ.** No changes to MID forecast, workers, map renderers, existing RUC/EPS/Fast, signatures, Pages/R2, CAS, ZIP, install or stable branches. This is observational tooling only, not an application build. No new paid services.

## SHA-fenced source baseline
- `MeteoMartini/MID`, `main=mid-stable`, app v0.9.85.414, SHA `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66` at exploration start.
- Five active rulesets; overlapping .415 Design PR #633 and RUC P0–P5 drafts exist. This candidate is kept independent and must be refreshed from the latest promoted stable before any source release.
- Binding contracts: `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `MID_DWD_RUC_PIPELINE_CONTRACT.md`, `MID_COST_GOVERNANCE_CONTRACT.md`.

## External evidence and limits
- Open-Meteo merged native ICON-D2-RUC downloader/API support, PR: https://github.com/open-meteo/open-meteo/pull/2186 .
- Official Open-Meteo distribution: https://github.com/open-meteo/open-data . `data_spatial/` publishes one cloud-native .om file per valid time; `latest.json` is completed, `in-progress.json` may be partial. `data/` time series can interpolate missing native steps and **must not be used to claim native time resolution**.
- Public metadata verified 03.11.2026: hourly `dwd_icon_d2_ruc_native` advertised 67 variables, 28 steps, +27h; `dwd_icon_d2_ruc_native_15min` 12 variables, 109 steps, +27h. A model-level metadata source exists. Individual fields, not all variables, still require original DWD value/interval proof.
- **IMPORTANT:** Presence of `crs_wkt="ICON Native Grid"` does not establish 542,040 native DWD cells or original sampling / geometry. Native GRI​B bitmaps, missing cells and exact values require separate per-cell A/B tests.
- No confirmed equivalent native 5-minute TOT_PREC spatial series, no 20-member RUC-EPS spatial dataset, no complete MID Severe / WW semantics. Open-Meteo `weather_code` may be derived. Do not silently substitute for original GRIB / WMO.
- Official DWD ICON-D2/RUC geometry: 542,040 cells (DWD model documentation).
- Public AWS S3 origin: `https://openmeteo.s3.amazonaws.com/data_spatial/` ; the `data-spatial.open-meteo.com` CDN enforces `localhost` / `*.open-meteo.com` referrers (see https://github.com/open-meteo/maps). Do not assume browser access from MID. No credentials/API keys required for this metadata-only tool. CC BY 4.0 with proper DWD/Open-Meteo attribution; CDN traffic/cost and commercial rights require explicit review.
- Weather map layer https://github.com/open-meteo/weather-map-layer is marked not fully production-ready. SharedArrayBuffer requires COOP/COEP, otherwise worker-copy fallback. MapLibre/iOS, NoData masking, exports and color fidelity need tests.

## Read-only shadow probe
- Tool: `node tools/ruc/openmeteo_spatial_shadow.mjs`; for uncompleted data: `node tools/ruc/openmeteo_spatial_shadow.mjs --in-progress`.
- Tests: `node --test tools/ruc/test_openmeteo_spatial_shadow.mjs`.
- HTTPS host/path hard-coded, only approved public manifests, short timeouts, redirect rejected, response-size limited, no writes, no tokens, no API-key usage.
- Validates UTC init/valid axis, 27h expected coverage, native parameter-specific temporal grids, duplicate/missing dates, targeted field inventory, 4h age *diagnostic*, same-run cross-domain check and explicit gaps.
- It **always** returns `productionEligible:false`. Metadata is not GRIB and cannot attest cell-level values, native resolution, source GRIB SHA, metadata accuracy, EPS20, rapid 5-minute products, model-run processing provenance or end-client freshness. Never wire this directly into the production ruc or model maps publisher.

## Proposed architecture (gated)
1. **Shadow A/B sample:** pin exact model run + UTC valid time, obtain DWD original GRIB cells (including bitmap/sentinel and 542,040 native CLAT/CLON) and matching OM chunks. Compare selected fields at native cells across full extent, including boundary, missing and physical extremes. Native-grid coordinate identity MUST be established, not inferred from WKT text.
2. **Field semantics:** DWD T2M(K)/OM °C, PMSL(Pa)/OM hPa, U/V(m/s), gust backward max, 15-min precipitation sums and WMO weather-code derivation. For any derived field, document precise equations and cannot label as unchanged DWD original. Do not replace 5-min precipitation or EPS20.
3. **Batch prototype:** immutable `run/<UTC>/<sha>/` segmented outputs for matched standard fields only. Separate processed OM from original DWD provenance. Use single-run mapping; do not combine mixed-cycle hourly/15min. Point maps/widgets/exports must see same committed manifest. Prefer chunked range reads / cache over rendering all frames as static PNGs.
4. **Reliability & QA:** test multi-day update latency (DWD available → OM in-progress → OM completed → MID client), P50/P95 and missing source runs; no invented SLO. Check response CORS, Range, COOP/COEP, Safari/iOS, browser memory, 320px mobile, accessibility, pixels, export, light/dark, no stale slices.
5. **Release only after:** full source-PR gate → exact SHA bot merge → server-side ZIP → `install-mid.yml` Core/Heavy/Worker/Pages/Finalize → stable, and independent protected original-data/fast/Pages CAS admission as applicable. No direct main/stable writes, no gates bypassed, no data source auto-enable.

## Product decision / default
Recommended future target: OM spatial as optional processed auxiliary layer for proven ordinary fields; DWD original for high-frequency, EPS20, safety and full-grid products. No production switch or new paid service is authorized by this draft.

## Library licensing blocker (verified)
- The published `open-meteo/weather-map-layer` `LICENSE` file declares **GNU GPL version 2**; the separate `open-meteo/maps` demo also uses GPL-2.0. Do **not** add `@openmeteo/weather-map-layer` or copy its source into MID until the actual package license, MID distribution policy, iOS linkage and derivative-work implications are reviewed and compatible. The AWS **data license CC BY 4.0** is separate from source-code licensing.
- Prefer an independently implemented and license-compatible `.om` reader / batch renderer (after independently verifying reader-library licenses) if required; no implementation license shortcut. No new dependency introduced in this PR.

- **Expanded audit:** both `@openmeteo/file-reader` (npm GPL-2.0-only) and `open-meteo/python-omfiles` (GPLv2) are GPL as well; `open-meteo/om-file-format` exposes GPLv2. Neither the map layer nor the reader can be presumed to be permissively licensed. MID's public repository exposes no root LICENSE/COPYING in the examined Stable paths; that does not grant an integration right. A legal/distribution audit is a strict precondition for shipping any GPL reader in Web/iOS. No GPL package is installed here.
- **Architectural consequence:** direct OM spatial consumption is conditional on acceptable reader licensing and proven decoded data quality. If either fails, prioritize a one-pass DWD-native GRIB batch using existing MID ecCodes tooling rather than forcing the OM route. Standalone use as metadata-only source monitoring remains independently viable.

## Batch-Reuse plan (read-only) – verified from MID source

The current stable source `tools/ruc/build_model_map_fields.py` has `HOURS=(1,2,3,4,5,6,12,24,48)` and `FIELDS=('t_2m','pmsl','u_10m','v_10m','vmax_10m','clct','ww','t','relhum','tot_prec')`; cumulative precipitation requests both T+h and T+(h-1). `build_precipitation_totals.py` independently requires cumulative terms 0/6/12/24/48. The original native RUC core has 12 required hourly parameters and the optional RUC synoptic sidecar rereads PMSL and CLCT. The latter can already skip network requests when the verified same-run stage is preserved; existing `prepared_snapshot.py` has a partial PMSL/CLCT cache. **Do not interpret any planner overlap as proven additional internet traffic reduction.**

New shadow: `node tools/ruc/dwd_batch_source_plan_shadow.mjs --icon-d2-run 2026110306 --ruc-run 2026110307`; tests `node --test tools/ruc/test_dwd_batch_source_plan_shadow.mjs`. Pure, no network, no raw dataset, no Publisher.

With the above existing target-field schedules the planner enumerates 496 source references (99 regular map + 5 regular cumulative totals + 336 native RUC core + 56 RUC synoptic), 430 unique typed keys, **66 overlap references**. Of those, 10 repeated regular precipitation terms and 56 repeated RUC native PMSL/CLCT terms. This is a **logical source-key count only**, not a measured volume or SLA reduction. It deliberately uses distinct separate ICON-D2 and RUC run stamps and native/regular-grid identities. Full reusable admission requires per-file SHA256, GRIB header/bitmap, exact run, step, level, source URL, original units and verified physically valid source values; no cross-model/cross-run/regridded/source-processed equivalence is presumed.

### Real byte-range shadow (new)

`node tools/ruc/openmeteo_spatial_byte_shadow.mjs` with optional `--in-progress`. For each allowlisted spatial model, selects 3 distinct validity steps beyond T+0, constructs the documented immutable `data_spatial/<model>/YYYY/MM/DD/hhmmZ/YYYY-MM-DDThhmm.om` URL, sends one 64-byte HTTP Range GET, requires HTTP 206 and Content-Range bytes 0-63/size. It computes SHA256 of **only the first 64 bytes**; this is explicitly **not** an object/source integrity proof. HTTP 200 for a whole-object request is rejected without reading it. No OM data decoder is present, no wasm or GPL dependencies added, and `productionEligible` remains hardcoded false. Run `node --test tools/ruc/test_openmeteo_spatial_byte_shadow.mjs` for 10 additional isolated tests.

**Execution limits:** The exact-readonly metadata JSON checks succeeded previously. A direct live binary Range/HTTP 206 test has NOT yet completed because this session's external binary browser execution is unavailable; full Node tests are committed but should not be marked run unless a SHA-bound job verifies them. No original field/grid equivalence, CORS, iOS/PNG/SVG, EPS20 or 168h freshness is claimed. Do not change current RUC/Pages/Worker consumers.

## RUC native staged-GRIB SHA shadow (new; no production read admission)

Run `node tools/ruc/dwd_staged_source_sha_shadow.mjs --stage <existing-stage-path> --run YYYY-MM-DDTHH:00` against an already generated, exact native 27h DWD staging tree. This **never** downloads or rewrites sources, and only inventories the existing `<stage>/<run-folder>/deterministic/PMSL` and `CLCT` trees. Tests: `node --test tools/ruc/test_dwd_staged_source_sha_shadow.mjs` (six synthetic-fixture cases).

The file-level inspector rejects symlinks, unexpected objects, duplicates and missing 0..27h leads; verifies file sizes; streams each raw GRIB into SHA256 with before/after stat to detect concurrent replacement; records per-file and whole-inventory digest. It is intentionally **not** a GRIB2 decoder and cannot prove WMO parameter/level/unit/bitmap, DWD URL identity, spatial 542,040 cells, complete originals or suitability of any data for a public client. `productionEligible:false` is unconditional. No replacement of protected original-signature / CAS / release gates.

The existing MID downloader skips already-present files larger than 100 bytes. Size-only skipping is not a sufficient SHA-verifiable proof for more aggressive shared batching. A future implementation may reuse exact bytes only after a signed inventory and original GRIB semantic admission, ideally preserving the existing staged snapshot/rollback and independent subprocess boundaries (ecCodes/pyproj crash isolation).

### Verification log – scoped carefully
- The new eight JavaScript modules, including test modules, compiled successfully in an isolated V8 **syntax** check at PR HEAD `9afe693e0c10dd08d4d65329e36861992dc7af6a`.
- Additional exact-source isolated checks: 13 planner invariants and 10 byte-range *mock-protocol* checks passed. Earlier pure manifest checks: 8 passed. None is a substitute for Node's real native test runner, live S3 HTTP 206 proof, DWD original GRIB A/B or browser/iOS readbacks.
- The available Vitest Unit-/Coverage-Pilot reported success for that PR HEAD, while other workflow triggers were skipped. The new separate Node tests are **not assumed executed by that pilot** and must be explicitly run at a pinned SHA before promotion.

## Live S3 HTTP 206 A/B readiness – actual CI run evidence

**Read-only original-source qualification remains INCOMPLETE.** Verified 03 Nov 2026 in GitHub Actions using public AWS/Open-Meteo, no API key and no production worker connection.

- First genuine shadow attempt, run **#41606704209**, failed correctly: upstream `temperature_850hPa` / `geopotential_height_500hPa` capitalization was rejected by the overly restrictive original metadata parser; the source `reference_time` has seconds while the valid-time strings do not. No data was admitted. Tests were updated to preserve exact UTC and approve only the canonical `hPa` suffix.
- Subsequent **#41606979769** passed its real S3 run: exact common upstream model init **2026-11-03T08:00:00Z**, hourly 28 times/67 variables, 15-minute *published axis* 109 times/12 variables, model-level hourly 28 times/9 variables, each ending +27h. `HTTP 206` and `Content-Range` proved for 9 pinned immutable objects (three distinct validity times per domain, no T+0 accumulation assumption).
- Object sizes reported by S3 ranged from **1,473,792** to **11,874,536 bytes**. Only **64 bytes per object** were read and hashed; these SHA fingerprints cover first bytes *only*, not the object body, native grid, actual weather values, GRIB bitmap or complete provenance. `productionEligible:false` always.
- Following DWD Python batch implementation, GitHub CI **#41607592132**, full success: **38** Node shadow cases, **8** Python DWD exact-URL dedup cases, existing Vitest coverage, live S3 read-only shadow and unrelated read-only release-origin regressions. This is a source pilot, **not** Source PR Gate or production release.
- Field-level native 15-minute cadence is **not** inferred from 109 published validity steps. The manifest audit now calls this `publishedAxisStepMinutes` and explicitly returns `nativeFieldCadenceProven:false`. A 15-minute axis cannot upgrade hourly raw DWD fields into native 15-minute original data.

## First active algorithm-preserving DWD intra-batch enhancement

- `tools/ruc/dwd_stage_batch_reuse.py` deduplicates **only the same exact resolved, HTTPS DWD ICON-D2 GRIB URL** with unchanged field and GRIB lead. No cross-run/cross-grid/data-field equivalence, partial values or spatial smoothing. Uses bounded existing download worker concurrency and validates the loader's returned actual compressed-input SHA256 label before materializing original ordered references.
- `tools/ruc/build_model_map_fields.py` now replaces the duplicate concurrent `pool.map(load,jobs)` with the verified helper. This is the **regular-grid (DWD original remapping)** map path, NOT 542,040-cell native RUC. It still uses the exact same ecCodes decoder, original run/validity checks, data arrays, original provenance and source order.
- Per current full 9-frame schedule, **99 source references** include exactly **94 unique URL requests**. Deduplicating five identical TOT_PREC URLs can avoid five HTTP downloads and five ecCodes decodes **in this map-building invocation** if the full run completes. The expected reduction is a deterministic request-count bound, NOT a measured elapsed-time saving or real GRIB byte-equivalence proof.
- `tools/ruc/test_dwd_stage_batch_reuse.py`: eight stdlib offline fixture tests for unchanged ordered entries, duplicate URL admission, cross-step/cross-parameter rejection, untrusted URL rejection, fatal source failure, source identity SHA, and Missing sentinel preservation. Actual production source remains guarded by all regular existing DWD/eccodes/Pages/installer gates prior to merging.

## Remaining blockers to production

1. Run real original DWD GRIB vs decoded Open-Meteo OM native **same run, same cell and parameter** A/B, verify native 542,040 cell geometry plus water-equivalent/units/missing masks, extrema, backward-max, all accumulation intervals and explicit 5min/15min source clocks. GPL decoder licensing remains unresolved.
2. Run multi-cycle real DWD maps A/B for exactly equivalent uncompressed and gzipped outputs (except intentionally variable `generatedAt` metadata) with precise in/out compressed source SHA and GRIB GRIB-header checks; benchmark duration and transferred bytes.
3. Retain all EPS20/5min source, 27h/168h, atomic CAS Pages, original signer, last-good snapshot, 900MB storage budget, source-gate and user-facing end-to-end freshness requirements. No promotion based on the shadow pilot.
4. The branch-scoped S3 live step is a **Draft qualification**, not a general online dependency for all future MID mandatory tests. Move or remove the experiment-only trigger before integration; keep deterministic offline source checks.

## Scientific evidence update: actual OM arrays and DWD source A/B (03 Nov 2026)

These are **empirical observations from one pinned original 07Z model cycle, valid 08Z**, not universal performance limits and not approval to replace DWD safety products. Exact machine-readable reports and raw source SHA256 are printed in GitHub CI logs; no production field has changed.

- GitHub Actions #41608382570 (science only): 3 complete actual OM spatial objects verified by full-stream SHA256. `temperature_2m` hourly, `precipitation` quarter-hour and `temperature_80m` model-level each have `[1,542040]` array elements. **Native coordinate order, units and source values not proven by shape alone.**
- GitHub Actions #41608899106: original DWD RUC 2026-11-03 07Z +1h `T_2M` unstructured grid, exactly 542040 cells, unit K, bitmap present, original missing sentinel 9999. 525072 paired finite cells / 16968 Missing original and OM / 0 missing-mask disagreements; source-vs-processed °C mean absolute error 0.0125083°C, p95 absolute 0.0237733°C, max 0.0249580°C; all paired cells within 0.1°C. Matching arrays strongly support same cell **index sequence** for this parameter/run but cannot establish exact CLAT/CLON coordinate identity. Open-Meteo temperature output is **lossily rounded**, not GRIB bit-identical.
- GitHub Actions #41609402060: same 07Z T+1h direct original GRIB vs processed OM, **5 more entire 542040-cell fields**, 525072 paired finite/16968 missing/zero mask disagreements each:
  - PMSL: MAE 0.0250332 hPa, max abs 0.0499707 hPa (DWD Pa converted /100).
  - U_10M: MAE 0.0249897 m/s, max abs 0.0499620 m/s.
  - V_10M: MAE 0.0249760 m/s, max abs 0.0499859 m/s.
  - VMAX_10M: MAE 0.0249514 m/s, max abs 0.0499383 m/s. Original DWD GRIB confirms `stepType=max`, `startStep=0`, `endStep=1` (maximum over 0–1h), not an instantaneous field.
  - CLCT: MAE 0.157296 percentage points, max abs 0.5 percentage points (DWD unit %).
- In total **six fields with actual full-cell numeric A/B**, original source bytes/SHA, GRIB parameter/run/valid/bitmap and processed OM source SHA. Confidence increases substantially for an optional **processed-only visualization shortcut**, not for native original lossless data, official warnings, severe/fusion/EPS20, real maps without full QA, or replacing native DWD high-frequency 5-minute products.
- Unresolved: more model cycles and valid hours, 15min native precipitation interval/accumulation, CAPE/phase/WW derivations, extreme wind max preservation, unstructured CLAT/CLON index proof, lossless vs quantized field policies, iOS/MapLibre/exports, end-client freshness P95 168h, GPL reader licensing for production. Existing DWD-original source always canonical for high-stakes native fields.

## First genuine 15-minute cumulative RUC precipitation A/B

Read-only real DWD GRIB + processed OM test at **2026-11-03 07Z, +15m and +60m**, with explicit cumulative GRIB interval checks, GitHub Actions **#41610707633** and enhanced trace-detail **#41611014756** (both science QA; final 41611014756 fully successful).
- Original GRIB `TOT_PREC`: ecCodes `stepType=accum`; `stepUnits` is numeric WMO Table 4.4 code 0=minute for +15m, 1=hour for +60m (https://codes.ecmwf.int/grib/format/grib2/ctables/4/4/); `startStep=0m` and `endStep=15m` at T+15m, `startStep=0` and `endStep=1` at T+60m. Strict original grid `unstructured_grid`, 542040 cells, `paramId=228228`, water-equivalent unit `kg m**-2` converted using 1 kg/m²=1 mm.
- Interval **0–15min**: compare genuine original cumulative DWD T+15m vs processed OM T+15m for all 525072 valid cells. Missing 16968 both, mask mismatch **0**. MAE **0.00271388 mm**, max abs **0.0499939 mm**. Strictly positive original DWD cells **282092**, of which **273706** positive but less than **0.05 mm** are quantized to zero in OM. Original zero **242980** vs OM zero **516686**. Exactly **0** original cells with >=0.05 mm mapped to OM zero.
- Interval **45–60min**: compare DWD original cumulative T+60m **minus** cumulative T+45m vs processed OM interval T+60m. Again **525072** paired cells, **16968** missing both, mask mismatch **0**. MAE **0.00266265 mm**, max abs **0.0499878 mm**. Strictly positive original DWD cells **227591**, of which **217108** positive but less than **0.05 mm** map to OM zero; **0** original cells with >=0.05 mm mapped to OM zero. DWD diff contains **28612** tiny negative numerical subtraction artifacts down to ~ -0.000061 mm; leave explicitly diagnostic, **never present negative rain or silently turn Missing into zero**.
- Quantization is materially consequential to tiny / trace precipitation occurrence and a consumer's wet/dry threshold. Do not use OM zero as proof of verified DWD dry. Strict native 5-minute product, 5-minute peaks and server-side forecast-fusion/warnings remain DWD originals. This experiment does **not** infer an original native 15-minute cadence after the DWD 0–6h window from a published 109-step OM axis.
- No production provider switch is admitted. Historical two-timeslot/one-run A/B does **not** prove 168h freshness P95, all fields, WMO WW, CAPE, extremes, 20-member RUC-EPS, full CLAT/CLON spatial identity or user-client fidelity. OM file readers remain GPL-2.0-only **ephemeral QA**, never shipped with MID.
- Initial experimental runs #41610085390 and #41610452989 failed *correctly* before values due ecCodes metadata formatting `startStep=0m` and numeric WMO code `stepUnits=0`; fixed by explicit WMO Table 4.4 minutes/hours parser (no relaxation of run/valid/interval/bitmap/units validation). Completed evidence: GitHub Actions #41611014756.

## Three-run native-cell and full-grid provenance (03 Nov 2026)

The following are read-only *scientific QA observations* at pinned source runs. They do not constitute a release or authoritative substitution of original DWD data.

**GitHub Actions #41624459947, successful:** 3 original DWD ICON-D2-RUC runs (06Z, 07Z, 08Z), 2 leads each (+1h, +6h), and 2 raw-vs-processed native fields (T_2M, VMAX_10M): **12/12** full-native-cell tests, **6,300,864** paired finite values, **zero** Missing-mask disagreements, 16,968 source Missing cells per field/time. Maximum observed processed-vs-original errors were less than **0.025°C for T2M** and **0.050 m/s for gusts**. All original gust headers independently confirmed max-over-interval semantics, including T+5h→T+6h. These observed processed-OM quantization envelopes do not approve any other field or warning threshold.

**GitHub Actions #41624843187, successful:** all original DWD CLAT/CLON coordinates, 542,040 cells each, verified in **three runs**, exact index order and normalized coordinate-array SHA256 identical over the runs. CLAT digest: 6e525a447ea8c8c5bc3b4cf000648c78c6a3d80b86d7e6015a6ed4f6eda2737b; CLON digest: 4c533abbc98dfafd7d9068b982c9f5fa005545b5d8714b80e8875029751d3c2b. Source units are Degree N/E. Original lat bounds 43.044048…58.164654; lon bounds −4.161636…20.544418. This proves **original DWD geometry invariance**, not independently verified OM index-to-coordinate linkage.

**MID RUC native geographic lookup limitation:** current stable RUC_BBOX=(-3.85,43.18,20.22,58.05), 0.025° lookup spacing, max 5 km nearest-cell distance. Original DWD T_2M, 07Z+1h: **1,910 native coordinates outside this bbox**, among them **79 valid original temperature cells** and **1,831 Missing**. Inside the bbox: **524,993 valid / 15,137 Missing**. The map-candidate uses the complete current lookup grid, not automatically the complete geographic span of original 542,040 DWD cells. The measured small valid edge discrepancy merits a client coverage audit, not an unqualified immediate enlargement that might violate Pages budget or quality gates.

**Upstream renderer capability warning:** At exact open-meteo/weather-map-layer commit 10e1f3ad18c91160c2d1f55566ef8986fccee063, the public domains registry has NO dwd_icon_d2_ruc_native; its DWD ICON-D2 entry is a **regular grid**, not the native RUC unstructured grid. Its GridFactory supports regular, Gaussian and projected grids, not unstructured ICON native cell geometry. A direct native RUC rendering swap is therefore NOT supported by that upstream package. GPL-2.0 licensing, WASM/workers and cross-origin isolation further block silent production adoption. Existing MID native grid and DWD-original rendering remain canonical.

**CI lifecycle:** exploratory pinned historical live-DWD/OM downloads were removed from the routine unit-coverage GitHub workflow after collection of reproducible SHA/URL evidence, to avoid making every future PR dependent on historical objects, third-party GPL reader downloads, network availability and retention limits. Canonical ci/github and active .github workflow mirrors continue to run existing Vitest/coverage/provenance QA plus four offline Node shadow suites and eight offline Python DWD source-batch tests. Live science scripts remain reviewable as optional independent CLI studies; nothing using omfiles was added to the shipped application.

**Remaining release gates:** original EPS20 and five-minute native fields, independent OM coordinate mapping, multi-parameter/severe/long-horizon A/B, browser/iOS/widgets/exports, legal/provider rights, measured throughput and end-client freshness/168h, 900MB atomically fenced Pages, full versioned source PR and install-mid.yml stable promotion. No official warnings or source provenance changed. PR #636 must remain a Draft until those gates or a separately qualified reduced-scope delivery are explicitly handled.

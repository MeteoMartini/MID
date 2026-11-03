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

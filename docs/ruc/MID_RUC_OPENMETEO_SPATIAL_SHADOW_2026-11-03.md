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

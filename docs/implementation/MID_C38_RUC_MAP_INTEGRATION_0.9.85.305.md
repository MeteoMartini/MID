# MID-C38 · native RUC map integration · 0.9.85.305 candidate

Verified released base: main=mid-stable=438bfb7838a727ad8753940872c8b8ab140bb7c2 (.304). Parent pilot: af75157ee858d6c5e45e1bd213dfc46f73cc0d49 (#431), including parallel source-immutability and lookup contract hardening. #425/#431/#432/#433 are left unchanged. Source branch: chatgpt/v0.9.85.305-ruc-map-integration.

## Behavior

Six native RUC products in the common Karten model selector: temperature, pressure, wind, gust, cloud, hourly precipitation. Catalog-driven only; no synthetic Open-Meteo ID, ICON-D2 substitution, extra forecast family vote or map-only data entering fusion. UTC hourly source terms0…27; gust/precipitation start+1h. The original deterministic/EPS/fusion0…14h contract is preserved. +27h source is optional and bounded to180s; complete core source remains usable if the tail fails. Grid/GRIB/unit/interval/NoData validation is inherited from the native preprocessor; int16 overflow is rejected rather than clipped.

The entire original compressed core must decode bit-exactly to the source prefix. Lookup SHA and contract, all old inventory objects and actual file inventory must agree. Map generation repeats source manifest/file checks at handoff (parallel #431 correction retained). Admission converts explicitly inactive candidate schemas into distinct published schemas only after complete checks. Pressure contours and centers use the same RUC pressure raster. Immutable namespace, all new SHA/bytes verified, final pointer atomic. Existing codec proof, old objects and previously archived raw rollback unchanged. Total snapshot budget stays strictly below900000000bytes including latest.json. Partial writes clean up; rejected budget/source leaves old pointer untouched.

Browser verifies root/index/frame schema, byte count, SHA, source model, absolute UTC axis, complete identical horizons, interval/units, four-hour freshness and safe immutable paths. RUC NoData becomes internal NaN and stays transparent/null in point queries; authentic dry zero is preserved. Same color/value formatter, legend, favorite table, SVG/PNG renderer. RUC source captions and export filenames are explicit. Nearest raster resampling preserves displayed cell boundaries. Pressure auxiliary layers require the same source, run and valid time; no ICON-D2/RUC mixing.

## Checks and remaining release gates

- Reproducible npm ci --ignore-scripts; existing dependency/lockfile versions retained.
- Focused RUC candidate/archive/horizon/source/admission Python tests passed, including corruption, old-core drift, budget rejection and partial-write rollback.
- Dynamic JS tests passed: UTC across four timezones,14/27h completeness, freshness, index SHA, units, NoData versus zero, six-product capability, selection persistence, export source.
- Existing adaptive native map, presentation/point and workflow mirror/coordination checks passed.
- TypeScript and production build passed locally. Build identity refers to current committed pilot parent plus worktree; not a release artifact.
- Actual .304 artifact replay/admission passed: all397parts, final379704626bytes, old objects/source/codec proof unchanged (MID_C38_RUC_REAL_ADMISSION_0.9.85.305.json). Core1007/1007 passed in190s, production dependency audit0vulnerabilities. Browser matrix and enhanced native27h admission canary remain in progress. One tablet WMS resource-timing assertion timed out after the new RUC/reload cycle; resource timing buffer cleared at the existing verification boundary and extra diagnostics added, assertion retained; rerun pending.
- Source-PR Gate, SHA-bound MID bot, server ZIP, installer, Worker/Pages and exact stable promotion remain required. This document does not claim publication or physical iOS/WKWebView/VoiceOver acceptance.

## Prior real-data evidence

Read-only native horizon run39502837253 (head37380f65b4f290a4708d14ef577c031e3795ce63): artifact12303036848 SHA e325301081908643010b3c7e627765e1d751f07166f139efdd998a9eae3e9e51. Three native runs19/20/21UTC20October2026,28terms,12fields,542040points; map candidates22157660–22181296bytes. This proves bounded native hourly availability and numerical validation, not EPS+27h or complete production readiness. Later parallel hardening is recorded in #431, including independently inspected498frames. Do not treat old runs as current freshness evidence.

Released .304 RUC archive run39495600947 artifact12299022607 SHA83da6240488a315ca7d85aeea728a7272845f3a00ebca6ce972f558be5cbef21 is re-downloaded and SHA-verified for integration replay.

Open separate work: #428 provider DST/cache/daily migration; #374 live/device acceptance; #350/#352/#405 retain EPS/full rapid/science/SLO scope. No blanket issue closure.

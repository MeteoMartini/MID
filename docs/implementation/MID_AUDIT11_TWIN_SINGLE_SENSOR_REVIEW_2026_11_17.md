# MID Audit 1.1 · Single-source Weather Twin scientific review and day-coverage QA

**Draft QA handoff / NO MERGE / NO RELEASE / NO PROD ENABLEMENT.** Source: 20261117_MID-Audit(1).pdf (pp. 2–6); user requests a fundamental examination of one-person / one-device learning. Verified published `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, `v0.9.85.488` (three synced mirrors), 5 active rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_FORECAST_CONSISTENCY_CONTRACT.md`, current Lead #902 and Audit #905/#907/#910.

## Decision recommendation (subject to user's product decision)

**Keep the Weather Twin concept, but separate three independent capabilities:**
1. **Personal utility/recommendations** (commute/ski/outdoor preferences) do not require a private weather device; existing forecast and official observation sources suffice.
2. **Observational locality**: optional fixed-site measurements can give valuable current microclimate information at that site, with parameter-specific sensor/siting/time/unit labels. This does not by itself improve the forecast.
3. **Experimental forecast calibration**: only comparable real forecast–observation pairs from independently measured, quality-controlled references (official station first, private sensors optionally) can train a *site-specific, parameter/horizon/season-specific* adjustment. A device may be an independent measurement source relative to the forecast, but is not thereby independently quality-validated, nor representative of a neighborhood/city. Never generalize the learned device bias to other favorites/locations or users without a scientifically validated spatial model. Prefer the unmodified baseline when prospective holdout skill and uncertainty are not demonstrated.

Official observations, independent sensor reports and gridded/reanalysis/model data MUST remain separate provenance categories. No user/device should be required to receive the baseline forecast. Do not create a private, cross-user network or enable telemetry without opt-in/privacy/licence/cost review. No change to warning authorities.

## Observed production-code concerns

Stable `src/forecastVerification.ts` blob `b22df30c1ad32237ba863b882f279623fea53339`:
- `recordLiveTwinObservation` stores public station observations; `recordCustomSensorObservation` accepts private sensors. `referenceRequest` also reads Best Match history and ERA5-Land, but `isIndependentTwinReference` correctly excludes model-fallback/reanalysis for scientific evaluation.
- `recordCustomSensorObservation` assigns private sensors a default `quality: 0.88` without evidence of professional siting/calibration or independent external QC; private and official sources have equal rank in `observationPriority`. This is an engineering default, **NOT a verified reliability estimate**.
- `observationTimelineComplete` currently permits `minimumHours=18`; `aggregateLiveReferences` aggregates such precipitation series as a single **daily precipitation total**, while `isIndependentTwinReference` accepts `coverageHours>=18`. A legitimate six-hour gap can be labelled a valid dry day/low rainfall even when rain occurred in the missing period. This is a distinct risk from NoData-to-zero issue addressed in #910.
- `aggregateLiveReferences` requires **both** a qualified temperature series and precipitation series before it emits any day, even though the later `modelParameterErrors` / `modelBiases` now support parameterwise missingness. A temperature-only sensor can thus fail to contribute temperature-specific verification. Do not invent rainfall for such a sensor.
- `mainForecastStatus` currently accepts `validationDays>=6` with nonnegative in-archive paired skill, and `healthReport` can label a short series `belastbar`. These are not sufficient evidence of statistically generalizable future improvement, especially for rare events, seasons, and a single site. No scientifically measured improvement is claimed here.

## New independent source-QA foundation

`src/twinPrecipitationPeriodEvidence.ts` exposes `verifyTwinDailyAccumulation`: **O(n), allocation-free**, strict consecutive original accumulation intervals, common source ID, finite nonnegative amounts without extreme clipping, exact absolute timestamps for the *local-day* start/end (23h/24h/25h). Unknown/missing/holey/overlapping source segments never silently become a 0-mm day. The helper returns a result with `totalMm` **only for a complete interval proof**. The seven Vitest groups cover 18h false day, genuine 0 mm, actual rainfall, end-boundary/gaps/overlap, mixed source, extreme, and 2026 Europe/Berlin DST transitions.

**This helper is NOT yet connected to production.** Current `TwinLiveObservation` stores only sample timestamps and optional `precipitationIncrement` / `precipitationRate`, not trustworthy accumulation `startMs/endMs` boundaries. Such interval metadata must come from the original source or an independently justified measurement contract. Never manufacture it from the next timestamp or interpolate/fill missing intervals; if absent, preserve NoData and block daily amount-based verification. Dedicated source-specific coverage, unit and timeliness QA is also needed. For instantaneous temperature/gust, use independent parameter-specific continuous-coverage and sampling checks; this rainfall helper must NOT be used as that proof.

## Integration sequence and acceptance

1. Leitchat owns active `src/forecastVerification.ts` already edited by #902/#905; #907 and #910 address disjoint NoData/display/observed-regime QA. **No full old source blob overwrites or release gate bypass**. Port only after fresh Stable/main SHA, PR diff ownership and source contracts.
2. Preserve existing valid archived forecast captures (issuedAt, leadHours, original predictions), original weather extremes, source type. Add per-parameter reference validity/source/time/coverage; do not require an unrelated second sensor just to verify the first parameter.
3. Audit complete interval time semantics (rate vs increment, UTC accumulation-end, 23/25h local days) and source QC, then run **independent prospective, time-blocked paired baseline-vs-adjusted comparisons**. Use 30/90-day diagnostic windows as proposed product review targets, NOT alleged WMO statistical sample minimums. Report effective events, paired MAE/Brier/CRPS as applicable, block-bootstrap confidence intervals, adverse/seasonal regimes and guard against short/hindsight training leakage. A nonnegative improvement based on six days alone must not be labelled proven.
4. Do not enable or replace the main forecast from this QA-only candidate. Existing `useAsMainForecast:false` default remains. QA: Vitest/TypeScript, pre-existing #886/#890/#897/#899/#905/#907/#910 paired/NoData/DST regressions; then full Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable on final SHA. Real browser/320–1440 px/200% text/iOS/VoiceOver/production weather QC **not yet tested**. Existing picomatch HIGH security #903 remains an independent binding release blocker.

## Original scientific sources
- Met Office, WMO-based parameter-specific siting: https://weather.metoffice.gov.uk/learn-about/how-forecasts-are-made/observations/observation-site-classification
- Copernicus AMT (2025), personal rain-gauge QC with radar/professional station reference: https://amt.copernicus.org/articles/18/3229/2025/amt-18-3229-2025.html
- MET Norway citizen observations in forecast post-processing: https://journals.ametsoc.org/view/journals/bams/101/1/bams-d-18-0237.1.xml
- ECMWF forecast calibration: https://www.ecmwf.int/sites/default/files/elibrary/2014/9607-calibration-medium-range-weather-forecasts.pdf
- DWD open historical/recent station observation index: https://opendata.dwd.de/climate_environment/CDC/

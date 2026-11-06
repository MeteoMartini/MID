---
applyTo: "src/**,worker/**,worker-src/**,tools/ruc/**"
---

# MID meteorological and data-integrity rules

- Read `MID_FORECAST_CONSISTENCY_CONTRACT.md`, `MID_DWD_RUC_PIPELINE_CONTRACT.md`, `MID_PARAMETER_DISPLAY_PRECISION_CONTRACT.md`, related warnings/skybar contracts and `contracts/index.json` where relevant. Existing tests are part of the contract.
- State source, provider, model/member, initialisation/analysis run, valid time, lead, accumulation/averaging window, CRS, spatial coverage, height/level, unit and uncertainty before transforming a field. Check DST/local-time interpretation.
- Do not treat unavailable/NaN/invalid data as 0 or carry stale data as fresh. Preserve genuine precipitation/wind/snow extremes; no unevidenced temporal/spatial smoothing, interpolation or invented deterministic percentages.
- Keep weather-type/SYNOP symbol semantics, precipitation phase, probability-of-precipitation interval and Skybar meaning consistent across map, forecast, widgets and export. Do not derive meteorological phase solely from styling.
- Official DWD/WMO/NWS warnings must be clearly separate from MID assessments, experimental indices and model-derived weather regimes. Never present an absent warning as an official all-clear.
- For RUC/ICON-D2: original GRIB/bitmap/field inventories, EPS member count, 5/15-minute cadence, ~27h horizons, missing flags, immutable provenance, freshness, atomic publication and failed-run recovery require end-to-end evidence. No default production activation on synthetic or partial fixtures.
- Add negative/failure and boundary-case tests for missing data, duplicate/overlapping intervals, stale run, timezone, units and extreme values. Record any unverified source availability explicitly.

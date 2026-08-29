# MID v0.9.73.6 — DWD RUC native-grid coordinate hotfix

Run #4 (`33255871924`) confirmed that the v0.9.73.5 download optimization works: deterministic hourly fields are reduced to 15 lead files for 0–14 h, including `TOT_PREC` 15/325, while RUC-EPS `TOT_PREC` is reduced to 300/6500 files. The remaining failure occurred in the compact bundle builder because native ICON-D2-RUC GRIB messages do not expose synthetic `latitudes` / `longitudes` arrays through ecCodes.

The builder now uses DWD's authoritative native ICON coordinate fields `CLAT` and `CLON`, which are published alongside the RUC parameters. The downloader stages one coordinate file per field and run. The builder validates coordinate point count, converts radians to degrees when necessary, rejects non-finite/out-of-range coordinates, and keeps deterministic/RUC-EPS point-count consistency fail-closed. No regridding is introduced; MID retains the native ICON-D2 triangular grid and its approximately 2.1 km resolution.

No Worker logic, Cloudflare binding, R2 activation, Apple entitlement, signing, paid service or infrastructure change is required.

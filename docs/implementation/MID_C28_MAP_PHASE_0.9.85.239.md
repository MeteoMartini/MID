# MID-C28 · 0.9.85.239

Released base: 3e1d25a9219e0ee1dd8d43ab06f29631f74c052a (.238).

Observation master: one switch suspends radar, satellite, lightning, cells, tracks, warnings and precipitation-type overlays while retaining each selection. Stored master and selections are restored independently. Immediate toggle writes and changed-key lifecycle writes prevent unchanged older mounted instances from overwriting newer choices. Model controls remain independent.

Contour contract: 8/4 gpdm height lines and 5/2/1 hPa pressure lines. Pressure spacing is derived from the numerical gradient; conservative minimum spacing along each line controls density at the current zoom. Below 1013 hPa pressure lines remain dashed. T/H remain exclusive to pure surface-pressure maps. Existing immutable 4-hPa payloads retain their genuine contours until a validated new producer cycle supplies 1-hPa geometry. No intermediate lines are fabricated.

Producer: 1-hPa contourpy geometry with spacing metadata; changed synoptic algorithm identity invalidates old contour caches. Native pressure geometry is stored once in the pressure product and shared by exact run/time with other products and exports. Forecast hours, grid values, provenance and existing byte limits are preserved.

Real-data measurement: ICON-D2 2026-10-11 18 UTC +0 DWD pressure GRIB SHA256 2a88959fe28719e4867edb43e4d213317c8d8dd50e185573732eef33353b89e6. Replacing the pressure component in the published synoptic payload produces consecutive 1003–1019 hPa levels, 637 features, 1,057,038 compressed bytes and 5,494,092 decoded bytes (12 MB limit). Old compressed size: 955,553 bytes. This is a one-frame measurement, not a full-run storage claim.

Weather phases: canonical loaded stylesheet now supplies compact shared rows on mobile and three columns on wider screens. Dates, character, mean temperature, ensemble coverage and quantile chart remain present. The title reflects the actual phase count. Browser checks cover maximum phase-panel/row heights and overflow, light/dark and Classic/Next.

Four source-shape regressions were updated for the intentional new contract: patch-based persistence, observation selection callback, dynamic phase count and appended C28 CSS. The original stylesheet cascade golden remains unchanged and validated.

Reference reviewed: https://kachelmannwetter.com/de/modellkarten/deu-hd/deutschland/luftdruck.html (surface-pressure/synoptic product separation and regional zoom). No undocumented adaptive algorithm is attributed to that service.

Physical iOS optical sharpness and all future numerical producer cycles cannot be inferred from synthetic browser fixtures. Source release and installer gates must succeed before stable publication.

Local verification: production build/typecheck passed; 962/962 regression scripts, 159/159 RUC scientific Python tests and 48/48 responsive profile browser cases passed. Observation persistence has an additional actual-callback test exercising stale instances and independent setting patches. Dependency audit: zero production vulnerabilities. Fresh production JS/CSS budgets passed unchanged. Map viewport shards are recorded separately before PR creation.

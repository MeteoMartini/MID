# MID-C38: isolated native-source RUC map candidate

Status: offline preparation only, not an application build or publication.
Verified base: `main = mid-stable = 438bfb7838a727ad8753940872c8b8ab140bb7c2`, v0.9.85.304.
Parallel provider-canary PR #425 is untouched. This work does not supersede its evidence.

## Problem and bounded implementation

The released hourly RUC core contains 15 times (0…+14 h), while existing native
model-map products are independently sourced ICON-D2 fields. Adding a RUC label
to those products would misrepresent their source. Simply setting the core to
+27 h also couples deterministic and EPS acquisition and exceeds the documented
raw-budget projection. No production limit has been changed.

`tools/ruc/ruc_map_candidate.py` now provides a separate, deliberately unpublished
candidate from an existing verified raw RUC point bundle. It checks the SHA-256
and byte count of `deterministic.bin` and `lookup.bin`, validates their dimensions,
absolute hourly UTC axis, field units/scales and physically bounded values, and
uses the existing nearest-native-cell lookup unchanged. It crops the display to
Germany (47…55.2 N / 5.5…15.6 E); it does not interpolate meteorological values or
claim to expose the full native triangular mesh. `maxNearestKm` and the sampling
method are explicit. Canonical forecast values, source grid and fusion remain unchanged.

Six parameter products: temperature, MSL pressure, mean wind, gust, total cloud
cover and trailing one-hour precipitation. Wind is converted from knots to km/h.
The map wire has its own candidate schema and is not accepted by any production
loader. Source and lookup NoData both become JSON null. NoData is not dry zero.
Initialization precipitation and gust have no invented preceding-hour frame.
The source's precipitation intervals are used once, without a second difference
or time shift. The candidate does not validate or reconstruct cumulative GRIB
rainfall; that remains the upstream builder's responsibility.

Display quantization is explicit (hundredths or finer, derived from source
scale), without clipping extrema. It is not a new lossless meteorological source.
Gzip transport is deterministic and each frame carries wire SHA/bytes and decoded
bytes. No new source downloads or external credentials are used by this tool.

Both 0…+14 h and 0…+27 h complete input axes are supported, up to 28 actual times.
This is tested capacity, not evidence that a complete +27 h production dataset
exists. No hours are manufactured. EPS, rapid, events, short-range fusion and
worker models retain their current contracts.

Output must be new and disjoint from the source. It is assembled in a private
sibling directory and renamed only after all fields validate. The candidate has
`productionEnabled=false` and `readyForProduction=false`. Its 100 MB offline cap
is only a bounded tool limit; it neither replaces nor proves the 900 MB RUC /
950 MB Pages admission gates. No manifest or published snapshot is touched.

## Local validation, 20 October 2026

- `python3 tools/ruc/test_ruc_map_candidate.py`: 8 tests passed. Includes complete
  14/27 h fixtures, time/run binding, explicit offsets, masks, dry zero, extremes,
  source SHA corruption, unit mismatch, invalid lookup geometry/index, empty
  fields, deterministic wire bytes, source immutability and output overlap.
- `test_ruc_pack.py`: existing packing contract passed.
- `test_grib_metadata.py`: existing 19 tests passed.
- `test_grib_bitmap.py`: existing 7 tests passed.
- Python syntax compilation passed. No application build, browser acceptance,
  native-device acceptance, Source-PR release or full regression claim.

Reproduced external access results in this Work: the minimal public Open-Meteo
request for `dwd_icon_d2_ruc_native` returned HTTP 400 / invalid MultiDomains;
public MID snapshot request returned HTTP 403; first DWD T_2M run-directory
request returned HTTP 503. These are observed responses, not proof of a general
provider outage or of corrupt production data. The existing bounded DWD retry
routine is being used separately; production protections remain unchanged.

## Required next steps before integration/release

1. Obtain current source-proven native GRIB runs and full field/bitmap/valid-time
   matrices through +27 h, including precipitation's cumulative-to-interval
   roundtrip and native gust bounds. EPS must be separately validated.
2. Produce and inspect actual candidates, measure size/CPU/memory and mask
   propagation; tests above use synthetic fixtures only.
3. Admit optional map objects after the existing independently proven full codec,
   binding source run/hash and new object inventory, with unchanged raw rollback
   and hard 900/950 MB gates. Do not mutate the old codec proof.
4. Implement model-aware map catalog, distinct source schema, freshness, missing
   cells, source/run/time-consistent pressure contours, point probe and exports.
   Never substitute ICON-D2 fields under an RUC model label.
5. Browser matrix and all release regressions; synchronize version mirrors and
   changelogs for the actual integrated application build. Then use only the
   existing source gate / SHA bot / server ZIP / installer / stable path.

Issues #350/#352/#405/#428 remain open. This candidate is not authorization or
evidence for production activation, +27 h fusion, a new model family vote, or
closing any scientific/live-device acceptance item.

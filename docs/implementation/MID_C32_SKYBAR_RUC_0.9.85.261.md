# MID-C32 · v0.9.85.261

Verified base: main = mid-stable = ab22a04d654cf4bf2d30dfa522f7825e2ba8dfa6 (.260). Open PRs at work start/recheck: #340/#339/#338/#253/#252; no overlapping source PR. No workflow, deployment policy, meteorological values, codec format or active pilot limits changed.

## Skybar

Explicit user instruction replaces the old rounded-band requirement. The shared SVG renderer paints a rectangle over the exact original time interval with constant thickness. Identical neighbors still merge through skyBarVisualRuns; tooltips retain every original interval. Base/precipitation order, opacity, Missing gaps and scientific classification are unchanged. Consumers: App detail; cockpit 90 minutes, 12/24 hours, 7-day curve/day cards and 14-day rows; WidgetGenerator curve and its PNG/URL exports through SevenDayCurveOverview. Preview/legend radii and the thin day/14-day rails are flat too. Explicit hour-square cells and broad night backgrounds are separate representations, not tapered bands.

Three historic source assertions required removed circle-cap code; they now assert the explicit C32 contract. The opacity/phase overlay test retains its no-sort/order assertion with the new map callback. Behavioral rendering coverage includes subpixel isolated intervals, all four thicknesses, true gaps and changing phases/thicknesses. Historical CSS golden is preserved: the comparator asserts exactly the two authorized zero-radius changes and restores only those properties in its private historical comparison trees. All other declarations/order remain checked against the unchanged .169 fingerprint.

## RUC progress and limitations

Read-only tool: `node tools/ruc/verify_lossless_snapshot.mjs SNAPSHOT_ROOT [1..100 iterations]`. It reads local materialized latest.json and its explicit bounded pilot/raw files, rejects path escape, verifies raw object size/SHA and byte-for-byte cross-language decoding. It checks a warm in-memory decoded cache with network unavailable, cold codec failure with raw fallback and the disabled-codec path. This is not service-worker offline persistence, physical device acceptance or permission to remove raw files.

Real snapshot: 2026-10-15 09:00 UTC; generated 09:57:32 UTC. Pilot index 132: 492480 raw bytes / 224527 encoded bytes (54.41% transport reduction for this chunk). Raw SHA 0b73d2c31a1912caaef94be17043c6aefe40095cc1686dd307ddf92c07a02289; wire SHA aed04ae4e21f574ff86f278bc414c57b1c713d6ec676c98ba0d537ffcd2d21d1. Exact local proof in adjacent JSON. Node host p95 wall 12.00 ms / process CPU 20.393 ms over 30 repetitions; process max RSS 77876 KiB. RSS is the whole Node process high-water mark, not incremental decoder memory. These values are not Cloudflare CPU or browser/iOS SLO results.

Production RUC run 38720795414 completed successfully on .260; publish job 116380950269 confirms same-run byteplanes-gzip verified=true/rawRetained=true at 10:48:16 UTC. Next scheduled data run 38726668731 was in progress at review; no premature success claim. Public snapshot may remain the same DWD run when a newer fully complete run is unavailable.

Context7 official Cloudflare Workers documentation confirmed that deployed performance.now()/Date.now() advance with I/O, not pure CPU execution. Therefore diagnostic fetchAndDecodeMs cannot replace provider CPU evidence. Source: https://developers.cloudflare.com/workers/runtime-apis/performance/ . No paid limit increase or runtime change.

## Validation

- npm ci --ignore-scripts succeeded; no dependency versions changed.
- Full local regression suite: 971/971 passed after explicit shape-contract updates.
- Chromium module/CSS suite: 56 viewport/theme/view cases passed, including widgets/mountain; no page overflow/errors. No historical paint parity comparison claimed (0 baseline snapshots).
- Dedicated rendered shared Skybar: 12 Chromium viewport/theme cases (320/390/844/834/1024/1440 px, light/dark), flat geometry and overlay/no-overflow passed; local screenshots inspected.
- Production dependency audit: zero findings for 83 package versions, provider checked; qualified dependency policy passed.
- Final production build and budget checks are recorded by the Source-PR/installer gates; release is only complete after exact stable promotion.

## Remaining work packages

1. Full RUC raw replacement remains blocked on genuine old-client persistent cache/offline compatibility, provider CPU/RAM/SLO measurements and reviewed rollback/rollout criteria. Raw copies and kill switches remain intact. This release adds reproducible evidence, not full migration.
2. More native RUC/ICON-D2 map steps require measured total product headroom under the unchanged 900000000-byte budget; no speculative coverage increase.
3. Initial CSS: the documented extreme-weather candidate has downstream shared selector overrides; do not move it lazily without computed-style/paint parity. No CSS split or broad cascade change here.
4. Unified-map release fixtures were fixed in .260; newly rechecked revision runs 38704171375 and 38705109327 are success. Dependency PRs stay independent; no blind upgrades.
5. Other skybar/map/favorite/warning/responsiveness issues require current-app reproduction. Scientific data contracts, NoData/QC, accessibility and observability continue. Physical iOS/WKWebView/VoiceOver evidence remains outstanding.

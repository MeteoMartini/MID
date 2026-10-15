# MID-C32 · RUC Codec concurrency and offline compatibility · .263

Verified base: main = mid-stable = cd453cce922fe59aaecfcf0d4d6728426c915e3d (.262). PR #370 and Installer 38735756744 completed; subsequent revision 38737676946 and RUC 38737733077 success. No workflow, permissions, budget, field, model, time, packing or data-format change.

## Operational change

The existing byteplanes-gzip reader coalesces identical cold requests using the existing origin/raw-key/manifest identity. Sixty-four simultaneous callers require one fetch/decode, not sixty-four. At most two distinct codec promises run concurrently per isolate. Extra distinct keys use size/SHA-verified raw fallback with reason codec-busy. Busy is not recorded as a codec rejection and recovers immediately after capacity is available. Success/failure clean the in-flight slot; twelve concurrent failures share one attempted wire fetch and receive intact raw fallback. Verified cache remains two chunks, rejected cache four entries, 30-second failed-codec backoff and the actual Worker's 3-second header/body deadline remain unchanged. This limits additional codec work; it is not a bound on total isolate RSS or concurrent raw network requests.

Canonical source is tools/ruc/lossless_dual_read.mjs; generated Worker mirrors are rebuilt by maintain:aggregates, not separately implemented. Raw objects and immutable pilot descriptors are untouched.

## Actual service workers and browser offline tests

scripts/verify-ruc-offline-browser-0985263.mjs registers the byte-identical original .257 SW and the current SW in separate real Chromium contexts. Legacy fixture: source e0f05c5059a6b5e88c377f433e9737423a174393, blob 9025890e5d44d880149602f2956d4782fe18cc4f (mandatory Git blob identity test). The unmodified .257 binary reader runs alongside the actual current ESM decoder. Production Worker adapters are independently covered by test-ruc-dual-read-0985258.mjs.

Both original and current SW profiles passed with the synthetic fixture and with the real published 09:00-UTC pilot (index132, 492480 raw / 224527 wire bytes; raw SHA 0b73d2c31a1912caaef94be17043c6aefe40095cc1686dd307ddf92c07a02289). The real raw/wire bytes were downloaded and verified; this archived snapshot is not claimed to be the freshest current DWD run.

The returning installed-app profile first fetches its modules under SW control. Deliberately poisoned CacheStorage entries for raw/wire/API URLs are ignored online. Offline simulation stops the fixture origin server as well as enabling browser offline: context.setOffline alone did not reliably stop the service worker's own requests in this environment. With the network genuinely unavailable, live weather fetches fail, a previously verified in-memory decode still works, and a reloaded/new JavaScript realm has no raw/codec data rather than reading poison or inventing zeros. Restoring the server and reloading recovers the codec path. This is actual Chromium/SW evidence, not physical iOS/WKWebView acceptance or a claim that all archived app/Worker versions have been tested.

## Validation and measurement limits

973/973 local regressions passed in 108.6 s. Python publisher, all 65536 int16 patterns, Python/JS/actual-Worker decoding, Missing/zero, corrupt/truncated/oversized wire, SHA/raw fallback, descriptor/run bounds and rollback tests remain required. New browser profiles are mandatory in the Source/Installer core gate. Both synthetic and real-chunk browser profiles passed locally. Final production build/budget and dependency audit are recorded in CI.

The read-only snapshot probe ran 30 repetitions on the real chunk: Node p95 wall 9.614 ms, process CPU 18.747 ms, whole-process max RSS 78940 KiB. These are host diagnostic values, not per-request Cloudflare CPU, incremental decoder RAM, provider SLOs or evidence of a sequential speed improvement. Concurrent fetch deduplication is proven by the fetch-count assertions.

## Completion boundary

The bounded transport-pilot reader, coalescing and tested .257/current SW compatibility step are complete. Full raw replacement is NOT activated. The current contract intentionally retains every old raw URL/byte/SHA; the pilot adds a compressed copy and therefore does not reduce total resident storage. The fixed 900000000-byte publication budget cannot be assumed to fit every raw object plus a full compressed duplicate. Larger chunks and a full atomically published format still require their own bounded geometry, full-product byte measurements, rollback-compatible transition and provider CPU/RAM/SLO evidence. No such missing proof is replaced by these tests; no raw object, weather field or map step is removed to claim success.

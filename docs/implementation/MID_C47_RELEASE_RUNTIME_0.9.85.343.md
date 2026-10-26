# MID-C47 · v0.9.85.343 · Release preparation and offline integrity

Base: published .342; main = mid-stable = 5883c7a5284014c8d427994914bd6dfe023b02be. Installer 40407225157 attempt 2 passed every mandatory group, Worker, Pages and fast-forward Stable promotion. No direct main/stable mutation.

## Verified failure and correction

Installer attempt 1, job 121868147973: browser dependency installation exceeded the nested 240-second execFileSync timeout; apt output continued until the 15-minute outer step expired. No failed skybar assertion was observed. Attempt 2 passed unchanged. This establishes an infrastructure preparation failure; it does not establish that every earlier installer failure had the same cause.

Both Source and Installer heavy-browser-state jobs now install the exact Playwright 1.56.1 Chromium/WebKit runtimes in a named preparation step. Root-owned dependency installation runs under root-owned GNU timeout (300 s plus 10 s KILL grace); unprivileged browser download has an independent 180 s bound. The JS supervisor logs monotonic duration, exit code, signal and reason and cleans its dedicated process group. The 420-second parity deadline now measures actual browser QA, not Ubuntu package installation. Engine launch, exact pixels, computed layout, keyboard, overflow, SVG and all 84 viewport/theme/cache cases remain required. CI cannot select only one engine through the local diagnostic override.

A synthetic subprocess test proves successful/nonzero exits, missing executable and a TERM-resistant grandchild with inherited descriptors are handled within the deadline. This is process-lifecycle evidence, not a measurement of root-owned apt in GitHub CI.

## Offline regression

The .339 deferred module was not referenced by the HTML-linked shell asset inventory. A first offline open could therefore fail even after shell installation. The Vite build now emits non-executing `rel=mid-offline` links for the actual module and its transitive static JS/CSS dependencies. The existing atomic shell installer caches and validates these hrefs before marking the new shell valid. Styles remain asynchronous for rendering; no weather calculation or shared renderer changes.

The production browser proof installs the actual built service worker, verifies all declared offline assets in CacheStorage, shuts down the actual HTTP server, and performs the first deferred module import plus stylesheet load. Network emulation alone is insufficient because service-worker-originated requests can escape it. Both Chromium and WebKit are required. No physical iOS/WKWebView/VoiceOver approval is claimed.

## Separate RUC investigation

RUC runs 40349487541, 40384626826 and 40398320462 were cancelled after approximately 45 minutes. Their expensive paths were respectively download/decode 1628/1307/1508 seconds and Pages preparation 983/1119/1028 seconds (last preparation interrupted). The first two reached codec integrity checking with insufficient remaining job time. Runtime boundaries strongly match the configured 45-minute prepare job limit; log cancellation alone does not identify a person or API caller.

Successful run 40404899375: decode 827 s, preparation 839 s, final codec/map validation 207 s. The preparation CLI additionally orchestrates totals, RADOLAN, native maps and synoptic sidecars. In its log, synoptic work alone ran 21:46:27–21:56:23 UTC. The publish job correctly performed a no-op during main/stable release drift. Snapshot reuse across a compatible newer Stable is not implemented by this release and must not be described as complete.

## Validation

Production build, TypeScript, production npm audit (0 vulnerabilities), release/workflow/registry contracts and process lifecycle tests passed locally. All 84 Chromium/WebKit pixel/layout/keyboard/overflow/SVG/cache cases and both hard-server-offline proofs passed (168.8 seconds). The 1021-test local core run reported 2 missing Python-dependency failures; after installing the existing requirements, both affected RUC suites passed unchanged. All other 1019 core tests passed in that full run. Source/Installer/Pages/Stable readiness must be recorded against the exact candidate head. Local generated dist is excluded from the source PR; the established release bot generates the release ZIP and Installer builds the distributable output.

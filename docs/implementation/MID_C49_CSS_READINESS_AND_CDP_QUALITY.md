# MID-C49: CDP argument binding and current CSS diagnostic evidence

Read-only UI baseline: published .347 f4360f6e573f78c2be6e20d1c40d9540fd7cb1ea.
Source, package.json and lockfile of the reference were verified identical to
that baseline. The source tree was not replaced with old pilot app code.
Only the three test/instrumentation files from draft463 head
2798470c432bcfd369e524bda23f79a5ee93bd42 were selectively applied to current
Stable in an isolated checkout; production CSS/imports remained unchanged.

## CSS

Initial production stylesheet: 1,757,935 bytes raw, 249,573 gzip.
App fixture: 16/16 independent viewport/theme contexts passed comparison,
persistence, touch and the configured management/navigation/Radar/WebGL cases.
Raw CSS source bytes summed across cases: 30,886,492; used rule bytes: 2,384,817.
Module fixture: 14/14 contexts, 56 feature-view checks and 56 identical reference
layout/paint snapshots. Raw CSS source bytes summed across cases: 26,429,270;
used rule bytes: 1,303,192. Both fixtures ran using pinned Chromium Headless
Shell141.0.7390.37. These are development-fixture counts, not transfer bytes or
production optimization estimates. Full app states, production cold/warm cache,
high contrast, export and WebKit/physical iOS coverage remain separate gates.

The first current-Stable module comparison failed because one MountainWeather
instance had completed its optional enrichment while the reference still showed
loading sources. The test now waits on BOTH instances for the existing
completed data-status disclosure before comparing the full unchanged snapshot.
No value, source, coordinate, style or snapshot assertion was excluded; no
production behavior was changed. Both readiness paths and all comparisons then
passed. This is a diagnostic readiness correction, not permission to remove CSS.

- css-app-coverage.json: 16 cases, SHA256 `0624ae1314f639c705c85db808e751961548406dc9841a62d496809fb1777728`.
- css-module-coverage.json: 14 cases, SHA256 `5b45229c4eb4347f24383cef462f874c7fda6afb63d40d2e81d2110041b2e67a`.

## CDP and revision-start diagnostics

Dynamic selector/theme/mode values now use CDP Runtime.callFunctionOn arguments
with static function declarations. A current-window object is acquired on each
call and released in finally. The unchanged six-viewport/two-theme Push matrix
passed all twelve real Chromium cases, including stale acknowledgements, storage
failure, and latest-choice races. Unit coverage keeps hostile quoted strings as
CallArgument data and checks remote exceptions, missing targets and release.
Documentation: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/

The .347 push revision40521439431 no longer failed for missing WebKit; it failed
at Chromium startup in two other browser fixtures. Those fixtures previously
ignored process output. A bounded stderr buffer and exit/spawn diagnostics now
preserve real startup reasons without extending twelve-second waits or skipping
tests. Actual nonzero-process and ENOENT tests passed. Modified Push and location
fixtures each passed all twelve current viewport/theme cases. The precise cause
of that old runner's startup timeouts remains unproven; this change does not
invent one. Source492 Core and all Heavy jobs passed independently.

The two fixtures also remove their reserve-close-rebind free-port allocation.
Chromium now receives remote-debugging-port=0 and publishes its assigned port in
DevToolsActivePort within its fresh private profile. The same twelve-second
startup wait reads and validates this metadata and checks the JSON endpoint;
there is no added startup wait or allowed remote origin. Missing/partial/invalid
ports fail closed. This removes a proven allocation race in the old test code,
without claiming that it explains the old opaque CI timeouts. Failed spawn
cleanup avoids waiting for a close event from a process that was never started.

## Integration candidate .349

Started from .347 and fast-forwarded to verified published .348,
e7fbc07dd319e3589924e841d15eeca88ee0edd4. All ten prepared files were
SHA256-checkpointed before synchronization and verified unchanged afterwards.
The .347 fixture evidence above remains scoped to that explicit UI baseline;
no unrelated pilot code or meteorological production change was imported.

Fresh ECMWF evidence: unchanged draft433 headed4532c3e701fb1f7a7e6e2be9b8c5d7d939b9cc,
run40113570833/job122288475665, artifact12747167411, archive SHA256
222d876ef286d3bb976d402e9759b45d81583fc6e699655f6bfd791f5e67a3d9.
JSON copied in MID_C49_ECMWF_READONLY_20261027.json after archive hash verification.
Six original GRIB2 fields, run2026-10-27T06Z, +0/+24h,16,824,489 bytes;
pilotPassed=true while fullSpatialValidation/readyForProduction/mapsEnabled/
fusionEnabled remain false. This is not a full spatial or precipitation audit.

Parallel draft449 head8cc8519b767960684f2a0c77c7ed423eebc14b86 already records
three native PMSL runs2026-10-24T14/15/16Z at lead0, each542040 points,
525072 valid/16968 Missing with pinned coordinates. No duplicate implementation
or claim of all-parameter/all-lead/both-model coverage is made here.

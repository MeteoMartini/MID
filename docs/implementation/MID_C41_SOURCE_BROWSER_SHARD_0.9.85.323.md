# .323: preserve browser coverage within bounded Source/Installer gates

Base released .322: 30fa3817db2a3cfba2ff57c7f437e26a5c65ac5a.
PR458 original head ab9d4f8fbda910927b8704e8e2a5a4b71bc8287f.
Source40126427218 attempt4 reached 1000/1017 core tests with zero failures,
then the unchanged 15-minute production/regression step timed out.
These are test-harness durations, not proof of application UI lag.

Two wrappers launch extra actual browser acceptance in GITHUB_ACTIONS=true:
favorite selection and forecast display persistence. Move both complete wrappers
into a new read-only isolated heavy-browser-state matrix entry, in BOTH existing
Source and Installer workflows. No test bodies/assertions/fixtures/timeouts,
meteorological values, product code, release actors or permissions change.
Every matrix member still uses the identical event-bound snapshot and build.
The existing fail-closed aggregators require the entire enlarged matrix success.
The shared partition verifier proves each discovered test is assigned exactly
once. Core now has1015 tests, total inventory remains1020. Existing five heavy
jobs and three disjoint map groups remain intact; one browser-state job is added.
No new workflow, service, credential, skip or budget increase.

Local .323 production build and both CI-mode browser wrappers passed before the
partition change (same app code). Canonical sync and partition/workflow tests
must pass; remote full Source/Heavy/Installer/Worker/Pages/Stable gates are still
required before release. Browser checks do not constitute physical iOS evidence.

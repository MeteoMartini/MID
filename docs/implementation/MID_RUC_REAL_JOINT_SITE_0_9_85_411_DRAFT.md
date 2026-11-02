# RUC real joint-site proof — isolated integration candidate

Base: v0.9.85.410; main=mid-stable SHA f79003493f4621ea2a0d52763eb97c90674598d2 at authoring. Exact authenticated
PR #613 source HEAD f464003fbf1ae81758a33a27a8a95776bb9a4fd0 copied without altering that Draft or other PRs.

New read-only workflow rechecks Stable and Main, uses immutable artifact digest,
re-admits the full native 27h/20EPS producer snapshot against the actual released
Stable code (including original GRIB provenance, UTC, bitmap, native geometries and
independent JS codec), builds an independent 0–6h DWD original-GRIB Fast run,
re-downloads all four native binary objects with strict digest verification,
and physically assembles the actual released app site. Existing 27h latest
manifest stays bit-identical; Fast stays in an inactive versioned namespace.
The assembled physical on-disk site must measure under 900,000,000 bytes.
Any unknown SHA, old artifact, changed release or missing original data FAILS CLOSED.

There is NO production publishing, no global cross-provider CAS/fencing or
Web/iOS/widget/export adoption and no 60-minute P95 proof. This is deliberately
a Draft and is not an actual MID v0.9.85.411 release. Do not make ready, merge
or deploy until a globally safe authenticated single-writer plus rollback and
multi-consumer end-to-end tests are implemented and every existing source/
installer/Worker/Pages/Stable gate passes. Issue #541 stays open.

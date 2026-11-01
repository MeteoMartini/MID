> **Releaseintegration v0.9.85.406 (2026-11-01, Source-PR #601):** Die untenstehende historische Draft-Analyse beschreibt den damaligen isolierten Kandidaten auf .404. Die unveränderten Fachcode-/Testblobs wurden nun auf die verifizierte .405-Stable-SHA `6410cf049f097b1d0518beac601e1baa08583f4a` übernommen, gemeinsam mit zusätzlicher P4-QA qualifiziert und für .406 mit synchronisierten Spiegeln/Changelogs vorbereitet. **Bis zur erfolgreichen vollständigen Source-PR-, Installer- und Stable-Gatekette bleiben auch diese Änderungen unveröffentlicht.** Dies ist keine P1–P5-DoD-Freigabe; Echtdaten-168h, unabhängige Fast-Lane, echtes A/B, globales CAS und reale P95 bleiben offen.

---

# MID RUC Data 1.6 · Prepared-snapshot runtime-fingerprint correction (draft)

## Verified base and regression

Source of truth at the start of this change: `main=mid-stable`, MID `v0.9.85.404`, commit `8cf0c99ecc0a4c6502c188a9ca108466b53bb128`. The complete `.404` install run `41339459410` succeeded with the established release gates; five rulesets remain active, with 1059 registered mandatory regression scripts. This candidate changes no production branch.

Real RUC preprocessing run [41338804990](https://github.com/MeteoMartini/MID/actions/runs/41338804990) completed calculation and data preparation but the subsequent publisher job failed at **`prepared_snapshot.py admit`** with `prepared data contract incompatible with current Stable`. It correctly **did not publish** a snapshot whose authorization could not be proved. The provider run was prepared against `.403` while Stable had advanced to `.404`. The SHA-verified `.403 -> .404` diff adds the `ruc_p3_native_log_audit.py` log-only diagnostic and its test to `tools/ruc`; both were included unconditionally in the original broad runtime-compatibility fingerprint despite not contributing any production output. Version-only worker/lock changes are already normalized.

## Conservative change

The receipt still authenticates the full immutable artifact, producer source/event SHA and run attempt, ancestry, dataset manifest, each object byte/SHA, all required time axes and physical budget. The decoder/codec, runtime `tools/ruc` modules, all dependencies and worker files, forecast fusion and **the canonical RUC preprocess workflow** remain included by default. A change to any unknown native runtime module, decoding source, workflow or dependency remains incompatible.

Only `tools/ruc/test_*.py`, `test_*.mjs` and the explicitly audited **read-only** `tools/ruc/ruc_p3_native_log_audit.py` are excluded from the immutable *data/runtime* fingerprint. Those tests remain mandatory in their registered CI workflows. If a producer later imports a previously read-only module, that producer source or the workflow must change, which invalidates the receipt. Exclusions are limited to the exact `tools/ruc` directory, never to nested paths, new runtime helpers or the canonical workflow.

Regression additions in the existing `test_prepared_snapshot.py` exercise:
1. Stable advancement with newly added read-only tests and the P3 log auditor still permits SHA-authenticated, byte-identical reusable snapshots.
2. Introducing a new runtime RUC module invalidates the receipt.
3. A changed Worker decoder or canonical preprocessing workflow invalidates the receipt.
4. Original tampering, expiry, wrong producer/attempt, stale or future run, rollback regression, and dependency-change tests remain unchanged.

## Critical limitation and deployment order

This modifies the format of the computed compatibility fingerprint for newly sealed snapshots; receipts sealed by the *old* all-inclusive algorithm are intentionally **not** reinterpreted or grandfathered. Reuse of `41338804990` is **not** authorized by this patch. The next prepared snapshot must be built, sealed and admitted under an identical verified runtime fingerprint. The existing fail-closed readmission remains strict; no arbitrary compatibility fallback or manual stable/Pages pointer mutation is allowed.

No change to DWD model ingestion, native GRIB/ecCodes, 27h/20 EPS/542040 geometry, bitmap/Missing semantics, Pages <900000000-byte limit, 5/15-min rapid paths, Cloudflare/Worker consumers, DWD official warnings, user UI, or 0–6h Fast-Lane activation.

## P1–P5 evidence boundary

- **P1:** Read-only observer run `41340871509` on the current Stable collected two DWD directory samples and same-run Pages/Worker readback. It did not prove first DWD GRIB/EPS publication, 168h continuously sampled observations, or an SLO.
- **P2:** Standalone deterministic 0–6h GRIB qualification exists but its immutable shadow pointer remains `publicationAuthorized=false`, `productionEnabled=false`, `realtimeConsumerEnabled=false`; no end-to-end consumer release.
- **P3:** Existing native builder timing/quantile auditing remains read-only. No matched complete DWD original-GRIB A/B with CPU, RAM, byte parity and budget has been approved.
- **P4:** Qualification policy is advisory; global authenticated single-writer CAS/fencing across publication providers has **not** been implemented or claimed.
- **P5:** The structural Pages/Worker readback is not equivalent to real app/widget/export adoption, 168h tail distribution or 60-minute P95.

## Release contract

This is a **draft source candidate without app-version bump**; no release authorization. Before any coordinated MID release, inspect current Stable/Main, compare parallel `.405` drafts, update version mirrors, both changelogs and release notes on the selected integration tree, run required source and 1059 regression gates (including updated snapshot tests), then only the normal SHA-bound source bot, immutable server-side ZIP, `install-mid.yml`, Worker/Pages/Finalize, and stable promotion. A new build version is not assigned by this draft.

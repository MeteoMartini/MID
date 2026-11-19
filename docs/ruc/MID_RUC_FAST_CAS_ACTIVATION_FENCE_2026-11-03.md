# MID RUC P4 · SHA-fenced Fast activation transition (Draft)

Stand 03.11.2026, verified released source `main=mid-stable` v0.9.85.414, SHA `b2b9bb3c3eab78fac117bd0b0d2110b1ce127b66`; based on exact original stable source files: `tools/ruc/ruc_fast_cas.mjs` blob `397f2d23efa36c3f113e9bdadb82d4d2aefdff43`, its test blob `6bbaef729603a347e11627c524376f564665ddee`.

## Why this is a security change
The existing conditional R2 pointer primitive requires a trusted release authorization callback and supports ETag-CAS, generation monotonicity and exact-Etag rollback, but its `makeNextPointer` previously permitted **shadow A → active B** with changed Fast or original 27h site SHA, run or source manifest. R2 CAS only ensures atomic write of that **one pointer**, not that B was the admitted/staged/independently read-back site. An external grant must still verify original bytes.

## New invariant
Whenever the requested pointer mode is `active`, the complete immutable identity (Stable SHA, site SHA, full 27h primary manifest SHA, Fast manifest SHA, primary/fast UTC runs, EPS and horizon semantics, intact full readmission) must be **bit-for-bit the identity of the immediately preceding pointer**. Otherwise fail *before* even invoking the release grant and without writing anything. A first pointer is still Shadow-only. If moving to a new source, first publish an independently admitted `shadow` pointer (which conservatively falls back to full RUC), re-prove all original objects and clients under the secure publisher, then activate exactly those already staged digests. A valid same-site Shadow→Active transition still succeeds. Rollback retains existing monotonic generation and exact own ETag, never edits `/ruc/latest.json` or fabricates EPS.

Tests: unchanged 10 existing cases plus two adversarial end-to-end mock R2 scenarios for site/manifest/Run identity spoof, no-write, grant not called, active→active downgrade prohibition, legitimate staged new run and compensation rollback.

## Non-authorization
This fixes one real transition bug in a pure CAS module but **does not implement an authenticated GitHub Pages / optional R2 global single-writer**. The existing `mid-pages` workflow locks are independent of R2's object CAS. This Draft has no R2 credential, production writes, Worker/browser Fast activation, official sign-off or 168-hour original DWD→end-client measurement. Release flags stay false. Source gate, original DWD attestation, full 27h/EPS20/fast original admission, complete ≤900MB Pages site, public readback, full Web/iOS/widgets/exports and bot/ZIP/installer/Stable remain mandatory.

No old #620 `deploy.yml` was copied; its obsolete `cancel-in-progress:true` and missing Stable SHA fencing must never regress current .414 protections.

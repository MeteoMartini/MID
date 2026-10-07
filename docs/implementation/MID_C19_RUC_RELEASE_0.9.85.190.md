# MID v0.9.85.190 · MID-C19 RUC / release recovery

## Verified lineage and scope

Branch starts at released .188 `6dd6205ab53b2f1aa4d543acb120e51cce1775da` and preserves the reviewed .189 source commit `0dc39b21f8e2c3f1a98f43f241583f144b5fabca` from PR #281. No release ZIP is included in the source diff. Existing local work was absent before checkout. Open PR inventory had no overlapping product/release PR.

## Evidence

Installer run 37573033824, job 112635709978: build/typecheck and all 930 regressions passed, suite 895.8 s. The combined build/test step hit its 15-minute deadline. No product regression failed. No subsequent Worker/Pages/Stable gate ran; Stable remained .188.

RUC run 37582776244 prepared a valid immutable snapshot; publish job 112670533097 skipped it because main .189 differed from Stable .188. This protective guard is correct and remains unchanged. Green prepare/no-op workflow does not prove publication.

Live same-origin ruc-health at 2026-10-07T07:12:16Z returned schemaValid=true, ready=false, fresh=false, run=2026-10-07T02:00, ageHours=5.2, reason=RUC-Lauf nicht frisch. This is sufficient to explain why fresh native RUC does not enter the forecast; it is not proof of a separate client fusion bug.

## Correction

Only the bounded combined full-verification step budget increases from 15 to 25 minutes; parent install_build from 30 to 40 minutes leaves room for installation, audit and subsequent commit/iOS checks. npm run verify, complete regression discovery, child browser timeouts, failure propagation, least privilege, provenance, Worker/Pages gates, SHA-bound promotion and RUC publish guards are unchanged. Active/canonical/transport workflow mirrors synchronize through the established script.

No arbitrary new RUC values, stale-run acceptance, forced promotion, manual merge or duplicate installer dispatch. RUC resumes through its existing schedule after a successful normal release. Final success requires new Stable SHA, published matching app version and fresh Worker RUC health; source implementation alone is not a publication claim.

## Validation

Budget regression verifies all workflow mirrors, bounded parent/step budgets, unchanged full verify invocation and absence of shard filtering/continue-on-error on the verification step. Existing .189 browser/component and meteorological regressions stay in the discovered full inventory.

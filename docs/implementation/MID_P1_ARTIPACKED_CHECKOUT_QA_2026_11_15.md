# MID Release Konzept 1.3 · Artipacked-Checkout-Härtung (QA-Draft, 15.11.2026)

**Exact parent:** `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` / v0.9.85.483, `main=mid-stable` before QA branch creation. Five GitHub rulesets remain active. **No version bump, app build, paid service, credentials, roles, trigger, environment or release gate change.**

## Reproducible source
The SHA-256-verified `zizmor v1.32.0` on Draft [#824](https://github.com/MeteoMartini/MID/pull/824), Unit [#43740153095](https://github.com/MeteoMartini/MID/actions/runs/43740153095), GitHub artifact `14172256554`, reported **13 Medium artipacked** findings in these four workflow pairs. The complete scanner ledger includes each workflow and exact line. The pinned `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1) retains authenticated git credentials by default. According to the official checkout v7.0.1 documentation, `persist-credentials: false` disables their retention for later authenticated git commands; since v6, retained credentials otherwise reside in a runner-temporary file. This is risk reduction, not proof of a previously exploited secret.

| Managed active + canonical workflow | New flags | Prior flags | Protected after patch |
| --- | ---: | ---: | ---: |
| `chatgpt-pr-gate.yml` | 5 | 2 | 7 / 7 |
| `install-mid.yml` | 1 | 6 | 7 / 7 |
| `mid-code-revision.yml` | 4 | 2 | 6 / 6 |
| `mid-ruc-preprocess.yml` | 3 | 1 | 4 / 4 |
| **Total** | **13** | **11** | **24 / 24** |

## Job-by-job safety decisions
- **Source Core/Heavy** only checks PR provenance, data/model contracts, build and regressions. There are no authenticated `git push` requirements in the affected jobs. All SHA checks and the original DWD/RUC checks remain in place.
- **Installer Worker job** checks out the exact release commit and deploys through separately provided GitHub/Cloudflare API credentials. Authenticated `git push` occurs in the *separate* Installer build job whose checkout already uses `persist-credentials: false`; explicit Git authentication is preserved and not replaced.
- **Code revision/CodeQL** uses separate explicit action/API credentials. GitHub CodeQL upload permissions, issues, smoke checks and source inputs are unchanged.
- **RUC compute/publish** accesses Stable or SHA-bound sources and uses existing workflow/API deployment authentication. No checkout-token-backed `git push` is required. DWD provenance, model time semantics, artifacts, Pages lock and atomic publication remain untouched.

Only `persist-credentials: false` is added. All checkout action SHAs, refs and fetch-depth parameters remain identical in the active and canonical mirrors. `tests/unit/mid-artipacked-checkout.test.ts` enforces identical managed pairs, full SHA action pins and 24/24 credential opt-outs; negative mutations to `true` or omission must fail.

**Pending qualification:** actual GitHub Unit/Coverage on the exact new head, optional zizmor readback and a functional review that independent API/deploy jobs are unaffected. Intended reduction in `artipacked`: **13 → 0**, not claimed until supported by the new scanner artifact. Existing 2 High `dangerous-triggers`, 2 Low, 14 Informational, review/TOCTOU issue #740, QA #775 and PR #824 stay distinct; no zizmor suppression.

**Release:** QA Draft only, no Ready/Merge/ZIP/Installer/Worker/Pages/Stable release. The Lead-Chat integrates selectively with a new version after live SHAs, independent security disposition and complete existing release gates.

## Additional installer source mirror (QA gate)

The original `scripts/test-installer-sharding-0985193.mjs` also requires byte-identical `workflow-patches/install-mid.yml` alongside `ci/github/workflows/install-mid.yml` and `.github/workflows/install-mid.yml`. The first Draft CI `#43742482341` was correctly blocked by that extra mirror, not by product regression; this patch restores the third byte-exact copy, and extends the new Vitest mutation/identity guard. **Never suppress or weaken the original installer regression.** New GitHub CI and zizmor evidence must be independently rechecked on this new SHA.

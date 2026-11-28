# MID Audit 1.1 — App-unabhängige Prognose-Stichprobenabdeckung

**QA-only, DRAFT, NO MERGE, NO RELEASE.** User PDF `20261117_MID-Audit(1).pdf` pp. 3–4, 6–7. New independent audit extension to existing audit #911, not a new standalone PR or runtime. Verified `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, published v0.9.85.488, package/baseline/index mirrors consistent, five active rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, forecast consistency / GitHub write contracts. Scope deliberately distinct from lead #902 and audit #905/#907/#910/#914, design #915, maps #908.

## Reproducible baseline and sampling risk

In Stable `src/App.tsx`, `recordForecastCapture` reacts to active weather state; user-configurable `learnAllFavorites` is **false by default**, uses `requestIdleCallback`, visible-tab gating, abort on user interaction and network/cooldown limits. `src/twinBackgroundLearning.ts` runs in the open app, not in a guaranteed system-level time-triggered service. `src/forecastVerification.ts` stores v3 captures in client IndexedDB/localStorage and samples only the first three target days in three-hour issue buckets. This design need not observe the same forecast issue opportunities for users who rarely open MID. Observational backfills can help with *measured outcomes*; they do not reconstruct historical exact MID fusion states, even when native source model runs are available. Missing opportunities can correlate with user habits or weather interest. This is a **risk of selection bias**, not empirical proof of the bias direction.

Apple BackgroundTasks explicitly does not promise fixed time-of-day or uninterrupted app execution. No smartphone background strategy can be relied on as a scheduled forecast-issue source of truth.

## Narrow QA foundation

`src/twinCaptureCoverageEvidence.ts` computes O(defined opportunities + archive records), O(opportunities + distinct sites) coverage diagnostics. Opportunities must be preplanned in absolute epoch time, independently of MID app openings, and sorted by issue-window start; target validity must lie after the window. The adapter (NOT this helper) must prove original provider issuance, original MID creation/archive timestamp, content SHA-256, version/model provenance, the identity and issue time of the paired baseline, and scheduler completeness. Invalid schedule aborts coverage accounting. It also must supply a privacy-safe, canonical reference-site key; do not centralize personal precise user coordinates.

- Count an original MID forecast only when a declared validated archive attestation and 64-character digest match an immutable source/original time in the planned issue window. **These fields are attestations, not independent cryptographic verification by the helper.**
- `historical-source-run` and `reconstructed-mid` may be recorded as separate source-model diagnostic opportunities, but NEVER contribute to past original MID issue coverage or skill numerators.
- Exact duplicate originals are counted once; conflicting versions for the same site/target/issue slot are **ambiguous** and not accepted. Independently verify missing or moved original archives rather than choosing the more favorable record.
- The output separates original-only from actual paired-baseline captures, client-session vs independent central capture, uncovered slots, source-replay-only slots, duplicates, conflicting slots, longest missing sequence per site and four explicit **UTC** six-hour issue bins (not mislabelled as local clock time across DST). Finite percentages do **not** imply representativeness, even when 100%; this function never returns a science-skill/approval verdict.
- Pure inspection: no automatic network, database, timers, global capture state, user telemetry, WebGL/React/CSS or release operations. No new infrastructure or paid API.

`tests/unit/mid-audit11-twin-capture-coverage.test.ts` has ten synthetic test cases for never-open app, quarter-day user-session selection, all-original central coverage, illegitimate retrospective MID recovery, incorrect timestamps/missing original digest, exact duplicates vs conflicting archive versions, repeated Europe/Berlin DST clock hour, invalid schedules, missing paired baseline and mixed reference sites.

## Scientific/operational release handoff

Recommended **product decision, not yet approved or implemented**: Optional central *public-reference* MID forecast verification over a few predefined representative grids/sites (begin Eil and compare official DWD stations) with immutable issue-time snapshots independently captured under the established budget, legal rights and SHA-gated server release path. This is NOT a centrally collected precise user GPS feed and NOT a promise that a forecast from a reference grid equals any given individual phone's site-specific MID result. Own sensor / station cloud history remains separate opt-in personal microclimate evidence. No new Cloudflare Cron/Worker/R2/KV, secrets, network calls, recurring jobs, or paid Open-Meteo services here. The existing Open-Meteo no-commercial-use restrictions and any provider distribution/attribution requirements require explicit review first.

Follow-on acceptance: snapshot provenance includes source run/valid/accumulation, native field units, location grid/domain, operational MID code/version and original ensemble/Best Match inputs, hash-signed append-only preservation where permitted, actual issue-time before validity, independently observed DWD station QA (historical vs provisional), 30/90-day prospective holdout with paired same-case skill, uncertainty intervals, session-selection stratification and missing-period statistics, distance/height matching and representativeness. The user decides when and whether to authorize infrastructure and the activation of local corrections. No V8 pilot by itself makes an app-responsive/real iOS/VoiceOver assertion; future compact disclosure must meet 320px, long labels, 200% text and WCAG 2.2 AA goals.

Integration: Lead/Work must inspect current Stable, full SHA, version, issue/PR ownership, source permissions, data rights and actual costs before selecting candidate blobs. Do not override `forecastVerification.ts` owned by #902/#905 or confuse #911's observed DWD-pair verifier with issue-sampling coverage. All original #911 six-file QA remains intact. Final release requires Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable on exact SHA; HIGH security #903 remains binding. Audit addendum is not a release blocker.

## Original public references

- Apple BackgroundTasks (OS scheduling autonomy): https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app
- Open-Meteo Single Runs original model-run API: https://open-meteo.com/en/docs/single-runs-api
- Open-Meteo Previous Runs fixed lead-time products: https://open-meteo.com/en/docs/previous-runs-api
- ECMWF verification representativeness: https://confluence.ecmwf.int/spaces/FUG/pages/673550672/Section%2B3.2%2BGrid%2BPoint%2BValues%2Band%2BObservations
- Open-Meteo API licences and prices: https://open-meteo.com/en/pricing

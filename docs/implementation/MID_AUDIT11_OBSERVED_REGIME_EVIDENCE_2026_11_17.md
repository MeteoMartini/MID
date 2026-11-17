# MID Audit 1.1 — Missing precipitation is not observed dryness

**QA-only handoff / DRAFT / NO READY / NO MERGE / NO RELEASE.** Original user audit `20261117_MID-Audit(1).pdf`, pp. 3–5. Verified published source before this candidate: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, v0.9.85.488 (`package.json`, `MID_BASELINE.json`, `contracts/index.json`), five active protection rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_FORECAST_CONSISTENCY_CONTRACT.md` and parallel PR scopes checked.

## Confirmed issue and precise impact

Published `src/forecastVerification.ts` blob `b22df30c1ad32237ba863b882f279623fea53339`: `migrateReference` leaves invalid rainfall as `NaN` but calls `row.regime=inferRegime(row)`. The shared `inferRegime` then uses `precipitation=Math.max(0,finite(value.precipitation))`, coercing that missing observation to 0 mm before evaluating dryness (<0.1 or <0.2 mm). This can incorrectly label an observed reference as 'hochdruck', 'inversion', or 'foehn' if the other conditions happen to hold. A genuine measured zero remains valid.

**Do not overstate blast radius.** The current verification grouping `chosenEvaluations` explicitly uses `evaluation.regime=capture.predictedRegime??'wechselhaft'` and *not* `reference.regime`. Thus no current contamination of per-regime scoring/model weights by reference regime metadata has been demonstrated. Actual reference-classification production effects and any UI usage require a further integration-side audit.

## Bounded zero-dependency QA solution

`src/twinObservedRainEvidence.ts` contains a pure O(1) numeric evidence gate: `twinObservedRainState(unknown, thresholdMm): 'unknown'|'dry'|'wet'` and `hasTwinObservedDryEvidence`. It rejects null, strings, NaN, infinity, negatives and invalid thresholds; it preserves real 0 mm, exact strict thresholds and unlimited finite positive rain amounts. `tests/unit/mid-audit11-observed-regime-evidence.test.ts` has six regression groups. No source fetch, worker, timer, state, network, CSS, React render or iOS change.

**Crucial:** This gate proves numeric admission only. The caller must separately check rainfall-specific **independent observation** provenance (not only `ForecastReference.kind`, which may inherit temperature-source status), accumulation interval, valid-time boundary / timezone, source timeliness, observational quality and 24h coverage. An observed regime cannot be asserted when those requirements are missing. Never use observations arriving after a forecast's issuance to label its *predicted* regime. Also do not infer a true synoptic high-pressure, inversion or foehn system from rainfall alone; broader physical evidence is required. A 'missing' input requires an unclassified reference rather than an invented dry day.

## Safe integration owner and tests

`src/forecastVerification.ts` is concurrently modified by Lead PR #902 and Audit PR #905. Audit #907 already owns the observation readout. **No production call site is touched here. Never wholesale-copy any earlier .488 `forecastVerification.ts` blob.** Lead Chat/Work should first revalidate live stable/main SHAs, conflicts and contract ownership, then selectively add numeric + independent source/time/coverage gates to `migrateReference`/reference-row formation. Preserve original v3 archive bytes and derive scientifically defensible provenance status without rewriting historical observed records; if a type/schema expansion is necessary, explicitly version and test backward compatibility. Do not alter forecast-only regime classification or archive scoring without a separate documented reason.

Follow-up QA: targeted six tests; pre-existing #886/#890/#897/#899/#905/#907 suites; source-level negative case with gust-only valid observed reference and no rain; forecast-regime isolation; older v3 archive import/export/roundtrip/idempotence; 23h/25h date boundaries; independent precipitation observation source; incomplete 24h coverage; no false station zero or warnings. Then full MID Source/Core/Heavy/Review/ZIP/installer/Worker/Pages/Stable gates on the FINAL release SHA. Existing HIGH dependency audit blocker #903 remains binding; #839/#740 are separate. No empirical skill gain, UI, browser, native iOS, VoiceOver or production acceptance claimed.

## Original methodological references

- WMO, *Guide to Climatological Practices* WMO-No.100, §3.2.2: https://dgm-meteo.github.io/wmo-clino/Docs/WMO2018_100_en_Guide%20to%20Climatological%20Practices.pdf — missing observations may only be reconstructed as 0 with other evidence precluding precipitation and reconstruction must be flagged.
- ECMWF, *Forecast evaluation* and SEEPS: https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation — independent observed dry/light/heavy regimes.
- WGNE, *Suggested methods for precipitation forecast verification*: https://wgne.net/publications/suggested-methods-for-precipitation-verification/ — stratification, thresholds and observational resolution.

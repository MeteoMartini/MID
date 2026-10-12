# MID-C28 · Ortsvergleich 2.0, Mehrort-Übersicht und Prognose-Radar

Verified released base: main = mid-stable b049991f52bd8fcdf6ccbeb7efd5e867b07c7ad9 (.239). Scope follows the 11 October conversation “MID Weiterentwicklungsideen”: same-time favorite comparison, weather-prioritized favorite overview and a meaningful before/after forecast change view with version history.

## Integration
The on-demand “Orte & Prognose” panel under Aktuell works in both navigation/design modes. The three tabs share preferences and source contracts. The existing extended ensemble change-radar uses the same PrognoseRadarView. Forecast and warning requests stop when the panel closes or its input places change. No additional paid sources or notification behavior is introduced.

## Comparison and overview
Common absolute, future, full-hour windows: 6, 12 or 24 hours. All favorites are considered; 30/100 km filters refer to the selected place and do not discover unlisted places. Best Match is mapped with the canonical mapHours path. Raw nulls are restored as missing for comparison-critical variables, preventing a missing value from becoming dry/low-risk through default mapping. Consecutive windows break at missing absolute hours; unknown and stale data cannot win.

Profiles: dry <0.1 mm/hour with hourly probability <=30%; outdoor adds 8–26 °C and gust <=20 kt; mild uses 15–25 °C. These explicit planning criteria are not a calibrated suitability probability. Rain risk is the maximum hourly probability, not a whole-window probability. Ensembles load only after an explicit request, serially across places through the existing provider budget. P25–P75 is reported only with complete hourly coverage and >=2 members. Overview order: official warning severity, incomplete data, notable weather/large loaded temperature spread, then alphabetical. Warning intervals overlap the exact common window; an unavailable warning source remains explicit. Forecast values appear progressively before the warning request completes.

## Prognose-Radar
Existing three-day relevance thresholds and model/run provenance remain. Material changes are shown first with Bisher/Jetzt values, actual gust unit, same-day spread context, and optional smaller differences. A single shared renderer serves the standalone tab and extended ensemble view. History retains the existing six locally captured snapshots and plots the same validity day; it represents forecast versions, not observations. Source metadata records documented nowcast/local-adjustment/source context. No unsupported causal attribution to observations or actual weather is made.

Onset captures retain absolute epochs and source timezone; repeated DST hours are unambiguous. Legacy onset strings are interpreted using the source timezone when available. Already elapsed onset and events merely entering the rolling horizon are excluded from change alerts.

## Verification
Meaningful tests cover nulls, stale data, common UTC windows, uninterrupted dry periods, warning overlap, full ensemble coverage, ranking and repeated DST hours/elapsed onset. Browser fixture uses real canonical cached forecasts/ensembles, actual warning fetch path and production CSS/component code. Device matrix: 320/390/412/844/1024/1440 × light/dark × Classic/Next; tab selection, saved filters, place-selection callback, before/after and same-day history, horizontal overflow, contrast and 44-pixel controls.

Existing source-shape tests now inspect the shared renderer for model attribution instead of requiring duplicated JSX inside EnsemblePanel. The existing complete test inventory is extended by one regression; timeouts, release gates and budgets are unchanged. Physical VoiceOver/WKWebView validation cannot be inferred from these browser fixtures.

Local results: 963/963 regression scripts passed; all four model/archive/onset focused checks passed again after final absolute-onset identity correction. Fresh .240 production build/typecheck passed. Main JS 1,425,495/1,500,000 bytes, main CSS 1,759,282/1,760,000 bytes; all lazy feature budgets passed. New responsive browser matrix 24/24 passed, including preserved history when only one day overlaps, genuine warning-route handling and active-tab contrast >=4.5. Existing Current/Today/phase matrix 48/48 passed. Production dependency audit reports zero vulnerabilities; Worker syntax and git diff checks passed.

Harness corrections: historical data-URL loaders now bundle the real shared time helper, preserving their archive/onset assertions. Shared attribution/secondary-line checks inspect PrognoseRadarView. No checks were removed or time/byte allowances increased. A discovered 33-pixel inherited button height is fixed with a component-scoped 44-pixel minimum.

The new hourly rainfall strip and Tmax history use the established parameter color tokens. Preferences use the existing durable-storage path. The default model-change notification/display setting is not changed: the standalone radar is an explicit on-demand review.

CI follow-up: Source desktop shard repeated the same 30-second synoptic transition timeout seen during .239, in varying theme/design cases while seven sibling cases passed. Desktop viewports >=1024 run their complete variants serially to remove artificial simultaneous software-GPU renderer contention. Lower widths keep existing parallel execution. All viewport/theme/design cases, assertions, per-operation/suite limits and separate memory probes are retained; no release workflow or budget changes.

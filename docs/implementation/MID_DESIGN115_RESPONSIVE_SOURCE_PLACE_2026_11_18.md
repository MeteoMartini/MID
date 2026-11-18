# MID Design 1.15 – Source disclosure + full place name, QA draft

**Status: NO READY / NO MERGE / NO RELEASE**.

## Verified original sources at branch cut
- Repository `MeteoMartini/MID`, **main = mid-stable** `3f9c5e24dc55fa5154732a1ba73961ba76c29788`, `v0.9.85.491` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`; all five GitHub rulesets active.
- `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` read. Existing released .491 source passed `MID / stable-release-quality`; this is not approval for this proposed patch.
- Current baseline blobs: CSS `34456e97bdcf999e22c706f34c968488ccc5ac81`, diagnostics `b0008d651bfd0489622a7285f5224b4ad9364ddd`, place label `bb5db08418417eaad739914f25d9f1ce995048e1`.
- Provenance of place label and tests: old QA candidate [#896](https://github.com/MeteoMartini/MID/pull/896), HEAD `c1a857535a50b8c980b1c9a49f1facbd70582fb5`, original product blob `f4d70bc8d853c19ce633d67f3769674427d471e0`, unit test blob `822abc5b32e781651eb5d56fa4c69f093f79d8bc`. Reuse was selected to avoid duplicate inventions.
- Concurrent Release PR [#924](https://github.com/MeteoMartini/MID/pull/924), head `87ca4c864a7c4c05ee8031d3f4fb86119e19691f`, is RUC freshness only; none of its changed production or test paths overlaps these paths. Do not change or block it.

## Product change, no new data or runtime state
1. `src/SelectedPlaceBar.tsx`: take the **exact reviewed original product file** from #896 and permit wrapping of full names or aliases with a static React `CSSProperties` constant, `minWidth:0`, `maxWidth:'100%'`, `overflowWrap:'anywhere'`; no ellipsis, silent shortening, state, requests or new listener.
2. `src/midC18SecondarySurfaceRefinement.css`: source details' clickable native `<summary>` gets `min-height:44px!important` instead of 36px; padding, theme tokens and actual details content remain unchanged. This implements MID's enhanced touch policy; do not equate old 36px with WCAG 2.2 AA nonconformance, since SC 2.5.8 is generally 24px with exceptions while enhanced SC 2.5.5 uses 44px.
3. `src/ForecastSourceDiagnostics.tsx`: replace exposed internal variable names with precise, plain-language description of the **final hourly** and **15-minute weather/precipitation series**, preserving all canonical processing order, calculations and provenance.
4. `tests/unit/mid-design19-selected-place-visibility.test.ts`: original #896 seven tests, only repair false-positive assertion. Its legacy `/(°C|mm\/h|0\s*%)/` inspected raw SSR markup and wrongly matched CSS `max-width:100%`; it now checks visible text after stripping HTML tags without weakening prohibition of synthetic weather figures.
5. `tests/unit/mid-design115-forecast-source-disclosure.test.ts`: original native disclosure, text label, 44px CSS contract.

## Comparison benchmarks
- meteoblue's June 2026 mobile redesign preserves expert products and simpler navigation: https://www.meteoblue.com/en/blog/article/show/40646_Android%2BApp%2BUpdate%3A%2BA%2BNew%2BInterface%2C%2BSame%2BDepth
- Apple Weather exposes expandable weather details within location context: https://support.apple.com/en-lamr/guide/iphone/iph1ac0b35f/27/ios/27
- W3C WCAG 2.2 reflow/target size: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html and https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Forecast models are not all one prediction; retain nuanced model provenance: https://content.meteoblue.com/en/private-customers/website-help/forecast/multimodel

## Acceptance gate / LCT handoff
- **Before integration** re-check `main` + `mid-stable` SHAs, current stable version, all contracts, overlapping parallel work, original blobs and CI. If changed, stop and compare by original hunks; do not force reset, update prod branches or use stale source blindly.
- The proposed QA tests must pass on this precise PR HEAD. Read GitHub workflow results after PR opening. No unsupported "full QA green" claims.
- On a new authorized integration SHA: `320/360/390/430/834/1024/1440` CSS px, landscape, light/dark, root 100%/200% font sizes, long Unicode names, safe-area, 44px actual `getBoundingClientRect()`, `Enter`/`Space`/`Escape` where applicable, focus, source details navigation, zero missing-data substitutions, official warning separation and no overflow. Browser results are not native iOS/WKWebView or VoiceOver signoff.
- Protect source-review, security, core/heavy, server release ZIP, `install-mid.yml`, worker/pages and stable promotion. Version mirrors/changelog must be updated **only by the eventual real build owner**; this code-only QA candidate is not v0.9.85.492, and must not collide with live release #924.
- Existing #896 must not be included separately after this tested implementation is integrated; historical PR closure or supersession requires the LC's decision.

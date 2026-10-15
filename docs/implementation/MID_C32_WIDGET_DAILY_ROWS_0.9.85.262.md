# MID-C32 · Widget-Tageszeilen · v0.9.85.262

## Verified basis and scope

main = mid-stable = 5d05c9d767fe37ea0e515be91d63c7b7267cf83b (.261). PR #369 integrated only through the existing source actor. Installer 38729107069 first failed a native-map tooltip boundingBox check; the unchanged rerun passed every group and promoted .261. The same full native browser suite also passed locally. The initial occurrence is an observed non-reproduced failure, not a claimed application fix. No protected ref, rule, gate, workflow or dependency change.

User explicitly requested daily precipitation between Tmin and wind, separate sunshine hours above the graph, and independent all-or-nothing Skybar visibility for the curve widget.

## Implementation

SevenDayCurveOverview remains the sole curve renderer. Widget-only showDailyRows adds the precipitation row immediately after the temperature header and before wind; sunshine follows wind/hazards immediately above the diagram. Other 7-day consumers retain their default header layout. Daily values come from existing Day records; canonical precipitation/percent/sunshine formatting is used. The compact probability refers to the original daily primary value: ensemble-members-dwd means the 00–24h event above 0.2 mm; other provenance is explicitly marked max (maximum hourly probability). Invalid/missing amount/probability stays unavailable, never artificial dry zero. Native scientific data and aggregation are unchanged.

showSkybar controls the complete common band/hour-square group and its legend. showRain controls the daily numerical row and existing precipitation bars; showSunshine controls the sunshine numerical row. Neither option removes a phase from the Skybar. Solar night shading stays a property of the graph and is independent of Skybar visibility.

The additive showSkybar field uses the existing schema-5 settings key, defaults true when absent and preserves explicit false. URL parser/profile generator support skybar=0|1 independently of rain/sunshine. URL initialization overrides local settings; preview/PNG/direct-URL outputs share the same Widget and renderer.

Widget-specific CSS is loaded with the existing lazy WidgetGenerator module. The eager stylesheet and its historical cascade are unchanged. Two-column controls prevent the screenshot's unnecessary three-column label compression. Three standalone esbuild-based browser fixtures explicitly load the new widget stylesheet too, matching Vite's actual import behavior. The module/CSS golden approves only the changed WidgetStoredSettings, storedWidgetSettings and Widget declarations for the explicit user instruction; all other golden declarations and CSS ordering remain checked.

## Validation

- TypeScript and production build succeeded.
- 972/972 local regressions passed (114.3 s).
- New behavioral regression covers all eight precipitation/sunshine/Skybar combinations, row order, complete band identity, night preservation, persistence/legacy defaults, URL overrides and missing-data labels.
- Browser module suite: 56 viewport/theme/view cases; additionally 112 option combinations across 14 viewport/theme configurations. Exact band DOM stays unchanged when only numerical rows toggle; labels fit their own columns; settings persist. Desktop and smartphone screenshots inspected. No physical device claim.
- Production dependency audit: 83 versions checked, zero findings/provider errors. Dependency policy unchanged.
- PNG/export-readiness suite passed: 24 app/widget viewport/theme/design cases, actual PNG, failure/recovery and missing-member boundaries. Final Types/production build passed; main JS 1443666/1500000 bytes; initial CSS unchanged at 1759981/1760000 bytes. Publication is complete only after installer gates and exact Stable promotion.

## Remaining packages

RUC raw replacement remains separate: .261 added a real snapshot proof and read-only measurement tool, not full migration. Persistent old-client/offline compatibility and provider CPU/RAM/SLO evidence still precede raw removal. Native model expansion still requires budget headroom; CSS lazy splitting still requires cascade/paint parity; other map/favorite/warning/a11y/observability topics require current reproductions. Physical iOS/WKWebView/VoiceOver acceptance remains open.

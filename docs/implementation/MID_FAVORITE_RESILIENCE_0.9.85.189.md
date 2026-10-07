# MID v0.9.85.189 · Favorite selection resilience

## Verified base and scope

Stable base: `6dd6205ab53b2f1aa4d543acb120e51cce1775da` (.188), verified equal to main after the regular installer, Worker, Pages and Stable gates. The .188 widget cadence changes are retained. No meteorological computation, user profiles, favorites or settings are changed/deleted. The additional explicitly requested 14d/46d/season presentation improvements are included below.

## Findings and limitations

- `persistSelectedLocation` used direct `localStorage.setItem` before the React location update. If that write throws, selection aborts after previous requests have already been invalidated.
- Touch selection set a global boolean click latch before invoking `onSelect`. Its reset timer was only created afterwards. An exception therefore permanently latched the click path; the global latch also swallowed unrelated clicks for 240 ms.
- Existing StorageSafety normally recovers quota failures. Boot initialization is time-bounded and storage interception is best-effort; security errors or an unavailable bridge can still expose direct callers. This is a proven injected failure path, not evidence that the reported device necessarily had a quota error.
- The previous moved-touch branch did not suppress a subsequently generated compatibility click, which could select while scrolling.

## Corrections

- Use the established direct durable read/write API for the selected location and timestamp. Catch persistence failure at the persistence boundary, so in-memory selection and forecast request invalidation continue. No reconstructible-cache or durable-user-data deletion is introduced. An inaccessible persistence backend cannot be promised to survive reload.
- Preserve a readable saved location even if timestamp repair cannot be written.
- Use a favorite-ID-bound duplicate token expiring after 240 ms, independent of callback success or timers. Clear it at the next genuine pointer-down; keyboard activations (detail 0) are not swallowed. An unrelated favorite is not blocked.
- A moved touch and its compatibility click do not select; pointer cancellation remains non-selecting.

## Validation

- 14d development now passes existing weighted daily Tmin/Tmax P10/P25/P75/P90 through the shared interval renderer. No synthetic quartiles, averaging of quantiles or weight changes; unavailable ensemble bounds remain null. Best Match dots retain their existing source. Both interval levels are included in selected and native-title details.
- The phase cards use short labelled daily-mean values and compact two-column mobile rows; all three phases and their coverage stay visible without tall empty cards.
- The 46d and season sections are mutually exclusive, including seasonal network activation and request cancellation. Classic defaults to 46d and offers an explicit season button; modern uses its existing external horizon selection. Switching away aborts seasonal requests and clears seasonal display state; delayed aborted results cannot reopen season.
- New behavioral mapping/null/scale contract regression plus 24 real-Chromium cases test the production 14d panel/chart/CSS and production long-range horizon logic with controlled child-data adapters. They test explicit modern and classic activation, request cancellation and delayed responses; these mocks are not live seasonal-source proof.
- Existing .097825 summary-text assertion is intentionally updated from Tmax-only to the requested Tmax/Tmin contract; all source, methodological and responsive assertions remain mandatory.
- Existing .09330 header assertion now requires the independently selected season/46d title instead of the combined title, while retaining all meteorological, source and version assertions.

- Behavioral regression executes the current TypeScript functions after esbuild transpilation: 100 rapid alternating selections with blocked persistence, actual selected state and request invalidation, quota/security failure, preserved readable start location, keyboard, mouse, different favorite, compatibility click, cancellation, movement and injected callback exception recovery.
- Real Chromium harness extracts the current `FavoriteQuickStrip` and active-item reveal helpers, imports the complete production CSS, and exercises repeated touch selection after other button interactions plus keyboard/mouse at 320/390/412/844/1024/1440 px, Light/Dark, Next/Classic (24 cases). Persistence is deliberately blocked. This is component QA, not a reproduction on the reporter's device nor a full-dashboard journey.
- Existing favorite identity, event coexistence, iOS resume and quota contracts remain mandatory. Full build/typecheck, regression inventory, audit and normal release gates remain required.

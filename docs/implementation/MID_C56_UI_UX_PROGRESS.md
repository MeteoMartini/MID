# MID-C56: UI/UX continuation (not a release)

Verified 2026-11-05: main = mid-stable = 8b4d311227090ae7b38022173899b5be412f81ec, v0.9.85.435. Branch chatgpt/v0.9.85.436-c56-settings-audit. Development target .436, version mirrors deliberately unchanged until qualified build. No new app build, merge, ZIP or promotion performed.

#663 head 5afd5cc13885c0146b1e6d9ab66dd58ea82f5cc3 is an ancestor of this Stable. Do not cherry-pick or process its old handoff again. Historical draft remains open; no remote metadata changed. Open PRs inspected: #664/#663/#661/#651 and independent RUC/source drafts. No new overlapping App.tsx implementation found in that list.

## Current-run browser evidence

1. Start/search: live .435 loaded; Bonn search returned selectable results and loaded forecast. Desktop 1363x936 only.
2. Settings: direct section selection works. Category/title/explanation in two option-list headers run together. DOM confirms SPAN/STRONG/SMALL all inline. [Exact screenshot](c56-evidence/01-settings-before.png).
3. Reorder: one click moves Aktuelles Wetter to position 2; status announces `Aktuelles Wetter: Position 2 von 19`. Restored to position 1. Escape/close returns focus to Einstellungen öffnen. This is browser click/AX evidence, not physical touch or VoiceOver.
4. Current: no document horizontal overflow at 1363x936. [Screenshot](c56-evidence/02-current.png). Nowcard displays 0% beside Zeitfenster nicht verfügbar: concrete open probability-window/provenance investigation, not proof that measured 0 is missing.

## Narrow proposed fix

Use semantic H3/P instead of STRONG/SMALL for the two existing settings headings. Native block layout separates text and makes headings navigable to assistive technology. No additional CSS, preserving the very tight initial-CSS budget. Earlier experimental CSS rules discarded before commit. Weather data, labels, persistence, sources and controls unchanged. No after screenshot or viewport qualification yet.

## Full C55 worklist carried forward

| Priority | Item | Current state / remaining acceptance |
|---|---|---|
| P0 | Touch targets | #663 integrated; focused event harness passes cancel/up/lost capture/unmount and 44px source contracts. Rendered coarse-pointer matrix pending. |
| P0 | Active navigation | C55 implementation preserved; all workspace transitions and unique aria-current pending live matrix. |
| P0 | Mobile legends | Saved choice preserved; viewport transitions/reload pending. |
| P0 | Sticky/safe area | Small/large smartphone, tablet portrait/landscape and desktop pending. |
| P0 | Loading states | Focused rendered status/consumer test passes. Full layout matrix pending. |
| P1 | Dashboard drag | Live arrow/status verified; real touch drag, scroll competition and reload pending. |
| P1 | Nowcards | Current screenshot captured; compact hazard/missing/extreme cases and probability time basis pending. |
| P1 | Layer UI | Grouping/space/provenance/opacity and original overlay compatibility pending screenshots and interaction. |
| P1 | Mobile settings | Desktop defect proposed fix; mobile overflow, focus and section persistence pending. |
| P1 | Touch popovers | Touch-close, outside click, Escape, focus restoration and viewport bounds pending. |
| P2 | CSS/tokens | No new CSS in this proposal. No broad token rewrite or CSS optimization claimed. |
| P2 | Empty/error | Neutral loading preserved; missing/error/retry consistency pending. |
| P2 | Chart legends | Median vs mode, model/quantile/confidence/data-quality wording pending full consumer review. |
| P2 | Accessibility | Semantic heading fix proposed; keyboard, contrast, focus trap, 200–400% zoom, VoiceOver/TalkBack pending. |
| P2 | Reduced motion | Existing static loading verified by focused test; appwide motion audit pending. |
| QA | Visual devices | Only light desktop 1363x936 captured. No smartphone/tablet/dark/real iOS pass claimed. Cloud browser API exposed no viewport emulation control; browser zoom chord left dimensions unchanged. |

Node22 focused tests passed: test-dashboard-touch-c55.mjs, test-module-loading-state-c55.mjs, test-settings-menu.mjs, test-settings-standard-design-08160.mjs. Full regression/source/installer gates pending; no readiness or publication claim.

## Bottom-bar report and candidate correction

User supplied IMG_2444.jpeg: navigation appears high over the page, above a large empty DWD image panel. Version, scroll history, keyboard state and capture mode cannot be determined from this still image. The DWD image/empty-state issue remains separately open.

Stable iOS hook useBottomNavigationAnchor replaces body-portal fixed positioning with an absolute document top and updates it using scrollY/requestAnimationFrame. This is a concrete compositor-lag risk consistent with the report, not a verified diagnosis on the user's physical device. Candidate retains canonical compositor-fixed CSS, safe-area gap and appearance. Only an unzoomed reduced visual viewport adds a bottom inset; keyboard close, breakpoint changes and unmount restore original inline style. No document scroll listener, absolute top, timer workaround or forced transform/transition override remains. No meteorological changes.

New test test-bottom-navigation-anchor-c56.mjs executes the production hook with mocked effect/viewport events: normal viewport, deep scroll, keyboard open/close, pinch zoom, breakpoint and pending-frame cleanup. PASS. This is a deterministic event test, not Safari rendering evidence. Physical iOS scroll/keyboard/back-forward/orientation verification and real browser matrix remain mandatory before release; do not claim the screenshot defect fixed in production. No additional CSS bytes.

## Requested pre-release acceptance, 2026-11-05

Stable/main and PR head re-read: Stable .435 8b4d311227090ae7b38022173899b5be412f81ec, #669 draft head ebaa92c471530be59a2ba571dd35176d013521f4. Twelve targeted checks executed, raw first-pass results in c56-evidence/targeted-checks.json. Eleven pass immediately. The composite legend/phase test initially exits without output because its child `tsc` is missing from command PATH; rerun with existing Node22 and repository node_modules/.bin succeeds without changing the test or dependencies. Thus all twelve targeted checks passed, not a full regression or rendered visual matrix.

The existing genuine browser matrix scripts/test-location-search-layers-0985293.mjs was attempted unchanged. Both built-in startup attempts terminate SIGABRT: `FATAL:chrome/browser/process_singleton_posix.cc:297 ... socket() failed: Operation not permitted (1)` plus ptrace denial. No browser assertion ran; report BLOCKED, not PASS/SKIP. No sandbox/security bypass attempted. The available cloud-browser API previously exposed only a desktop viewport, without a viewport-emulation control. Physical Safari/iOS/VoiceOver/TalkBack access remains unavailable.

DWD empty/error improvement: original image now handles decode/load failure via onError, shows a role=status explanation and an Erneut laden button. This covers a concrete missing error path; it does not establish the cause of the user's blank-image screenshot. Retry uses existing load lifecycle and keeps original DWD pixels, source timestamps, legends and point/projection semantics. Existing DWD original/zoom tests and composite phase test pass.

Release decision: HOLD. User explicitly requires smartphone/tablet/dark-mode plus full accessibility acceptance before starting publication. Those prerequisites cannot be declared complete from source assertions, mocked events or desktop captures. No ready-for-review or release-bot trigger until rendered candidate matrix and accessibility evidence are supplied by a capable trusted runtime. Remaining matrix includes small/large phone, tablet portrait/landscape, desktop, Light/Dark, long names, 200–400% zoom, coarse touch, focus/contrast/screenreader, layer and legend persistence, nowcard warning/missing/extreme cases. No full WCAG claim.

## Renewed release request: CI repair

Live 2026-11-05: main=mid-stable still .435; PR #669 head fc441af32646e4857f4de455826fcf524522c4d1. Coverage run42100893574: Vitest + V8 step success; later CI inventory step fails because the new bottom-navigation test is absent from both baseline inventories. Corrected both sorted lists to1080 entries; no assertion, shard or limit weakened. Existing isolated-matrix check now passes with1074 Core tests,1080 total, and focused anchor test passes. Source-gate run42100893509 is skipped for draft, not success. PR Completion watcher attempted: blocked because local gh has no authentication; connector remains available for readbacks and ordinary feature-branch commits. No credentials expanded. Rendered/device/accessibility evidence remains required; no release readiness inferred from this inventory repair.

## Versioned combined candidate .436

Latest user request authorizes coordinated publication of qualified improvements. .436 version mirrors and user/technical changelogs synchronized using the canonical script. App/tooling types, Vite production build, versioning, anchor and DWD-original tests pass. Unmodified build budget passes:125 files; code/text gzip1877622B + static media4593259B; initial CSS1759965B. No generated dist included in source commit. Previous inventory repair now passes GitHub Unit/Coverage42104625079 and RUC evidence42104624974. Current .436 must independently pass complete Source/Heavy/browser and installer gates. Remaining full-product audit and physical assistive-technology acceptance remain open; this bounded release does not claim completion of those tasks. No local browser rendering success is asserted. No general PR Completion merge mutation; only established MID source-release bot.


## GitHub rendered matrix correction
Source run42106190295: Source core passes; native browser job127521535442 fails at verify-native-model-browser-0985141.mjs147 because it still explicitly demands absolute iOS positioning. Production behavior fixed is intentional .436 contract change. Update only that stale position expectation and obtain resized gap from canonical computed bottom instead of the removed data-bottom-gap. Existing transformed-parent, actual bottom-gap, scroll invariance, stale offset, resize/restoration, navigation click, 44px target, overflow, Light/Dark and viewport matrix assertions remain intact. All source gates must rerun on new exact head. No browser pass claimed from the failed prior run.

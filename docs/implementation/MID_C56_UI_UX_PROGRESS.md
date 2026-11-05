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

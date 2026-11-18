# MID Design 111 · AppInfoHint Stable-Intake auf v0.9.85.491 – QA-Draft

## Herkunft / unveränderlicher Source
- `MeteoMartini/MID` readback: `main=mid-stable=3f9c5e24dc55fa5154732a1ba73961ba76c29788`, Version `v0.9.85.491` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`. Fünf aktive Rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, UI-/Cross-Platform-Verträge geprüft.
- Unveränderte Originalblobs **ohne Neuentwicklung** aus Spezial-PR [#912](https://github.com/MeteoMartini/MID/pull/912), HEAD `cc7bf9f35f7b1db6d49cce909b316f07b1e749b8`, auf exakt diesen Stable-SHA selektiv übernommen. Die konkrete Produktdatei `src/AppInfoPopover.tsx` trägt Originalblob `fbf71d8fa289130ae60db0b1bef42282a4e4ab90`.
- `src/AppPortalPopover.tsx` ist auf beiden Quellen blob-identisch (`7d2c92aa39cb7529d4e7190a67a07a1f4dae30de`); keine Änderungen am globalen Fokusmanager, CSS, App.tsx, Weather-Daten, Warnungen, Quellenlogik oder Release-Dateien. Das separate LC-Release [#924](https://github.com/MeteoMartini/MID/pull/924) überschneidet die fünf geerbten Dateipfade nicht.
- **QA-Draft, keine Release-Version, keine Produktfreigabe**. Die alte #912-Quelle bleibt Provenienz; nach echter Integration genau eine der beiden Fassungen übernehmen, nicht beide mergen.

## UI / Accessibility / Performance
1. Für die geteilte `AppInfoHint`-Komponente erzeugt React `useId()` pro Instanz eine stabile ID. Der Trigger führt `aria-controls` nur, während sein zugeordnetes Dialogportal tatsächlich existiert. Das Dialogportal erhält dieselbe ID; `aria-haspopup=dialog`, `aria-expanded`, Label, Schließwege bleiben bestehen.
2. `useCallback(()=>setOpen(false),[])` vermeidet einen neuen Funktionsverweis pro Eltern-Render und unnötiges Re-Abonnieren des bestehenden Outside-Pointer-/Escape-Effekts in `AppPortalPopover` auf identischen Öffnungszuständen. **Kein gemessener INP-, FPS- oder CPU-Gewinn behauptet**.
3. Die Original-Unit-Regression prüft 2 SSR-Triggers, eindeutige Beziehungen, stabile Close-Callback-Quelle, 44px opt-in Touchfläche und den Browser-Runner. Der originale opt-in Vite+Chromium-Runner testet 320/390/834/1440 CSS px × Light/Dark = 8 synthetische Kontexte inkl. Fokusrückkehr, Escape, Enter, Outside-Pointer und Overflow, ist aber **nicht Teil des automatisch behaupteten Builds**.

## Wissenschaftliche und technische Qualitätsschranken
- Offizielle React useId Dokumentation: https://react.dev/reference/react/useId ; useCallback: https://react.dev/reference/react/useCallback
- W3C ARIA 1.2 Dialog: https://www.w3.org/TR/wai-aria/; WAI APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- meteoblue 29.06.2026 App-Redesign: https://www.meteoblue.com/de/blog/article/show/40646_Android-App-Update%3A%2BNeue%2BOberfl%C3%A4che%2C%2Bgewohnte%2BTiefe
- Browser+native acceptance: 320/360/390/430/834/1024/1440 CSS px; portrait+landscape, Light/Dark, 100/200% text, Dialogzahl >1, long German labels, Escape/Enter/Tab, focus containment and restoration, touch and VoiceOver/WebKit separately.
- Kein generierter CSS-, Weather-/Worker-/Pages-/RUC-/Warning-Eingriff. Design-Prinzip: bestehende Information zugänglich machen, keine neue Daten- oder UI-Architektur.

## Handoff / Auto-priorisierte Integration
- P0 separater LC Release #924, nicht blockieren.
- P1 [#925](https://github.com/MeteoMartini/MID/pull/925) (Ortsnamen/Quellen), bereits fokussiert getestet, vollständige App-Browser-QA noch offen.
- P1 [#920](https://github.com/MeteoMartini/MID/pull/920) Settings tab mount owner, benötigt App.tsx Integration + Vollapp-QA.
- P2 **Dieser Draft** nur nach tatsächlichem SHA-Readback/Tests/Browser-/Focus-Regression selektiv als Shared-InfoHint-Intake; #912 erst danach als ersetzt behandeln.
- P2 [#915](https://github.com/MeteoMartini/MID/pull/915) Laden/Reflow; P3 [#909](https://github.com/MeteoMartini/MID/pull/909) Ensemble-Details.
- Nach QA regulärer MID Pfad Source-PR-Gate → kontrollierter SHA-gebundener Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Kein Versionsbump eines Spezial-Drafts. Keine Review-/Ruleset-/Secret-Abkürzung.

**Status: Quellen übernommen / GitHub-Draft-QA offen. NICHT READY, NICHT RELEASE.**

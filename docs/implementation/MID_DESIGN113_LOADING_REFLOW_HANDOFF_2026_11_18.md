# MID Design 1.13 · Produktive Ladezustände bei langen Texten sicher umbrechen

**18.11.2026 · SHA-gebundener Spezial-Handoff · ausschließlich QA-Draft, kein Release**

## Source of Truth und Parallelität

Bei Erstellung: GitHub `MeteoMartini/MID`; `main = mid-stable = 9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, `v0.9.85.488` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`; fünf aktive GitHub-Rulesets. `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` gelesen. Der LC-Release-Train #902 und Design-Drafts #906, #909, #912, #913, Karten-#908/#914 und ältere #868 bleiben fremdverwaltet. Kein bekannter paralleler PR verändert `src/ModuleLoadingState.tsx`. Vor Integration Eigentümerschaft und SHAs erneut prüfen.

## Priorität und Wettbewerbsmuster

**P1/P2 zuerst:** Die appweite Settings-Entflechtung sowie aktive vs. inaktive Ansichten bleiben unter LC-/App-Ownership und dem QA-Draft #906. Der neu verifizierte P2-Befund zu einem nicht gerenderten Qualitätsindikator wurde im selben Draft abgesichert, nicht als scheinbar funktionierendes Produktdesign ausgegeben.

**P3 hier:** Die gemeinsame `ModuleLoadingState`-Komponente ist tatsächlich produktiv eingebunden, etwa in `src/MapWorkspacePanel.tsx` und `src/LongRangePanel.tsx`; sie rendert ausschließlich neutrale Skeleton-Geometrie, keine erfundenen Wetterwerte, keine Zeitstempel, keine Scheingenauigkeit. Ihre Originalstruktur hatte einen CSS-Grid-Container mit automatischer Spalten-Mindestbreite und ein ungeguardetes `<span>{label}</span>`: Ein lokalisiertes Lade-Label, sehr langer Ortsname oder untrennbarer Anbietername konnte daher in kleinen Viewports den Grid-Intrinsic-Width-Bedarf vergrößern. Der gerenderte Sonderfall ist vor dem Browserlauf **noch keine bestätigte Live-Fehlerreproduktion**; die mögliche Überlaufursache ist quellenbasiert.

Originalquellen als Produktleitlinie:
- meteoblue Android-Redesign 2026, bestehende Predictability-/rainSPOT-Funktionen beibehalten und Accessibility verbessert: https://www.meteoblue.com/en/blog/article/show/40646_Android%2BApp%2BUpdate%3A%2BA%2BNew%2BInterface%2C%2BSame%2BDepth
- Apple Weather: Stündliche Detailparameter per gezielter Interaktion, kein zweites Navigationstool erfinden: https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26
- W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C Technik C33 für lange Strings: https://www.w3.org/WAI/WCAG22/Techniques/css/C33
- MDN `overflow-wrap: anywhere` und Intrinsic-Mindestgrößen: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap

## P3-Produktänderung: lokal, null Zusatzlast

`src/ModuleLoadingState.tsx`:
- Container bekommt `gridTemplateColumns:'minmax(0,1fr)'`, damit nicht der längste untrennbare Text die Grid-Mindestbreite bestimmt.
- Das einzige sichtbare Text-`span` bekommt `minWidth:0`, `maxWidth:'100%'`, `overflowWrap:'anywhere'`; es wird **nicht** mit Ellipsis gekürzt.
- Originalelemente, vorhandene `aria-live="polite"`-/`role="status"`-Semantik, `aria-hidden`-Dekor, reservierte Kartenhöhe (`MapWorkspace.css`), externe `className`, CSS-Theme-Tokens und keine Animations-/Progressbehauptung bleiben unverändert.
- Kein neuer React-State, kein Listener, keine Memoisierung, kein Netzwerkaufruf, kein Wettermodellcode oder zusätzlicher CSS-Import. Die Layout-Regel ist auf diese bestehende Primitive begrenzt. **Keine ungemessene INP-/LCP-/Heap-Zahl.**

## P4 Regression und wirklich gerendertes QA-Harness

`tests/unit/mid-design113-shared-loading-reflow.test.ts`: fünf deklarierte Testfälle, davon zwei getrennte `chart`/`map`-Parameterläufe; prüft das reale React-SSR der langen Labels, ARIA-Status/Dekortrennung, fehlende synthetische Wetterwerte, unveränderte Map-Klasse, HTML-Escaping und die syntaktische Gültigkeit des optionalen Browser-Runners.

Der bereits geschützte Node-Regressionstest `scripts/test-module-loading-state-c55.mjs` bleibt unverändert und ist beim späteren LC-Intake erneut auszuführen. `tests/visual/design113-loading-reflow-qa.html` und `.tsx` mounten die **tatsächliche MID React-Komponente** in einem ausdrücklich **isolierten** Light-/Dark-Testlayout mit einem sehr langen synthetischen Orts- und Produkttext. Das optionale `scripts/qa/verifyDesign113LoadingReflowBrowser.mjs` untersucht 7 Viewports (320/360/390/430/834/1024/1440 CSS px) × 2 Themes × 1×/2× Root-Schriftgröße = **28 Browserkontexte und 56 gerenderte map/chart-Fälle**. Es verlangt, dass Text und Status sichtbar vollständig bleiben und Root-/Panel-/Label-Overflow ausbleibt; `aria-hidden`-Dekore dürfen den Status nicht verfälschen. Browserfehler schlagen fehl; `evidence.json` wird auch bei Fehlern geschrieben.

Aufruf auf identisch ausgechecktem Quellcommit (Chromium + Vite + Playwright notwendig):

```bash
node scripts/test-module-loading-state-c55.mjs
node scripts/qa/verifyDesign113LoadingReflowBrowser.mjs
```

**Beweisgrenze:** Der Browser-Runner ist Quellcode und **wurde in diesem Spezialchat nicht ausgeführt**. Er enthält eigenes Fixture-CSS und ersetzt somit weder realen App-Stylesheet-Test noch die 320–1440px-Smartphone/Tablet/Desktop-Matrix im veröffentlichten Produkt, echte Rasterdaten, iOS WKWebView, Dynamic Type, VoiceOver, High Contrast, Landscape oder Leistungsprofiling. Erst Exit 0 mit `ready:true`, 28/28 Evidenzfällen und zum GitHub-HEAD passendem `GITHUB_SHA` ist ein nachweisbarer Browserlauf. Die vollständige Live-App braucht zusätzlich eine echte Prüfung.

## Integrationsvorgabe

P1 #906 Settings/App-Mount und P2 Legacy-/Settings-Reachability zuerst; danach P3 disjunktes, getestetes `src/ModuleLoadingState.tsx`-Hunk- und Unit-File ins vom Leitchat verwaltete `chatgpt/*`-/`codex/*`-Releasepaket aufnehmen; zuletzt P4 realer Browser-/iOS-/Accessibility-Nachweis. Keine direkte Änderung an `main`/`mid-stable`, keine Daten-/Storage-/Governance-Vertragsänderung. Voller Source-PR-/Review-/Core-/Heavy-/ZIP-/Installer-/Worker-/Pages-/Stable-Gatepfad bleibt ungekürzt. Den eigenständigen `npm audit`-Blocker der LC-PR #902 weder als Design-Pass ausgeben noch umgehen. **DRAFT / NO READY / NO MERGE / NO RELEASE.**

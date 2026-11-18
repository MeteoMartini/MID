# MID Design 1.13 · Shared Loading State Stable-Intake, 18.11.2026
**QA DRAFT · NO READY / NO MERGE / NO RELEASE**

## SHA-verifizierte Provenienz
- Aktuell `main=mid-stable=3f9c5e24dc55fa5154732a1ba73961ba76c29788`, MID `v0.9.85.491` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`. Fünf aktive MID Rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` gelesen.
- Altvorarbeit [#915](https://github.com/MeteoMartini/MID/pull/915), verifizierter HEAD `834415f0d9fc69cc0f8eaa208159d4720bd4e391`, ursprüngliche Stable-Basis `9fe4dfbcdfd5a1f8fec55efa868e22110a612953`. Die fünf tatsächlichen Code- und QA-Dateien dieses neuen Intakes sind byte-/blob-identisch zu #915; keine zusätzliche Produktimplementation.
- Gemeinsamer Stable-Bestand `src/ModuleLoadingState.tsx` vorher `28d464fcd3bd0762130d58a2386e48dc1a168cad` → selektiv Originalblob aus #915 `1f0089f3d4e7601ea9732f76a2eb713331345917`. Kein Konflikt mit offenen #924 RUC, #925 Quellen/Ort, #927 AppInfoHint, #920 Settings, #909 Ensemble, #908 Canvas, #926 Karten/Fusion, #868 MapWorkspacePanel nach Dateipfad-Abgleich beim Branch-Cut. **Parallelität vor Integration erneut prüfen.**

## Produkt-/Performance-Relevanz
Die bestehende gemeinsame `ModuleLoadingState`-Komponente wird in Karten-/Langfrist-Modulen verwendet. Der bisherige neutrale Ladezustand kann bei langen nicht umbrechbaren Bezeichnungen eine implizite Grid-Mindestbreite erzwingen und das Layout über schmale Viewports vergrößern. Der originale, schmale Patch ergänzt im Root-Grid `gridTemplateColumns:'minmax(0,1fr)'` und beim Textspan `minWidth:0,maxWidth:'100%',overflowWrap:'anywhere'`. Das wahrt volle Meldungen, verhindert keine eigentlichen Fehlerzustände und macht **keine** meteorologische Prognose.
- Unverändert: `role=status`, `aria-live=polite`, `aria-hidden` für dekoratives Skeleton; Kartenhöhe/Platzhaltergeometrie; keine synthetischen Zahlen/Nullwerte, Abfrageintervalle, zusätzlichen Listener, Timer, Animation oder React-State.
- Kein behaupteter CPU-/INP-/FPS-Gewinn; die Änderung ist eine statische CSS-Layoutbegrenzung, keine Optimierung von Kartenberechnung oder RUC.
- W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html; CSS long-string guidance: https://www.w3.org/WAI/WCAG22/Techniques/css/C33
- meteoblue Android-Redesign 2026: https://www.meteoblue.com/en/blog/article/show/40646_Android%2BApp%2BUpdate%3A%2BA%2BNew%2BInterface%2C%2BSame%2BDepth
- Apple Weather detail UX: https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26

## Test- und Integrationsgate
- Original `tests/unit/mid-design113-shared-loading-reflow.test.ts` prüft SSR-Markup für Map/Chart, langes Wort, nativen Status, unverändertes Skeleton und keine erfundenen Wetterwerte sowie sicheres Escaping; JS Browser Runner wird syntaxgeprüft.
- Optional `scripts/qa/verifyDesign113LoadingReflowBrowser.mjs` verwendet die tatsächliche React-Komponente mit synthetischen Labels: **7 Breiten (320/360/390/430/834/1024/1440) × hell/dunkel × 100/200%-Schrift = 28 Kontexte**. Browser-QA nur als bestanden deklarieren, wenn am **exakten neuen HEAD** ausgeführt und `evidence.ready=true`, 28/28, keine JS-/Overflowfehler. Sonst NOT VERIFIED.
- Darüber hinaus komplette MID-App (Maps/LongRange, lange Ortsnamen, Safe Areas, Rotation, Warnungen, Overlay/Fokus, Touch, iOS/WKWebView/VoiceOver, fachliche NoData-Provenienz) und GitHub Source-/Core-/Heavy-/Review-/Release-Gates erforderlich.
- Release Owner kontrolliert den etablierten MID Source-PR → SHA-gebundener Merge → serverseitiges Release-ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Dieser Draft hat keinen Versionsbump, keine Changelog-/Production-/Branchschutzänderung, keinen Release-Dispatch.

## LC-Auto-Priorisierung (heuristisch, ohne PostHog-Messdaten)
- P0 separat: #924 RUC/EPS-Release, nicht blockieren.
- P1: #925 responsive Orts-/Quellbedienung; #927 Info-Hint, jeweils nach Real-App-UX-QA.
- P1 Architektur: #920 Settings-Tab-Mount zuerst sorgfältig auf den neuesten Stable integrieren, neun Tabs und Persistenz verifizieren.
- P2: **dieser Stable-Intake** für neutrale Ladezustände; altes #915 erst nach belegter Integration als ersetzt schließen, niemals blind doppelt mergen.
- P3: #909 Ensemble-Detail-Reflow.

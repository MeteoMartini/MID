# MID Design 1.10 – Ensemble-Reflow als Stable-Intake (18.11.2026)

**QA DRAFT · NO READY · NO MERGE · NO RELEASE**

## GitHub Source of Truth, Audit und Herkunft
- `main=mid-stable=3f9c5e24dc55fa5154732a1ba73961ba76c29788` auf MID `v0.9.85.491`, verifiziert in `package.json`, `MID_BASELINE.json`, `contracts/index.json`; fünf aktive Rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md`, `MID_STATE_INTEGRITY_CONTRACT.md`, `MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` konsultiert.
- Exakte Originalblobs aus Spezial-Design-PR [#909](https://github.com/MeteoMartini/MID/pull/909), HEAD `0982290863ddb23b0aa16d6df1d83dc0edf2e0f9`. Übernimmt **fünf unveränderte originale Code-/Test-/Visual-/Browser-Runner-Dateien** auf neuen `chatgpt/*`-Branch; eine neue SHA-gebundene Dokumentation. Keine unverified Chat-/ZIP-/Replit-Quelle. Ursprüngliche Stable-Produktdatei `src/ForecastConfidence.tsx` Blob `868937d780c8cf331da25d0b1cbe2fed02c7c395`; Zielproduktblob `b3d68a84c5828490aee89ce0df10302f5318ac60`.
- Kein Eingriff in `src/App.tsx`, CSS-Golden, Worker, Meteorologie/Fusion, Datenprovenienz, Tageswerte, UI-Portal-Fokus-Owner, Settings/Persistenz. Der aktive Radar-PR #929 verändert `src/App.tsx` und überschneidet sich mit Settings-PR #920; **darum wird #920 bewusst nicht gleichzeitig portiert**. Für diese Ensemble-Änderung besteht nach PR-Datei-Abgleich kein Cross-Owner-Pfadkonflikt mit #924, #929, #925, #927, #930, #919.
- #909 Original-Quelle bleibt offen; nicht gleichzeitig #909 und diesen Intake mergen oder vor verifizierter tatsächlicher Integration als ersetzt schließen.

## Veränderung
- In `EnsembleAssessmentDetails` kann die Parametername-/Konfidenz-`dt`-Flexzeile mit `flexWrap:'wrap'`, `minWidth:0`, `maxWidth:'100%'` und `overflowWrap:'anywhere'` auch bei längeren deutschen Parametern innerhalb schmaler Popover umbrechen; keine truncation.
- `fontSize:12` (fest in CSS px) → `fontSize:'0.875rem'` für Root-Textpräferenz/Zoom. Methodik-`summary` bekommt statisches `minHeight:44`; native Details und alle Erläuterungen bleiben.
- Kein neuer Listener, Request, Timer, React-State, Canvas, Rechenpfad, meteorologischer Score oder synthetischer Wetterwert. Weder Optimierungsgewinn noch Qualitäts-Freigabe ohne reale Messung behaupten.

## Tests und Browser-Abnahme
- `tests/unit/mid-design110-ensemble-detail-reflow.test.ts` bewahrt fachliche Label/NoData-/Score-Texte, die tatsächlichen Wrap-Eigenschaften, relative Typografie und 44px-Disclosure.
- `scripts/qa/verifyDesign110EnsembleReflowBrowser.mjs` testet optional **die tatsächliche React-Komponente**, aber mit synthetischem Layouttext, 7 Breiten 320/360/390/430/834/1024/1440 px × Light/Dark × 100%/200% = 28 Kontexte. Dies ist kein Voll-App-, WebKit-, iOS- oder VoiceOver-Test, nicht automatisch aus dem Vorhandensein des Skripts abnehmen. Nur bei 28/28, `ready:true`, aktueller GITHUB_SHA positiv als gesonderte Fixture-QA dokumentieren.
- Vor Integration echte MID-App-Viewports / iOS WKWebView und VoiceOver, Safe Areas, Dynamic Type, lange Ortsnamen, Focus+Keyboard+Disclosure, text-wrap in Popovern, NoData/Unsicherheit/Echtwarnungs-Abgrenzung, echte Core-/Heavy-/Source-/Review-Gates, Datenschutz/Performance-Regressionsmessung. CSS-/JS-Browser- und Screenshotvergleiche müssen auf der endgültigen Integrations-SHA stattfinden.
- Abschluss ausschließlich etablierter MID Source-PR → kontrollierter SHA-gebundener Merge → server ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion, keine Gates bypass, Versionsbump nur bei tatsächlichem Build.

## Vergleichsquellen (keine direkte MID-Performance-Evidenz)
- meteoblue [Android-Redesign Juni 2026](https://www.meteoblue.com/de/blog/article/show/40646_Android-App-Update%3A%2BNeue%2BOberfl%C3%A4che%2C%2Bgewohnte%2BTiefe) und [iOS-Redesign Dezember 2025](https://www.meteoblue.com/de/blog/article/show/40560_Gro%C3%9Fes%2BUpdate%2Bder%2Bmeteoblue%2BWetter%2B%26%2BKarten%2BiOS-App): Vorhersagetiefe erhalten bei besserer Lesbarkeit/Dynamic Type.
- W3C [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) – 320 CSS px und 200%-Text.
- React [state preservation/remount](https://react.dev/learn/preserving-and-resetting-state) – Settings-Tab-Mount aus #920 benötigt gesonderte Zustands-/Persistenzregression.

## Auto-priorisierter Lead-Work-Intake
1. **P0** #924 RUC/EPS separat, Release-QA nicht durch Design ändern.
2. **P1** #920 Settings-Tab-Split **konfliktarm erst nach kombinierten Hunk-/Owner-Gate mit #929 (Radar), beide `src/App.tsx`**; ohne diese Belege STOP.
3. **P1/P2** #925 Ortsnamen/Quellen und #927 AppInfoHint, Full-App-Browserchecks, ggf. im künftigen LC-Train gemeinsam integrieren.
4. **P2** #930 geteilte Loader-Reflow, schon originalportiert und Draft-Vitest-geprüft.
5. **P3** dieses Paket aus #909, fachlich engster Scope: Ensemble-Details/Methodik.

**Keine Freigabe.** Die Voll-App-Browser-/Native-Schranken bleiben trotz grüner Unit-Tests zwingend.

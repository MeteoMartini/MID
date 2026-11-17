# MID Design 1.10 · Ensemble-Detail: Reflow, relative Typografie und Touch-Bedienung

**17.11.2026 | SHA-gebundener Spezial-Handoff | QA-Draft, kein Merge, kein Release.**

## Basis und Eigentümerschaft
Published Source: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, `v0.9.85.488`, drei synchrone Versionsspiegel und fünf aktive Schutzrulesets. `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` sowie Bottom-Bar-Vertrag gelten. Ältere Drafts sind kein Code-Base-Snapshot. Leitchat PR #902 besitzt den Release-Train; PR #906 die Settings-/Ansichtsprüfung; #900 Dashboard-Touch; #896 Ortsnamen. Kein produktiver Pfad mit diesen Spezialänderungen überlappt; vor Integration erneut prüfen.

## P1 / P2-Abhängigkeiten
- P1 Settings-Entflechtung ausschließlich über PR #906 und aktuellen LC-`App.tsx`-Eigentümer nach SHA/Blob/Hunk-Vergleich.
- P2 alte Ansichtsrenderer und Legacy-Präferenzen nur mit Import-, Persistenz-, Browser- und Migrationsbelegen löschen. Desktop-Rail, 7d/14d, Kurzfristprofil und echte Kartenzustände bleiben aktiv.
- Dieser PR ändert weder `App.tsx` noch Settings-/Startup-/Favoritenspeicher.

## P3: Originalkomponente, minimale Produktänderung
`src/ForecastConfidence.tsx`:
1. `EnsembleAssessmentDetails` lässt beide `dt>b`-Inhalte über `flexWrap:'wrap'`, `minWidth:0`, `maxWidth:'100%'`, `overflowWrap:'anywhere'` innerhalb des Popovers umbrechen, statt eine zu breite einzeilige Flex-Geometrie zu erzwingen.
2. Die bisherige absolute Detail-Schriftgröße `12px` wird durch `0.875rem` ersetzt, damit eine bewusste Root-/Browser-Textskalierung berücksichtigt wird.
3. Der native Methodik-`summary` besitzt `minHeight:44` und `display:flex;alignItems:center`; Escape-/Dialog-/Forecast-, Daten- und Renderer-Logik bleibt unverändert.
4. `tests/unit/mid-design110-ensemble-detail-reflow.test.ts` prüft die zwei Reflow-Kinder, Textskalierung, 44-px-Target und unveränderte Bewertungs-/Datenqualitätstexte. **Quelltests sind kein Browsermessbeleg.**

## P4: Tatsächlich gerenderte Komponente — wiederholbarer Browser-Runner

```bash
node scripts/qa/verifyDesign110EnsembleReflowBrowser.mjs
```

`tests/visual/design110-ensemble-reflow-qa.html` und `tests/visual/design110-ensemble-reflow-qa.tsx` mounten die **echte** `EnsembleAssessmentDetails` aus dem Produktcode, allerdings mit ausdrücklich **synthetischem, nicht meteorologischem QA-Text**. Der Browser-Runner folgt dem im Repository bestehenden Vite-/Playwright-Muster und verlangt Chromium, wenn er tatsächlich ausgeführt wird (kein stilles Skip). Alle Ergebnisse und Fehler erscheinen in `artifacts/design110-browser-qa/evidence.json`. Die QA umfasst 7 Viewports (320/360/390/430/834/1024/1440 CSS px) × zwei Themen × einfache/doppelte Root-Textgröße = 28 tatsächlich gemessene Kontexte. Pro Kontext: sichtbare Originalkomponente, keine Root-/Panel-/Detail-/Label-Overflow, korrekte Flex-/Word-Wrap-Styles, 14/28-px-Detailtypografie, `summary`-Höhe mindestens 44px, native Enter-Tastaturöffnung, unveränderte `nicht bewertbar`-Kennzeichnung, keine JavaScript-Ausnahme. Fehlender Browser oder unzulässiger Datenbefund muss den Runner fehlschlagen lassen.

**Wichtig:** Dieses QA-Harness ist bereits im Spezialbranch als reproduzierbarer Code vorbereitet, **aber nicht als erfolgreiche Browserausführung oder als verpflichtender Source-Gate-Job belegt**. Ein echter Nachweis ist erst ein ausgeführter Test mit Exit 0, vollständigem 28/28-Evidence-Ledger und zum Ziel-HEAD passendem SHA. Nach LC-Intake mindestens Browserlauf am finalen kombinierten Kandidaten plus weitere App-Navigation mit Daten-/Speicherpersistenz, 200-%-Text und Landscape prüfen. Dieser Test misst weder reale Input-Latenz/INP noch iOS/WKWebView oder VoiceOver.

## Externe Originalreferenzen
- W3C WCAG 2.2 Reflow (AA): https://www.w3.org/WAI/WCAG22/Understanding/reflow.html — 320 CSS px / 400 % Zoom, mit Karten-Ausnahme für zweidimensionale Inhalte.
- W3C WCAG 2.2 Target Size Minimum (AA): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — mindestens 24 CSS px, Ausnahmen möglich.
- Apple Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility — iOS/iPadOS empfohlen 44×44 pt.
- MDN CSS overflow-wrap: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap
- web.dev INP: https://web.dev/articles/optimize-inp

## Veröffentlichung
Nur SHA-geprüfte selektive Produkt-/QA-Blobs durch den Leitchat in seinen **eigenen** autorisierten Integrationsbranch übernehmen. Kein direktes Schreiben auf `main`/`mid-stable`, kein Release ohne Source-/Review-/Core-/Heavy-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates. Vor allem #902 npm-Audit-Sicherheitsblocker nicht aufweichen. Änderungen in diesem Spezial-Draft sind **nicht** produktiv ausgerollt.

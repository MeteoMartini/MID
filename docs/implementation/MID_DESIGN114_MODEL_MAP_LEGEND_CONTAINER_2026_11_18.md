# MID Design 1.14 — Kartenlegende folgt ihrer Containerbreite

**18.11.2026 — unveröffentlichter QA-Draft; SHA-gebundener Handoff an LC/LW, kein Release**

## Ausgangsbasis, Verantwortlichkeit
- GitHub `MeteoMartini/MID`: `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953` / v0.9.85.488 in `package.json`, `MID_BASELINE.json`, `contracts/index.json`; fünf aktive Rulesets.
- `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_PARAMETER_COLOR_CONTRACT.md` und Cross-Platform-Vertrag gelten.
- Release-Train #902 ist zum Zeitpunkt der Erstellung bereits **undrafted** und sein neuer SHA `3758d463e07576a49a36302e43068f206c231d99` hatte Source 1/1, Core 4/4, Heavy 6/6 erfolgreich abgeschlossen, war aber noch nicht gemergt oder nach Stable promotet. **Diesen laufenden Train nicht anfassen**; vorher/nachher stets frische SHA prüfen.
- Karten-Spezialentwicklungen #904/#908, Wetterdaten-#914 und Design #906/#909/#912/#913/#915 greifen laut verifizierter Dateilisten nicht auf `src/modelMapScaleLegend.css` zu; bei neuer Drift stoppen.

## P1/P2 — vorhandene Kanonizität erhalten
Der Leitchat besitzt das Settings-/App.tsx-Mounting (#906) und die QA-Abklärung, welche Legacy-Ansichten oder inaktive UI tatsächlich nicht erreichbar sind. Es erfolgt hier weder eine neue Navigation noch eine Löschung oder neue Einstellung.

## Wettbewerbsprinzip und konkrete P3-Fehlersituation
- meteoblue MultiModel trennt Modellvergleich und Prognoseunsicherheit fachlich: https://content.meteoblue.com/en/private-customers/website-help/forecast/multimodel
- ECMWF erläutert in den aktuellen Open-Access-Charts unterschiedliche Parameter und Ensemble-Szenarien: https://confluence.ecmwf.int/spaces/FUG/pages/673551825/Section%2B10.1%2BOpen%2BAccess%2BCharts
- Moderne CSS-Guidance empfiehlt **Container Queries** für modulare Karten/Seitenleisten statt alleiniger Viewport-Media-Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- W3C WCAG 2.2 Reflow/Focus Visible und 2.4.11 (Fokus nicht verdeckt): https://www.w3.org/WAI/WCAG22/Understanding/reflow.html / https://www.w3.org/WAI/WCAG22/Understanding/focus-visible

`src/modelMapScaleLegend.css` schichtete die Modus-Umschaltung bislang nur bei **Viewport ≤560px** unter die Einheiten-/Modellidentität. Bei einem 1440px-Desktopfenster mit schmaler 220px-Karten-Seitenleiste bleibt die 220px breite Zweifach-Umschaltung dagegen horizontal neben dem Parametertitel und kann seitlich überlaufen. Der alte `font-size:11px;white-space:nowrap`-Button ignorierte zusätzlich bewusst vergrößerte Root-Schriften.

## P3 — minimaler CSS-Patch, kein neuer Renderer
Nur `src/modelMapScaleLegend.css`:
1. Die existierende Legendenbox bekommt `container:mid-model-map-legend/inline-size` und `width:100%;max-width:100%` bei erhaltenem `min-width:0`.
2. `@container mid-model-map-legend (max-width:460px)` ordnet innerhalb einer schmalen **Komponente** Header und Skalenmodus vertikal an.
3. Die vorhandenen zwei Modusbuttons verwenden `font-size:.75rem`, `white-space:normal`, `overflow-wrap:anywhere` und mittige Ausrichtung. Das bewahrt die vollständigen deutschen Namen bei größerer Root-Schrift; 44px-Mindesthöhe, `touch-action:manipulation`, `aria-pressed`, `disabled`, `focus-visible` und Quellen-/Farbvertragslogik bleiben byteidentisch.

Kein neues JS, React-State, Memo, DOM-/Canvas-Listener, Fetch, Worker, Tooltip- oder Wetterdatenpfad. Die tatsächlichen numerischen Kartenticks, Einheiten, Original-Farbskala und PNG-Export bleiben unverändert.

## P4 — nachweisbare Grenzen und Abnahme

**Chromium-Layoutabnahme steht aus.** Die Prüfung umfasst 220, 260, 320, 440 und 720 CSS px Containerbreite bei normaler und vergrößerter Schrift.

**Regressions-Commit:** `tests/unit/mid-design114-model-map-legend-container.test.ts` führt fünf Vitest-Fälle mit tatsächlichem React-SSR der bestehenden `ModelMapScaleLegend` aus: Container Query ohne Viewport-Stacking, Rem/Wrap und Mindesttouchziel, Original-Labels mit Einheit/Ticks/Gradient, korrekte `aria-pressed`-/`disabled`-Werte (Wertebereich/Feste Skala, Animation, nicht verfügbare räumliche Spanne) sowie zentrale CSS-Token und Fokuszustand. Aufnahme durch bestehenden `tests/unit/**/*.test.ts`-Glob, keine unregistrierte neue Root-`scripts/test-*.mjs`-Regression.

**Nach LC-Intake obligatorisch:** bestehende native Modellkarten-Browser- und Quellregressionen `scripts/verify-native-model-browser-0985141.mjs`, `scripts/verify-model-map-presentation-0985148.mjs` und `scripts/test-radar-model-map-contract-0985137.mjs` auf identischem finalem SHA; echte dynamische 220/260/320/440/720px Seitenleisten-Matrix, Light/Dark/High Contrast, 200% Browserzoom, mehrere Locale/Einheiten, Fokus-/Tastatur-/Touch, WMS- und Exportvergleich, WebKit/VoiceOver getrennt. Alle belegten Ergebnisse mit Ziel-SHA dokumentieren. Bestehende Rasterextrema und Missing Data unverändert prüfen. Laufzeit- oder Bundle-Verbesserung wird **nicht** ohne Messung behauptet.

## Integrationsvorgabe
Spezial-PR nur als Draft; selektiver SHA-/Datei-/Hunk-Intake **nach** bereits freigegebenem LC-Release oder auf zukünftigem authorisierten Integrationsbranch. Nicht in den fertigen #902-Train hineinschreiben. Vor Aufnahme erneut main/mid-stable/Version/Parallelarbeit abgleichen. Kein direktes Schreiben, Merge, Release, Installer-Dispatch oder Stable-Promotion. Source-PR, signierte Verträge, Reviews, Core, Heavy, browserbasierte Regressionen, serverseitiges ZIP, Installer, Worker/Pages und Stable-Gates bleiben verbindlich; #740/#839 und jeder aktuelle Source-Blocker dürfen nicht umgangen werden.

**Stand: Produkt-CSS und Unit-Tests geschrieben; CI-/Vollbrowserresultate am aktuellen PR-HEAD erst nach tatsächlichem Readback gültig.**

# #344 · gemessener Stable-Start-CSS-Stand, Optimierung blockiert

Basis nach ausdrücklicher Nutzerfreigabe der aktuellen statt der veralteten .423-Basis: `main=mid-stable=7e998730daaa4a409cd3e15d4f4cf0f70efaaeda`, MID .425; Package/Baseline/Source of Truth konsistent, fünf Rulesets aktiv. Installer 41787163694 auf Source-SHA 4f8d0572700c3e8cd1075e0c5a6effcefd5b24d7 einschließlich Core/Heavy/Worker/Pages/Finalize erfolgreich. #646, #649 und die Niederschlagskorrektur sind in der aktuellen Basis enthalten; offene Herkunftsdrafts #645/#648/#650 werden nicht erneut umgesetzt. Keine parallele CSS-Split-Arbeit in der gelesenen PR-Liste.

## Ein unveränderter Produktionsbuild, bestehende Messung

Ausgeführt: `timeout 90s npm run verify:vite`, danach `timeout 30s node scripts/check-build-budget.mjs`. Produktionsbuild erfolgreich. Der vorhandene Budgetmechanismus misst aus dem gebauten HTML ein initiales Stylesheet `assets/index-BC4N0piA.css`:

| Messwert | Stable-Ist |
|---|---:|
| Initial CSS roh | 1.759.070 B |
| Initial CSS gzip-9 | 249.684 B |
| Initial CSS Brotli-6 | 212.994 B |
| Initiale Stylesheets | 1 |
| CSS gesamt gzip-9 | 284.757 B |
| JS gesamt gzip-9 | 1.488.771 B |
| Gesamt gzip-9 | 8.718.691 B |

Der bestehende Check endet **Exit 1**: `totalGzipBytes: 8718691 > 8500000`. Überschreitung **218.691 B**. Die drei Initial-CSS-Limits (1.760.000/320.000/225.000 B) werden eingehalten; roh verbleiben nur 930 B. Diese Zahlen sind Dateigrößen, kein Netztransfer und keine Millisekunden-Laufzeitmessung. Keine Limits verändert, keine zweite Messlogik eingeführt.

## Genau ein Kandidat untersucht, kein riskanter Split

Geprüft: main.tsx → generiertes midPresentation.css; kanonischer presentation-order-Manifest, 30-modern.css, build-maintenance-aggregates.mjs, cssCascade.mjs, initialCssBudget.mjs, check-build-budget.mjs, MID_PERFORMANCE_BASELINE.json und vite.config.ts. Bestehendes cssCodeSplit und Offline-Shell-Verzeichnis bleiben erhalten.

Kandidat: `styles-src/25-extreme-outlook.css` (24.083 Quellbytes) am bereits lazy geladenen ExtremeWeatherOutlookPanel. Quellgröße ist keine gemessene Bundleersparnis. Kein anderer Optimierungsbereich geöffnet.

Die Quelle ist kein unabhängig verschiebbares Stylesheet: `.extreme-period-tabs small` setzt `line-height:1.25`; die später kanonisch eingelesene gemeinsame Regel `:is(...,.extreme-outlook-panel,...) small` in 30-modern.css setzt `line-height:1.35`. Beide haben dieselbe Spezifität (eine Klasse, ein Element) und treffen das Modul. Bei unveränderter Verlagerung hinter das Start-CSS könnte die Modulregel gewinnen. Zusätzlich existieren Responsive-/Touch-/Designregeln für dieses Modul in späteren Quellen. Selektoren und tatsächliche Modulklassen wurden geprüft; eine einzelne Unused-CSS-Aufnahme oder der Dateiname genügt nicht. Dies ist ein statisch belegtes Reihenfolgerisiko, kein behaupteter bereits beobachteter Browserfehler.

Eine sichere vollständige Übernahme der überschreibenden Regeln/Shared-Selektoren wurde innerhalb dieser einen Optimierung nicht nachgewiesen. Zusammen mit dem bereits roten unveränderten Gesamtbudget wird keine spekulative Änderung erstellt. Insbesondere keine globale @layer-Umstellung, kein !important-Workaround, keine Limitanhebung und keine Verlagerung gemeinsam genutzter Shell-/Skybar-/Tageskartenregeln.

## Ergebnis und Prüfgrenzen

**Keine CSS-/App-/Buildkonfiguration geändert, keine belegte Ersparnis, kein Vergleichsbuild.** Zusätzliche Modul-CSS-Bytes und Gesamtbudgetdelta sind folglich nicht gemessen. Keine CSS-Nachlade-/Layoutfehler im Browser untersucht und keine Beschleunigung behauptet. Keine Browsermatrix, Modul-/Kaskadenregression, vollständige Regression oder Lighthouse-Serie ausgeführt, da kein Split zur Abnahme vorliegt. Ein Ausgangsbuild verbraucht; kein Nachkorrekturzyklus und kein Ausführungsdienstfehler.

Der Draft transportiert ausschließlich dieses konkrete Blockergebnis und das unveränderte JSON des vorhandenen Budgetchecks sowie den Buildlog dauerhaft. Keine Versionsanhebung für reine Dokumentation. Vor einer nächsten CSS-Änderung muss die rote Baseline geklärt und für denselben Kandidaten eine überprüfbare Strategie zur Erhaltung der kanonischen Kaskade festgelegt werden. Kein anderer Optimierungsbereich, kein Merge, Release, Deployment oder Promotion.

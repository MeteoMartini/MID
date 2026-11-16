# MID Design 1.2 – CDP-CSS-Regelnutzung: Vollständigkeit und NoData

**Status:** isolierter QA-Draft, keine Produktänderung, kein Build, kein Release. Basis: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Stable `v0.9.85.483` vom 15.11.2026, fünf aktive Schutzrulesets. Die `.485` im Branch-Namen ist keine tatsächliche Releaseversion.

## Vorhandene Infrastruktur / Problem

MID verwendet bereits `scripts/lib/cssRuleUsageDiagnostic.mjs` mit Chromium `CSS.startRuleUsageTracking`/`CSS.stopRuleUsageTracking` in den bestehenden Browser-Fixtures. **Kein neues Tracking-System.** Bisher wurden von `CSS.getStyleSheetText` nicht lesbare, zuvor registrierte Stylesheets stillschweigend übersprungen; eine fehlende `ruleUsage`-Antwort wurde wie eine leere Antwort interpretiert. Auch ungültige, eventuell veraltete Zeichenoffsets wurden auf Quelllängen begrenzt. Dadurch kann die Quellenabdeckung unvollständig sein, ohne dass das im Bericht sichtbar wird.

## Änderungen

- Die bestehenden Felder `viewport`, `theme`, `scope`, `views`, `sheets` und `metrics` bleiben unverändert; rein additive `integrity`-Metadaten.
- `INCOMPLETE_EVIDENCE` bei unlesbaren Stylesheets, Regelverweisen auf unbekannte Stylesheet-IDs, ungültigen Offsets oder ohne auswertbares CSS. Fehlendes CDP-`ruleUsage`-Array ist ein harter Fehler.
- `TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL` heißt **nur**, dass in den in diesem Fall erfassten Sheets kein bekannter Erfassungsfehler vorliegt. `fullUiStateCoverageProven:false` und `cssRemovalAuthorized:false` bleiben immer gesetzt.
- UTF-16-Offsets werden gegen den Original-Quelltext validiert. Überlappende gültige Bereiche werden vereinigt; Bytes werden anschließend als UTF-8-Bytes gemessen. Ungültige Bereiche bleiben als Fehler gezählt und sind nicht als vollständige Messung zu interpretieren.
- Vierzehn synthetische Vitest-Fälle in `tests/unit/mid-css-rule-usage-integrity.test.ts`, darunter positive/negative Browser-Gate-Fälle sowie neue Nachweise für zwischenzeitlich entfernte oder geänderte Stylesheets; kein neuer `scripts/test-*.mjs`-Inventareintrag.

## Browser-QA-Fail-Closed-Integration

Die zwei bestehenden Chromium-Fixtures `scripts/verify-module-css-browser-0985170.mjs` und `scripts/verify-favorites-app-browser-0985242.mjs` erzeugen weiterhin die vollständigen Diagnoseberichte, rufen aber vor einem Case-PASS nun `assertCssRuleUsageComplete` auf. Bei fehlenden/inkonsistenten Stylesheet-Texte-/RuleUsage-Daten führt das zum roten Browser-Gate statt zu falsch vollständig wirkenden Roh-/Used-Bytes. Ein vollständiger gemessener Fall bleibt **nur diagnostisch**, nicht zur CSS-Löschung autorisiert. Die neuen Vitest-Fälle prüfen auch die Einbindung in beide Browser-Fixtures als Regression.

## Echte Chromium-Browserqualifikation (SHA-gebunden, unveröffentlicht)

Auf diesem QA-Branch wurde im bestehenden kanonischen und aktiven `unit-coverage.yml` ein streng auf `chatgpt/v0.9.85.485-css-cdp-integrity-qa` und Stable-Base-SHA beschränkter, read-only Browser-Pilot für die vorhandenen `module`- und `favorites`-Fixtures ergänzt. Pinned Checkout, unveränderter Stable-`.483`-Referenz-Checkout, Node 22, reale Chromium-Ausführung, getrennte Artefakte; kein Workflow-Dispatch oder Release-Gate, keine erweiterten Rechte. **Diese QA-spezifischen Workflowänderungen dürfen nicht unbesehen in Stable übernommen werden**; der Leitchat hat nach Prüfung nur die relevanten dauerhaft nützlichen Instrumentierungs-/Testdateien selektiv aufzunehmen.

Der erste echte Chromium-Versuch auf HEAD `1cd4a671eede200bf810df71e196b24397794d06` scheiterte absichtlich an unvollständiger CSS-Messung, bevor ein grüner Coverage-Bericht erzeugt werden konnte: Favoriten bei 320 px/Light 9 registrierte CSS-Sheets, davon 6 am Prüfzeitpunkt nicht mehr lesbar; Modul-Ansicht 320×568/Light 10 registriert, davon 3 nicht mehr lesbar. **0 unbekannte Sheet-IDs, 0 ungültige Offsets**. Es ist kein nachgewiesener MID-Produkt-/Layoutfehler, sondern eine echte Lücke bei der Beweissicherung kurzlebiger Stylesheets.

Deshalb wird der originale Text eines Sheets nun **beim offiziellen `CSS.styleSheetAdded`-Ereignis** gelesen und konservativ zwischengespeichert. Erst nach bestätigtem `CSS.styleSheetRemoved` darf bei späterem Abruffehler auf diese unveränderte Momentaufnahme zurückgegriffen werden; ohne nachweisbare Quelle bleibt `INCOMPLETE_EVIDENCE`. Ein Ereignis `CSS.styleSheetChanged` blockiert die Coverage-Autorisierung weiterhin, da ein einzelner Regeloffset nicht sicher beiden Quelltextversionen zugeordnet werden kann. Die neue Prüfung zählt gesicherte entfernte Sheets gesondert und lässt CSS-Löschung grundsätzlich unautorisiert.

Der erneute echte Chromium-Lauf und die 14 Vitest-Fälle sind am letzten Code-HEAD nachzuweisen. Die alten erfolgreichen Tests dürfen nicht auf einen neu geschriebenen Commit übertragen werden.

## Nachweise und offene Gates

Die sechs ursprünglichen Vitest-Testfälle bestanden am ersten GitHub-PR-HEAD `962e4c02646b630384a39c4dd1d89b3768b4c571` (GitHub Run `43755137454`, sechs Fälle). Für den **nun erneut erweiterten finalen PR-HEAD** sind die 14 Unit-Tests und die betroffenen Browser-Fixtures erneut auszuführen; die ursprüngliche Freigabe überträgt sich nicht. Unicode/Überlappung, unlesbare/fehlende Stylesheets, unbekannte IDs, Offset außerhalb des Originals, fehlerhafte CDP-Antwort und negativer Browser-Gate-Fall sind isoliert vertraglich abgesichert. Keine vollständige MID-Source-/Core-/Heavy-Regression, keine Vite-Produktionsbuild-/CSSOM-Browsermatrix, kein WebKit-/echtes iOS-/VoiceOver- oder Installer-/Worker-/Pages-Nachweis wurde mit diesem Draft erbracht.

Vor Übernahme im Leitchat: vollständiger Stable-/main-SHA-, PR-Pfad- und Ruleset-Abgleich, Änderung auf Konflikte prüfen; dann differenzierte Source-/Vitest-/Browser- und meteorologische Nichtregression. Die weitere CSS-Auslagerung setzt eigenständige CSSOM-/Layout-/Pixel-Parität für 320/390/430/834/1024/1440 CSS-Pixel, Light/Dark, Touch/Fokus, Cold-/Warmcache und reale iOS-Abnahme voraus.

## Referenzen

- https://chromedevtools.github.io/devtools-protocol/tot/CSS/
- https://v8.vite.dev/config/build-options – `cssCodeSplit` ist im MID-Vite-Build bereits aktiviert.
- Release-Train: https://github.com/MeteoMartini/MID/pull/828

**Freigabe:** Keine CSS-Löschung, keine Style-Order-Änderung, kein automatisches Merge/Deployment oder Stable-Promotion. Bewährter Pfad Source-PR-Gate → kontrollierter Merge → Release-ZIP → Installer → Worker/Pages → Stable bleibt verbindlich.

# MID Design 1.2 – CDP-CSS-Regelnutzung: Vollständigkeit und NoData

**Status:** isolierter QA-Draft, keine Produktänderung, kein Build, kein Release. Basis: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Stable `v0.9.85.483` vom 15.11.2026, fünf aktive Schutzrulesets. Die `.485` im Branch-Namen ist keine tatsächliche Releaseversion.

## Vorhandene Infrastruktur / Problem

MID verwendet bereits `scripts/lib/cssRuleUsageDiagnostic.mjs` mit Chromium `CSS.startRuleUsageTracking`/`CSS.stopRuleUsageTracking` in den bestehenden Browser-Fixtures. **Kein neues Tracking-System.** Bisher wurden von `CSS.getStyleSheetText` nicht lesbare, zuvor registrierte Stylesheets stillschweigend übersprungen; eine fehlende `ruleUsage`-Antwort wurde wie eine leere Antwort interpretiert. Auch ungültige, eventuell veraltete Zeichenoffsets wurden auf Quelllängen begrenzt. Dadurch kann die Quellenabdeckung unvollständig sein, ohne dass das im Bericht sichtbar wird.

## Änderungen

- Die bestehenden Felder `viewport`, `theme`, `scope`, `views`, `sheets` und `metrics` bleiben unverändert; rein additive `integrity`-Metadaten.
- `INCOMPLETE_EVIDENCE` bei unlesbaren Stylesheets, Regelverweisen auf unbekannte Stylesheet-IDs, ungültigen Offsets oder ohne auswertbares CSS. Fehlendes CDP-`ruleUsage`-Array ist ein harter Fehler.
- `TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL` heißt **nur**, dass in den in diesem Fall erfassten Sheets kein bekannter Erfassungsfehler vorliegt. `fullUiStateCoverageProven:false` und `cssRemovalAuthorized:false` bleiben immer gesetzt.
- UTF-16-Offsets werden gegen den Original-Quelltext validiert. Überlappende gültige Bereiche werden vereinigt; Bytes werden anschließend als UTF-8-Bytes gemessen. Ungültige Bereiche bleiben als Fehler gezählt und sind nicht als vollständige Messung zu interpretieren.
- Elf synthetische Vitest-Fälle in `tests/unit/mid-css-rule-usage-integrity.test.ts`, darunter fünf neue positive/negative Browser-Gate-Fälle; kein zusätzlicher `scripts/test-*.mjs`-Eintrag und keine Änderung der verpflichtenden Regressionsinventare.

## Browser-QA-Fail-Closed-Integration

Die zwei bestehenden Chromium-Fixtures `scripts/verify-module-css-browser-0985170.mjs` und `scripts/verify-favorites-app-browser-0985242.mjs` erzeugen weiterhin die vollständigen Diagnoseberichte, rufen aber vor einem Case-PASS nun `assertCssRuleUsageComplete` auf. Bei fehlenden/inkonsistenten Stylesheet-Texte-/RuleUsage-Daten führt das zum roten Browser-Gate statt zu falsch vollständig wirkenden Roh-/Used-Bytes. Ein vollständiger gemessener Fall bleibt **nur diagnostisch**, nicht zur CSS-Löschung autorisiert. Die neuen Vitest-Fälle prüfen auch die Einbindung in beide Browser-Fixtures als Regression.

## Nachweise und offene Gates

Die sechs ursprünglichen Vitest-Testfälle bestanden am ersten GitHub-PR-HEAD `962e4c02646b630384a39c4dd1d89b3768b4c571` (GitHub Run `43755137454`, sechs Fälle). Für den **erweiterten finalen PR-HEAD** sind die elf Unit-Tests und die betroffenen Browser-Fixtures erneut auszuführen; die ursprüngliche Freigabe überträgt sich nicht. Unicode/Überlappung, unlesbare/fehlende Stylesheets, unbekannte IDs, Offset außerhalb des Originals, fehlerhafte CDP-Antwort und negativer Browser-Gate-Fall sind isoliert vertraglich abgesichert. Keine vollständige MID-Source-/Core-/Heavy-Regression, keine Vite-Produktionsbuild-/CSSOM-Browsermatrix, kein WebKit-/echtes iOS-/VoiceOver- oder Installer-/Worker-/Pages-Nachweis wurde mit diesem Draft erbracht.

Vor Übernahme im Leitchat: vollständiger Stable-/main-SHA-, PR-Pfad- und Ruleset-Abgleich, Änderung auf Konflikte prüfen; dann differenzierte Source-/Vitest-/Browser- und meteorologische Nichtregression. Die weitere CSS-Auslagerung setzt eigenständige CSSOM-/Layout-/Pixel-Parität für 320/390/430/834/1024/1440 CSS-Pixel, Light/Dark, Touch/Fokus, Cold-/Warmcache und reale iOS-Abnahme voraus.

## Referenzen

- https://chromedevtools.github.io/devtools-protocol/tot/CSS/
- https://v8.vite.dev/config/build-options – `cssCodeSplit` ist im MID-Vite-Build bereits aktiviert.
- Release-Train: https://github.com/MeteoMartini/MID/pull/828

**Freigabe:** Keine CSS-Löschung, keine Style-Order-Änderung, kein automatisches Merge/Deployment oder Stable-Promotion. Bewährter Pfad Source-PR-Gate → kontrollierter Merge → Release-ZIP → Installer → Worker/Pages → Stable bleibt verbindlich.

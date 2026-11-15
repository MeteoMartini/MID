# MID Design 1.2 – CDP-CSS-Regelnutzung: Vollständigkeit und NoData

**Status:** isolierter QA-Draft, keine Produktänderung, kein Build, kein Release. Basis: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Stable `v0.9.85.483` vom 15.11.2026, fünf aktive Schutzrulesets. Die `.485` im Branch-Namen ist keine tatsächliche Releaseversion.

## Vorhandene Infrastruktur / Problem

MID verwendet bereits `scripts/lib/cssRuleUsageDiagnostic.mjs` mit Chromium `CSS.startRuleUsageTracking`/`CSS.stopRuleUsageTracking` in den bestehenden Browser-Fixtures. **Kein neues Tracking-System.** Bisher wurden von `CSS.getStyleSheetText` nicht lesbare, zuvor registrierte Stylesheets stillschweigend übersprungen; eine fehlende `ruleUsage`-Antwort wurde wie eine leere Antwort interpretiert. Auch ungültige, eventuell veraltete Zeichenoffsets wurden auf Quelllängen begrenzt. Dadurch kann die Quellenabdeckung unvollständig sein, ohne dass das im Bericht sichtbar wird.

## Änderungen

- Die bestehenden Felder `viewport`, `theme`, `scope`, `views`, `sheets` und `metrics` bleiben unverändert; rein additive `integrity`-Metadaten.
- `INCOMPLETE_EVIDENCE` bei unlesbaren Stylesheets, Regelverweisen auf unbekannte Stylesheet-IDs, ungültigen Offsets oder ohne auswertbares CSS. Fehlendes CDP-`ruleUsage`-Array ist ein harter Fehler.
- `TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL` heißt **nur**, dass in den in diesem Fall erfassten Sheets kein bekannter Erfassungsfehler vorliegt. `fullUiStateCoverageProven:false` und `cssRemovalAuthorized:false` bleiben immer gesetzt.
- UTF-16-Offsets werden gegen den Original-Quelltext validiert. Überlappende gültige Bereiche werden vereinigt; Bytes werden anschließend als UTF-8-Bytes gemessen. Ungültige Bereiche bleiben als Fehler gezählt und sind nicht als vollständige Messung zu interpretieren.
- Sechs synthetische Vitest-Fälle in `tests/unit/mid-css-rule-usage-integrity.test.ts`; kein zusätzlicher `scripts/test-*.mjs`-Eintrag und keine Änderung der verpflichtenden Regressionsinventare.

## Nachweise und offene Gates

Isolierte Node-22-Testfälle wurden lokal bestanden: Unicode/Überlappung, unlesbare und fehlende Stylesheets, unbekannte IDs, Offset außerhalb des Originals und fehlende CDP-Antwort. Der neue Vitest-Test muss noch **auf dem exakten GitHub-Kandidaten-HEAD** laufen. Keine vollständige MID-Source-/Core-/Heavy-Regression, keine Vite-Produktionsbuild-/CSSOM-Browsermatrix, kein WebKit-/echtes iOS-/VoiceOver- oder Installer-/Worker-/Pages-Nachweis wurde mit diesem Draft erbracht.

Vor Übernahme im Leitchat: vollständiger Stable-/main-SHA-, PR-Pfad- und Ruleset-Abgleich, Änderung auf Konflikte prüfen; dann differenzierte Source-/Vitest-/Browser- und meteorologische Nichtregression. Die weitere CSS-Auslagerung setzt eigenständige CSSOM-/Layout-/Pixel-Parität für 320/390/430/834/1024/1440 CSS-Pixel, Light/Dark, Touch/Fokus, Cold-/Warmcache und reale iOS-Abnahme voraus.

## Referenzen

- https://chromedevtools.github.io/devtools-protocol/tot/CSS/
- https://v8.vite.dev/config/build-options – `cssCodeSplit` ist im MID-Vite-Build bereits aktiviert.
- Release-Train: https://github.com/MeteoMartini/MID/pull/828

**Freigabe:** Keine CSS-Löschung, keine Style-Order-Änderung, kein automatisches Merge/Deployment oder Stable-Promotion. Bewährter Pfad Source-PR-Gate → kontrollierter Merge → Release-ZIP → Installer → Worker/Pages → Stable bleibt verbindlich.

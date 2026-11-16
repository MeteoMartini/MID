# MID Design 1.4 · 14-Tage-Prognose: vollständiger Wettertext und kompakte Lesbarkeit

**Datum:** 16.11.2026 · **Status:** Design-QA-Draft, KEIN RELEASE, keine Änderungen an meteorologischen Daten/Warnings/Modellen/Worker/PWA/Release-Workflows.

## Verifizierte Provenienz
- Ausgangsquelle: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Version `0.9.85.483` in `package.json`, `MID_BASELINE.json` und `contracts/index.json`. Fünf aktive Repository-Rulesets.
- Ursprünglicher CSS-Git-Blob: `4ec577beee5e4b6be59f913c57d810f3c5143ec9`; der neue CSS-Blob ist `d9197fc365a03ffff2c8e03b337e76907a7006b9`.
- Der Leitchat-Sammel-Draft #833 (beim Live-Vergleich HEAD `708680ebaf2509557f7921e7620a2189b9ac9059`) bearbeitet diese CSS-Datei nicht. Der CSS-Ownership-QA-Draft #840 analysiert sie nur lesend; keine Übernahme/Aufweichung seiner Cross-Module-Sperre.
- Kein produktiver Build, kein Installer, kein Stable-Promotion oder QA-Gate-Bypass aus diesem Branch.

## Reproduzierbarer Ausgangsbefund
- `src/midC18FourteenReplitFluidGrid.css` verwendet für `.cockpit-fourteen-weather-label` `white-space:nowrap`, `overflow:hidden` und `text-overflow:ellipsis`. Bei langen Wettertexten können im kompakten Cockpit inhaltlich relevante Wörter abgeschnitten werden. Das widerspricht dem Ziel aus `MID_UI_ARCHITECTURE_CONTRACT.md` §7.
- Elf CSS-`font-size`-Deklarationen lagen unter 10,5px (kleinster Rohwert 7,5px), überwiegend in kompakten Niederschlags-/UVI-/Metadaten und den mobilen Overrides. **Nicht jede Rohdeklaration ist die tatsächlich gerenderte Schriftgröße:** die spätere `.cockpit-fourteen-compact-meta`-Regel überschreibt einige mit höherer/gleicher Spezifität. Kein WCAG-Fehlschlag wird daraus allein abgeleitet.

## Minimaler QA-Kandidat
1. Basis-Wetterlabel bricht Wörter ggf. um (`white-space:normal`, `overflow-wrap:anywhere`) statt sie zu ellipsieren; `overflow:visible`, `text-overflow:clip` und mobile Schrift mindestens 11px. Keine zusätzlichen Tooltips/Controls; die vollständige Originalbeschreibung bleibt sichtbar.
2. Elf nominelle Unter-10,5px-Deklarationen auf 10,5px angehoben. `font-size`-Vorgaben darüber, Meta-Raster, semantische Wetterfarben, 44px-Berg-Touchflächen, Navigation und Safe-Area-Regeln unverändert.
3. Voraussichtliche Quell-CSS-Rohdifferenz **+46 Byte** (kein Produktionsbundle- oder gzip-Nachweis); keine Behauptung, dass die Änderung die initiale Ladezeit verbessert.
4. Neuer Vitest `tests/unit/mid-fourteen-readable-forecast-css.test.ts`: Font-Untergrenze, Wetterlabel-Regeln und Erhalt der Shared-Navigation-/Mountain-Anker.

## Gate- und Akzeptanzgrenzen
- **Vor Integration obligatorisch:** realer Vite-Build mit CSS-/JS-Budget, geprüfte Asset-/Version-Fingerprints und alle etablierten Source-/Core-/Heavy-/Security-/Review-Gates. Ein Browser-Screenshot der 14-Tage-Zeile im Live-Layout ist noch nicht erbracht; die statische Regression ist **keine** visuelle Abnahme.
- **Responsive-Matrix:** mindestens 320/390/430/834/1024/1440 CSS-px, Portrait/Landscape wo sinnvoll; Light/Dark, hohe Kontraste, 200%-Textzoom, lange deutschsprachige Wetterbeschreibung, sehr lange Ortsnamen, Scroll/Overflow, Touch/Fokus/Inline-Details. Werte dürfen nicht übereinander stehen oder horizontal aus dem Viewport ragen.
- **Native-Grenzen:** Browser-/Chromium-Emulation beweist weder echte iOS-WebKit-Gesten noch VoiceOver.
- **Integration:** aktueller Stable/LC-HEAD, geänderte Pfade und CSS-BLOB-SHA erneut vergleichen. Nur QA-gesicherte selektive Übernahme; #840-Eigentümeranalyse als unabhängige Schutzbedingung erhalten, nicht blind CSS auslagern. Kein PR-Ready, kein Merge und kein Release aus diesem Spezialchat.

## Technische Referenzen
- MID UI-Architekturvertrag §7 (keine inhaltsverlustige Ellipsis): `MID_UI_ARCHITECTURE_CONTRACT.md`
- Vite CSS-Chunks und Preloads: https://vite.dev/guide/features
- CSS-Kaskade/Spezifität: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ (kein numerischer allgemeiner CSS-Font-Mindestwert behauptet)

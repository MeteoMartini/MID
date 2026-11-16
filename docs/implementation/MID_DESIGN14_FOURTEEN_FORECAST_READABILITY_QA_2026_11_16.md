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

## QA-Iteration nach erster CI (exakte GitHub-Evidenz)
- Erster Draft-HEAD `6579c7fba36754f70529b2c0eaa1e056e4763980`: [Run 43831597827](https://github.com/MeteoMartini/MID/actions/runs/43831597827) **FAIL**. Gezielter Job erwartete aus dem historischen 14-Tage-Vertrag wörtlich `10px` / `9.5px` für Sonne/UVI; Vitest erkannte zusätzlich den fehlenden synchronisierten `src/midPresentation.css`-Aggregatstand. Keiner dieser Fehler wurde übergangen oder ein Test entfernt.
- Korrektur 1: Generiertes `src/midPresentation.css` aus verifiziertem Basisblob `a22efbecf86a9043dc8be77472d580fd776e43ae` durch **genau einen**, byteverifizierten Austausch des vollständigen 12.823-Byte-Original-CSS-Quellblocks mit dem neuen 12.869-Byte-Block aktualisiert. Ergebnisblob `3b283957ae1ad643641d6a66995281370e760a9f`; der Generator-/68-Quellen-Kanon muss die Parität in CI noch bestätigen. Kein unabhängiger JS-/CSS-Produktionsbuild durch diesen Schritt.
- Korrektur 2: Bestehender `scripts/test-fourteen-day-replit-fluid-grid-098593.mjs` auf die **bewusst geänderten** Sonne/UVI-Schriftwerte aktualisiert und um positive Prüfung des Wettertextumbruchs ergänzt; übrige historische Assertions unverändert. **Keine** Testabschaltung, Budgetanhebung, Regel- oder Releaseänderung.
- Diese Iteration ändert zusammen exakt fünf langlebige Pfade: Ausgangs-CSS, generiertes Aggregat, bestehende 14-Tage-Regression, neuer Vitest, Dokumentation. Der alte rote HEAD darf **nicht** als erfolgreich ausgegeben werden. Aktuelle CI gilt ausschließlich für ihren jeweils genannten HEAD.

## Zweiter Gate-Durchlauf und unveränderte Golden-Regressionsbasis
- HEAD `3fa7af896980e6e902b1b03e352b172413389c7e`, [Run 43832178010](https://github.com/MeteoMartini/MID/actions/runs/43832178010): **FAIL** mit zwei identifizierten, voneinander unabhängigen Ursachen. Der neue Vitest interpretierte in seinem Regex `\\.` statt `\.` und zählte dadurch nur fünf Ganzzahl-`font-size`-Deklarationen; die tatsächliche CSS-Quelle enthält 22 Größenangaben. Der eigenständige historische `.169`-Cascade-Goldenfingerprint musste die bewusste Design-1.4-Quelländerung ausschließlich in seiner Vergleichskopie berücksichtigen. Der andere Vitest `pollen-css-split-qa.test.ts` meldete inzwischen bereits die aktuelle 68/68-Generatorkonsistenz als **PASS**; die generierte Quellparität ist damit für diesen SHA nachgewiesen.
- Reparaturen: Regex im Vitest auf echten Dezimalpunkt korrigiert; `scripts/test-module-css-consolidation-0985170.mjs` verifiziert die beiden vollständigen Git-Blobs (neues 14d-CSS `d9197fc365a03ffff2c8e03b337e76907a7006b9`, altes Stable-CSS `4ec577beee5e4b6be59f913c57d810f3c5143ec9`), stellt die 22 historischen Schriftdeklarationen und ausschließlich den vormals abgeschnittenen Wetterlabel-Block **nur innerhalb des historischen Vergleichs-AST** wieder her. Der fest eingefrorene `.169`-Fingerprint und der verpflichtende aktuelle 68-Quellen-zu-Aggregat-Vergleich bleiben unverändert und aktiv. Die inverse Rekonstruktion wurde vor dem Commit bytegenau gegen das originale Stable-CSS verglichen.
- Sechs langlebige Pfade verändert: `src/midC18FourteenReplitFluidGrid.css`, `src/midPresentation.css`, beide bestehenden Regressionsskripte, neue Vitest-Datei, Dokumentation. **Nicht** enthalten: Release-Workflows, Versionsspiegel, Worker, Kartenmeteorologie, Warnungen. Nachkorrektur-HEAD vor neuem CI-Readback noch ungeprüft.

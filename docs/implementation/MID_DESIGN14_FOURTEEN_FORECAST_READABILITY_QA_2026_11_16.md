# MID Design 1.4 — Stable-.484-Fortführung (aktuelle Vorqualifikation)

**Source of Truth (16.11.2026):** main=mid-stable=8f4c950c3d0311f33ed3f9b89d0101d6cd556113; veröffentlichte Version v0.9.85.484. Der neue autorisierte chatgpt/v0.9.85.485-design14-stable484-Branch wurde genau von diesem Commit erstellt; acht Git-Blobs aus dem gesicherten Design-PR #841 HEAD d327e6154dc26d696c74379f6dec994ccf57631b wurden SHA-identisch als ein Fast-Forward-Commit übernommen. Zwischen .483 und .484 wurden keine dieser acht Dateien geändert. Frühere Abschnitte beschreiben den historischen .483-Entwicklungsstand, nicht den nun publizierten Stable.

**Gesicherter Vorbefund (älterer Kandidat):** 390 CSS px mit künstlich nur für das Wetterlabel verdoppelter Schrift (11 auf 22 CSS px): 346,34 statt 510,84 px Kartenhöhe und 8 statt 15 Textfragmente, gesamter Langtext sichtbar, kein Horizontaloverflow. 24 Chromium-Kontexte und 258 Vitest-Einzeltests wurden am ALTEN QA-HEAD bestanden; sie gelten nicht automatisch für die neue .484-Basis.

**Neue QA-Matrix (noch nicht erfolgreich belegt):** 16 bisherige FourteenDayHorizon-Kontexte plus 16 ForecastCockpit-Kontexte bei 320/390/393/402/414/430/834/1440 px jeweils Light/Dark. Neu bei 393/402/414/430 px: voller Wettertext, berechneter 22-px-Textstress, kein horizontales Overflow, maximal 12 Textfragmente und 450 px Kartenhöhe. Keine Testlockerung bei rotem Befund. Der Textstress ist kein nativer Browserzoom, iOS-WebKit- oder VoiceOver-Nachweis.

**Releasegrenzen:** DRAFT ONLY, NO READY / NO MERGE / NO DEPLOY / NO RELEASE; unabhängige Source-/Core-/Heavy-/Security-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates bleiben notwendig. Issue #740 bleibt offen; Cross-Owner-Guard PR #840 beibehalten; kein gefährlicher CSS-Lazy-Move.

---
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

## Design 1.4 / Stable .484: 32er-Chromium-Qualifikation erfolgreich

**Provenienz:** Verifizierte veröffentlichte Basis main=mid-stable `8f4c950c3d0311f33ed3f9b89d0101d6cd556113` (`v0.9.85.484`). QA-Branch `chatgpt/v0.9.85.485-design14-stable484`, geprüfter Implementierungs-HEAD `98d75393ca1d2cd3debc3b0abdced9578011b129`. Neuer Draft [#844](https://github.com/MeteoMartini/MID/pull/844) ersetzt zur Integrationsprüfung den alten .483-basierten Design-Draft #841, der als SHA-Nachweis unberührt bleibt.

**Neue Ursache / minimale Layoutkorrektur:** Der erste Test des .484-basierten Drafts zeigte bei 393 CSS px noch eine 510,84px hohe Karte und 15 Textfragmente, obwohl 390px bereits 346,34px / 8 Fragmente erreichte. Exakt der Cutoff `@media(max-width:390px)` der 14-Tage-Header-Reflow-Regel war dafür verantwortlich. Nur diese spezifische Layoutregel wurde auf `@media(max-width:430px)` erweitert; die getrennten Wettermetadaten-Regeln bei max-width:390px, Navigation, Berg-Touchziele, meteorologische Semantik, Warnungen, Quellen, Modelle und Releasepfade bleiben unverändert. Die vollständige `src/midPresentation.css`-Kaskade wurde durch einen einzigen SHA-geprüften 14-Tage-CSS-Blockersatz synchronisiert; der etablierte historisch unveränderte `.169`-Golden-/Source-Ownership-Test rekonstruierte die originalen 12.823 CSS-Bytes und 22 historischen Schriftwerte bytegenau und bestand.

**Ausgeführte echte Chromium-Matrix:** [Actions Run #43864065773](https://github.com/MeteoMartini/MID/actions/runs/43864065773) auf `98d75393ca1d2cd3debc3b0abdced9578011b129`: alle **32/32 Kontexte PASS** — 16 FourteenDayHorizon-Kontexte bei 320/360/375/390/430/834/1024/1440 px × Light/Dark sowie 16 vollständige ForecastCockpit-Container-Kontexte bei 320/390/393/402/414/430/834/1440 px × Light/Dark. Echte React-Komponenten und kanonisches CSS; deterministische synthetische Wetterdaten. Echtes HTML-Details, Enter-/Space-Interaktion, Computed-Font ≥22px, vollständige Wetteraussage, kein vertikales Label-Clipping oder horizontales Dokument-Overflow in den getesteten Konstellationen.

**Messwerte bei synthetisch vergrößerter Wetterbeschreibung (Computed Font = 22px, Light):** 320px Viewport → 418,41px Höhe / 10 Fragmente; 390px → 346,34px / 8; 393px → **318,84px / 7** (vorher 510,84px / 15; Verbesserung ca. 37,6% der Kartenhöhe); 402px → 318,84px / 7; 414px → 318,84px / 7; 430px → **291,34px / 6**; 834px → 214,66px / 4; 1440px → 143,28px / 2. **Alle 8/8** Light-Fälle ohne horizontales Overflow; entsprechende Dark-Fälle ebenfalls 8/8 PASS. Bei normaler 11px-Schrift ergibt die 393–430px-Karte nun 195,09px Höhe; diese geringfügig höhere normale Karte ist der bewusst begründete Responsive-Kompromiss.

**GitHub-Tests:** Exakter Run #43864065773 — **Vitest 5 + V8 Coverage SUCCESS: 54 Testdateien bestanden, 1 übersprungen; 346 Einzeltests bestanden, 3 übersprungen.** Separater Job `MID Draft · gezielte Regressionen`: **SUCCESS**. Die optionalen Mountain-CSS-Originalvergleich-, unabhängigen CSS/JS-Diagnosebuild- und 20-Zyklen-Post-GC-Draft-Jobs waren **SKIPPED**, nicht grün. Bilder und alle 32 JSON-Messprotokolle im [Actions-Artefakt #14224069116](https://github.com/MeteoMartini/MID/actions/runs/43864065773/artifacts/14224069116), das unabhängig ausgelesen wurde; Screenshots 393px Light und 430px Dark visuell kontrolliert.

**Offene Grenzen:** Browser-Test isoliert reale ForecastCockpit-Komponenten, aber kein kompletter produktiver App.tsx-Bootstrap, keine echte WebKit-/Safari-/iOS-/VoiceOver-/Dynamic-Type-/200%-native-Browser-Zoom-Abnahme. Der Textstresstest erzwingt nur für die Wetterbeschreibung 22px. Daher **kein WCAG-2.2-AA-Konformitätsnachweis**, sondern belastbare Teilqualifikation. Vollständige MID Source-/Core-/Heavy-/Security-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates bleiben verpflichtend; Issue #740 gehört zum Release-Kontext. Bis dahin **DRAFT / NO READY / NO MERGE / NO DEPLOY / NO RELEASE**.


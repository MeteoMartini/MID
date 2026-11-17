# MID Design 1.9 – Reflow, Originaltext und Touchziel-Evidenz

Datum: 17.11.2026. Status: **QA DRAFT – NO READY / NO MERGE / NO RELEASE**.

## Provenienz und Parallelabgleich

Vor Arbeit verifiziert: main = mid-stable = a78465b655d25cafc9ecc0390080694cb7aca957 (v0.9.85.486 in package.json, MID_BASELINE.json und contracts/index.json), fünf aktive Rulesets; AGENTS.md, MID_SOURCE_OF_TRUTH.md, Cross-Platform- und Parameterfarbenvertrag geprüft. Bestehender Leitchat-Sammeldraft #868 hatte HEAD 3fa9980bd0b271345dbb49cd2d4cce0b4b54ba1e und führt bereits Design17/18/19-HTTP/CSSOM-QA; #873/#875 wurden dort integriert. #344/#523 bleiben offen. Drei neue disjunkte QA-/Dokumentationsdateien, keine Produktions-, Worker-, Version-, Release- oder Governance-Datei geändert.

## Fachliche Lücke

Gleiche berechnete CSS-Styles und Originalbytes beweisen nicht die vollständige Lesbarkeit langer meteorologischer Texte oder die Erreichbarkeit kritischer 44px-Touchziele. Die Design14-QA misst isolierte Forecast-Komponenten und keine vollständig identische SHA-gebundene Stable/Kandidat-Produktionsseite. Der hier ergänzte lesende Nachweis umfasst nur explizit ausgewählte sichtbare Targets, nicht das gesamte Produkt.

## Umsetzung

Die neue Datei scripts/lib/design19ReflowEvidence.mjs enthält captureDesign19ReflowCase, validateDesign19ReflowCase, inspectDesign19ReflowCase, compareDesign19ReflowCases. Original-Playwright-Page muss von einem extern separat verifizierten, sandboxed Browserrunner stammen. Das Modul startet keinen Browser, installiert nichts und führt keine Netzwerkanfrage aus.

Es wartet auf den originalen Ready-Selektor, document.fonts.ready und zwei Animation Frames. Es prüft Dokumentoverflow, gemessene Textfragmente mit Range.getClientRects(), Ellipsis, horizontale/vertikale Textkappung und Clip-Vorfahren.

**Nachgehärtet:** Ein kompletter Range über einem Container kann Rects liefern, obwohl einzelne darin enthaltene Originaltextknoten per CSS `display:none`, `visibility:hidden` oder `opacity:0` verborgen sind. Der neue Textknoten-Zensus prüft deshalb pro selektiertem Textziel alle nichtleeren `Text`-Leaves mit eigenem `Range.getClientRects()` und den berechneten Sichtbarkeitswerten der Vorfahren. Die Zahl ist auf 256 begrenzt; Überschreitung/fehlende Evidenz bricht die QA ab. `hiddenTextNodeCount>0` erzeugt ausdrücklich den Befund `hidden-original-text-nodes`, selbst wenn der Text-Hash unverändert ist. Zusätzliche Negativtests prüfen versteckte Teiltexte, identische Hashes trotz Sichtbarkeitsverlust, fehlende und übergroße Zensuszahlen. Die Zensusprüfung ist ausschließlich QA und fügt keine Laufzeitkosten im Produkt hinzu. CSS-Clip-Path, Canvas-/GPU-Pixel, Screenreader-Ausgabe oder spätere DOM-Mutationen sind dadurch **nicht** vollständig nachgewiesen. Texte werden im Bericht **nicht gespeichert**, sondern per SHA-256 und Textlänge repräsentiert. Kritische Touchziele werden auf mindestens 44px und elementFromPoint-Treffbarkeit gemessen. Das ist kein echter Pointer-/First-Tap-/VoiceOver-E2E-Beweis.

A/B verlangt exakt identische Browser-Version, Fixture-SHA, Theme, Viewport, Stressmodus und Target-Liste, während Source-SHAs verschieden sein müssen. Wettertext-Digest-Drift bleibt sichtbar. Für alle Ausgaben bleiben Release-, WCAG-, Browser- und Performance-Freigabe ausdrücklich **false**. Die neue Vitest-Datei enthält negative Fälle für fehlende Texte, Overflow, Ellipsis, verdeckte Touchziele, Build-/Theme-Drift und datensparsame Erfassung.

## Integration und offene Gates

Leitchat soll nach unabhängigem Blob-/CI-/Overlap-Readback selektiv integrieren, ohne Design18/19-HTTP/CSSOM-Funktionen zu duplizieren. Erst den vorhandenen Original-HTML/CSS/JS- und Provider-SHA-Gates vertrauen, anschließend an derselben echten Browserpage die Reflow-Ziele erfassen. Matrix: 320/390/430/834/1024/1440px, Light/Dark, Wetter-Langtexte, Favoriten/Navigation, 14 Tage. Der deklarierte synthetische 200%-Root-Font-Stresstest ist **kein** nativer 200%-Zoom-/Dynamic-Type-Beleg. Karten, Diagramme und Datentabellen können nach WCAG 1.4.10 begründete zweidimensionale Scrolling-Ausnahmen bilden.

Vor einer CSS-Änderung zusätzlich echte Browser-/Pixel-/20-Zyklen-/Performance-A/B-Tests und alle Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Gates. WebKit, physische iOS-Geräte und VoiceOver gesondert. Issue #740/#839 bleibt Release-Spezialarbeit.

Quellen: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html ;
https://playwright.dev/docs/test-snapshots ;
https://web.dev/articles/css-web-vitals .

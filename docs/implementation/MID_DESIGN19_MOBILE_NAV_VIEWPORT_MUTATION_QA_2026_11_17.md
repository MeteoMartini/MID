# MID Design 1.9 — appweite Bottom-Navigation: iOS VisualViewport ohne Style-Thrashing

**17.11.2026 · SOURCE-QA DRAFT; NO READY / NO MERGE / NO RELEASE**

## SHA-Provenienz und Ownership

- Ausgangsbasis: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte `v0.9.85.486`; drei Versionsspiegel synchron, fünf aktive GitHub-Rulesets.
- `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md`, bestehender `scripts/test-bottom-navigation-anchor-c56.mjs` und relevante parallele PRs gelesen.
- Leitchat-Draft #868 hatte beim letzten vor-Schreib-Abgleich HEAD `dd9a9cc6eaca641785b095bf79862a4b1ba051cd`. Seine 213 geänderten Pfade enthalten **nicht** `src/useBottomNavigationAnchor.ts` oder dessen C56-Test. Keine Karten-, CSS-, WMO-/DWD-, Daten-, Warn-, Worker-, Governance- oder Release-Änderungen.

## Originaler, überprüfbarer Quellbefund

Der bisherige `useBottomNavigationAnchor` ruft auf jedem `visualViewport`-Scroll-/Resize-Event (rAF-gedrosselt) zuerst `restore()` auf und setzt damit das **vollständige beim Mount gespeicherte** HTML-`style`-Attribut zurück. Bei offener Softwaretastatur wird anschließend `bottom` erneut mit `!important` geschrieben. Auch unveränderte Viewport-Geometrie verursacht dadurch DOM- und Style-Mutationen; fremde Inline-Anpassungen seit Mount können überschrieben werden. Dies ist zunächst ein aus Originalquelltext begründeter Mechanismus, keine behauptete reale WebKit-FPS-Messung.

## Umsetzung

- Unveränderte fachliche Berechnung: Nur iOS/iPadOS (einschließlich Desktop-UA iPad), nur schmaler Breakpoint bis 850 CSS-Pixel; ausschließlich bei `Math.abs(visualViewport.scale-1)<0.01`. Der vorhandene Inset-Ausdruck `Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)` und der berechnete kanonische CSS-Bottom-Gap bleiben gleich.
- Die Aktualisierung besitzt einen kompakten Schlüssel aus Breakpoint, innerWidth, innerHeight und tatsächlichem Inset. Identische Geometrie löst **keine** erneute Style-Mutation oder `getComputedStyle`-Messung aus. Neue echte Tastatur-/Orientierungsgeometrie wird weiter korrekt verarbeitet.
- Der Hook verwaltet nur die `bottom`-Inline-Eigenschaft, einschließlich Originalwert und `!important`-Priorität. Fremde Inline-Eigenschaften (z. B. aktuell von React oder einem Dialog dynamisch gesetzte Farbe) bleiben bei Tastaturwechsel und Cleanup erhalten. Ein ursprünglich fehlendes, nun vollständig leeres `style`-Attribut wird entfernt.
- Keine neuen Listener, Poller, Observer, Netzwerkanfragen, CSS-Regeln, Startscripte, Abhängigkeiten, Pakete oder Datenberechnungen; bestehende rAF-Coalescing-/Unmount-Regeln bleiben erhalten.
- Bei fehlendem `visualViewport`, Pinchzoom, größerem Breakpoint und normaler Tastaturrückkehr bleibt die feste CSS-Verankerung maßgeblich. Kein absolutes `scrollY`-Repositionieren.
- Performance ist **architektonisch** begründet durch entfallende DOM-Writes bei geometrisch identischen Scroll-Ereignissen, nicht durch einen bereits gemessenen FCP/INP/FPS-Gewinn.

## Tests und Freigabegrenzen

- Historischer C56-Originaltest **verschärft, nicht abgeschaltet**: Deep Scroll, normaler Fixed-Zustand, 12/20 wiederholte VisualViewport-Events, Softwaretastatur 844→400→390→844, veränderte Einblendhöhe, Pinchzoom scale=2, Breakpointwechsel, Cleanup, externe Inline-Änderungen während der Tastatur, ursprünglicher `bottom:22px!important` und exakte Wiederherstellung werden gegen durch `esbuild` transpilierten **realen Hook-Quelltext** simuliert. Keine `setTimeout`-/Layout-Messungsschätzung.
- Zusätzlicher Vitest-Gate ruft denselben strengeren C56-Test auf und meldet nur den tatsächlich ausführbaren Test als PASS. Er ist kein Browser-/WebKit-/physisches-iPhone-/VoiceOver-Test; kein WCAG-2.2-AA-Konformitätsclaim.
- Für reale Abnahme erforderlich: vorhandener echter Navigation-Render mit 320/390/430/834/1024/1440 CSS-Pixeln (Hoch/Quer, Light/Dark), Scroll tief im Dokument, Tastatur schnell öffnen/schließen, Safari-/WKWebView-Safe-Area, visuelle BoundingRects und echte Touch-/Fokusbedienung; vor und nach 20 Scroll-/Tastaturzyklen messen. iPhone-Hardware separat.
- Alle Source-/Core-/Heavy-/Security-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates bleiben erst auf finalem Leitchat-SHA abzunehmen. Noch keine Versionsspiegel-/Releaseänderung, da kein tatsächlicher Releasebuild ausgeführt. Produktive Nutzung nur nach kontrollierter Leitchat-Integration.

## Externe Referenzen

- MDN VisualViewport: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- Apple Developer Forums iOS-26-Viewport-Keyboard: https://developer.apple.com/forums/thread/800125
- WebKit Bug 297779 (fixed UI/Scroll): https://bugs.webkit.org/show_bug.cgi?id=297779

Die WebKit-Bugs begründen Geräte-QA und ein vorsichtiges Kompensationsverhalten; sie beweisen keinen selbst erhobenen MID-iPhone-Befund.

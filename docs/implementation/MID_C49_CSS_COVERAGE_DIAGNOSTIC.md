# MID 18.2.49 – CSS-Regelnutzung: read-only Diagnose

- Basis: veröffentlichte v0.9.85.326, `mid-stable`/`main` `f32e100842e434909f2fcd2154a885b2a3b36f56`.
- Ausschließlich `scripts/verify-module-css-browser-0985170.mjs` instrumentiert: vorhandene Chromium-Browserregression in 14 voneinander isolierten Viewport-/Theme-Kontexten. Kein neuer Dienst und keine Dependency.
- Chromium-CDP `CSS.startRuleUsageTracking` beginnt vor der Fixture-Navigation; `CSS.stopRuleUsageTracking` sammelt nach Widget (Karten/Kurve/Ensemble) und Bergwetter die tatsächlich verwendeten Regel-Offsets. Überlappende Intervalle werden vor der Bytezählung vereinigt. Ergänzend `Performance.getMetrics`.
- JSON-Diagnose: `artifacts/css-module-coverage.json` (gitignoriert). Kurzwerte stehen im CI-Log und in der Job-Zusammenfassung.
- **Grenze:** Vite-Entwicklungsfixture, **keine** produktive CSS-Coverage. Größen über die 14 Browser-Kontexte hinweg sind mehrfach gezählte Fall-Summen. Hieraus darf kein CSS-Split, kein Performancegewinn und keine vollständige Ansichtsabdeckung behauptet werden.
- Unverändert: CSS-Quellreihenfolge, Kaskadenvertrag, Themes, Widget-/Export-Meteorologie, Worker, iOS, Dependencies und Release-Konfiguration.
- Nächste Gate-Stufe vor CSS-Auslagerung: gemessene vollständige Produktions-Ansichts-/Theme-/Viewport-Matrix einschließlich High Contrast, Ort/Favoriten/Overlays, Cold-/Warmcache, URL-/PNG-/Widget-Parität und Safari/WKWebView separat.
- Diagnose-Draft. Kein neuer MID-Anwendungsbuild, daher kein Versionsbump, kein Release.

## Statischer CSS-Querschnitt der SHA-gebundenen Stable-Basis (.326)

Dies ist ein **rein lesender Regex-Klassenvergleich**, keine Browser-Coverage, kein gzip-Wert und kein Beleg für Laufzeitgewinn oder Kaskadenparität:

- `src/styles-src/25-extreme-outlook.css`: 23.956 Zeichen und 49 unterschiedliche CSS-Klassen-Tokens.
- `src/styles-src/30-modern.css`: 593.073 Zeichen und 1.348 unterschiedliche CSS-Klassen-Tokens.
- Von den Extremwetter-Klassen-Tokens erscheinen 11 ebenfalls in `30-modern.css`. Darunter sechs `extreme-`-Klassen: `extreme-outlook-panel`, `extreme-hazard-tabs`, `extreme-period-tabs`, `extreme-map`, `extreme-map-legend`, `extreme-region-list`. Die übrigen fünf sind generische bzw. gemeinsam genutzte Tokens.
- `src/midC18WarningTimeline.css`: 16.786 Zeichen und 30 Klassen-Tokens; `src/midC28MapPhase.css`: 3.067 Zeichen und drei Klassen-Tokens. Kleinere Dateigröße ist keine Freigabe für einen separaten CSS-Chunk.

Die spätere CSS-Kaskade von Extremwetter-Styles überschreibt nachweislich auch eigens benannte Selektoren. Nur echte DOM-/CSS-Regelnutzungsmessung, computed-style- und Pixel-Parität über Ansichten, Light/Dark/High Contrast, Widgets und Exporte kann die anschließende verzögerte Ladung rechtfertigen. Vorher keine produktive Auslagerung.

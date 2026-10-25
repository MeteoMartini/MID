# MID 18.2.49 – CSS-Regelnutzung: read-only Diagnose

- Basis: veröffentlichte v0.9.85.326, `mid-stable`/`main` `f32e100842e434909f2fcd2154a885b2a3b36f56`.
- Ausschließlich `scripts/verify-module-css-browser-0985170.mjs` instrumentiert: vorhandene Chromium-Browserregression in 14 voneinander isolierten Viewport-/Theme-Kontexten. Kein neuer Dienst und keine Dependency.
- Chromium-CDP `CSS.startRuleUsageTracking` beginnt vor der Fixture-Navigation; `CSS.stopRuleUsageTracking` sammelt nach Widget (Karten/Kurve/Ensemble) und Bergwetter die tatsächlich verwendeten Regel-Offsets. Überlappende Intervalle werden vor der Bytezählung vereinigt. Ergänzend `Performance.getMetrics`.
- JSON-Diagnose: `artifacts/css-module-coverage.json` (gitignoriert). Kurzwerte stehen im CI-Log und in der Job-Zusammenfassung.
- **Grenze:** Vite-Entwicklungsfixture, **keine** produktive CSS-Coverage. Größen über die 14 Browser-Kontexte hinweg sind mehrfach gezählte Fall-Summen. Hieraus darf kein CSS-Split, kein Performancegewinn und keine vollständige Ansichtsabdeckung behauptet werden.
- Unverändert: CSS-Quellreihenfolge, Kaskadenvertrag, Themes, Widget-/Export-Meteorologie, Worker, iOS, Dependencies und Release-Konfiguration.
- Nächste Gate-Stufe vor CSS-Auslagerung: gemessene vollständige Produktions-Ansichts-/Theme-/Viewport-Matrix einschließlich High Contrast, Ort/Favoriten/Overlays, Cold-/Warmcache, URL-/PNG-/Widget-Parität und Safari/WKWebView separat.
- Diagnose-Draft. Kein neuer MID-Anwendungsbuild, daher kein Versionsbump, kein Release.

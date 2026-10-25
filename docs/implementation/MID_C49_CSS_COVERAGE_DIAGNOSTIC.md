# MID 18.2.49 – CSS-Regelnutzung: read-only Diagnose

- **Basis:** veröffentlichte v0.9.85.327, `main` = `mid-stable` = `e5f509cce4e9f345392b24c7f800d84efc5f8837`.
- **Unveränderte Produktions-Baseline:** `node scripts/test-performance-budget.mjs` zählt ein initiales CSS-Asset mit 1.759.985 Byte roh, 253.294 Byte gzip und 178.104 Byte Brotli. Kein CSS-Split wurde vorgenommen.
- Ausschließlich vorhandene Chromium-Browser-Fixtures werden mit CDP `CSS.startRuleUsageTracking` / `CSS.stopRuleUsageTracking` erweitert. Der gemeinsame Helper [`scripts/lib/cssRuleUsageDiagnostic.mjs`](../../scripts/lib/cssRuleUsageDiagnostic.mjs) erfasst Stylesheet-Offsets, rohe Quellbytes und ergänzend `Performance.getMetrics`.
- Die App-Fixture erfasst Favoriten, Einstellungen, „Aktuell“, Vorhersage/Radar und Karten-Fallback. Die Modul-Fixture erfasst Widget-Karten, Kurve, Ensemble und Bergwetter. Beide laufen über Light/Dark und ihre bestehenden Viewport-Matrizen. CI-Artefakte: `artifacts/css-app-coverage.json` und `artifacts/css-module-coverage.json` (gitignoriert); Kurzwerte stehen in den Job-Logs und Zusammenfassungen.
- Die Offsetintervalle werden vor der Bytezählung vereinigt. **Summen über unabhängige Viewport-/Theme-Kontexte zählen dieselben Stylesheets mehrfach.** Die Werte sind rohe CSS-Quellbytes, keine gzip-/Brotli-Übertragung und keine prognostizierte Einsparung.
- Lokaler Diagnose-Lauf auf .327: App-Fixture 16 Kontexte, 30.910.728 rohe CSS-Quellbytes über getrennte Fälle und 2.384.854 Byte verwendete Regelintervalle; Modul-Fixture 14 Kontexte, 26.455.632 rohe CSS-Quellbytes über getrennte Fälle und 1.242.188 Byte verwendete Regelintervalle. Diese Fall-Summen wiederholen Stylesheets und sind weder untereinander noch mit der Produktions-Baseline direkt vergleichbar.
- **Grenze:** Beide Messungen verwenden Vite-Entwicklungs-Fixtures. Sie decken die oben aufgeführten Ansichten ab, aber nicht alle 19 Dashboard-Module, sämtliche Overlays/Widgets/Exporte, produktiv erzeugtes CSS, High Contrast, Cold-/Warmcache oder Safari/WKWebView. Das ist keine vollständige Produktions-CSS-Coverage und keine Freigabe für einen CSS-Split.
- Kein produktiver CSS-Code, kein Import, keine Quellreihenfolge, keine Kaskade, kein Theme, kein Widget-/Exportverhalten, keine Meteorologie, kein Worker und keine Dependency geändert. Kein Anwendungsbuild und kein Versionsbump für die Diagnose.
- Nächste Gate-Stufe vor verzögerter CSS-Ladung: die bisher fehlenden Modul-/Overlay-/Exportansichten ergänzen; einen Build-/Produktionslauf mit Cold-/Warmcache messen; computed-style- und Pixel-Parität für Light/Dark/High Contrast, Widgets, SVG/PNG/URL-Exporte und Safari/WKWebView belegen. Nur klar begrenzte, gemessene Modulregeln kommen danach infrage.

## Statischer CSS-Querschnitt

Die folgenden Klassen-Zählungen stammen aus der veröffentlichten .326-Basis. Der Release-Diff .326 → .327 änderte keine CSS-Dateien; sie gelten deshalb unverändert, bleiben aber ein rein lesender Regex-Klassenvergleich, keine Browser-Coverage, kein gzip-Wert und kein Beleg für Kaskadenparität:

- `src/styles-src/25-extreme-outlook.css`: 23.956 Zeichen und 49 unterschiedliche CSS-Klassen-Tokens.
- `src/styles-src/30-modern.css`: 593.073 Zeichen und 1.348 unterschiedliche CSS-Klassen-Tokens.
- Von den Extremwetter-Klassen-Tokens erscheinen 11 ebenfalls in `30-modern.css`. Darunter sechs `extreme-`-Klassen: `extreme-outlook-panel`, `extreme-hazard-tabs`, `extreme-period-tabs`, `extreme-map`, `extreme-map-legend`, `extreme-region-list`. Die übrigen fünf sind generische bzw. gemeinsam genutzte Tokens.
- `src/midC18WarningTimeline.css`: 16.786 Zeichen und 30 Klassen-Tokens; `src/midC28MapPhase.css`: 3.067 Zeichen und drei Klassen-Tokens. Kleinere Dateigröße ist keine Freigabe für einen separaten CSS-Chunk.

Die spätere CSS-Kaskade überschreibt auch eigens benannte Selektoren. Bis die fehlenden Ansichten und produktiven Paritätsnachweise vorliegen, bleibt das zentrale Stylesheet unverändert.

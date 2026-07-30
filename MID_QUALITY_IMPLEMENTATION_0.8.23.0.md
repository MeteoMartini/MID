## MID v0.8.23.0 umgesetzt

**Automatische Versionsbewertung:** neue Funktionsversion ab **v0.8.22.3**, da ein systemweites professionelles Wetterpiktogrammsystem sowie eine neue ISO-3166-Ortskennzeichnung für Gewitterinformationen eingeführt wurden.

### I. Professionelle Wetterpiktogramme

- Transparente, skalierbare SVG-Piktogramme ohne eckige Emoji-Hintergründe
- Eigenständige Darstellung sämtlicher relevanter WMO-Wettergruppen
- Tag-/Nachtvarianten für klare, leicht und teilweise bewölkte sowie schauerartige Wetterlagen
- Separate Symbole für:
  - Nebel und Reifnebel
  - Sprühregen und gefrierenden Sprühregen
  - Regen und gefrierenden Regen
  - Schauer
  - Schneeregen
  - Schnee und Schneegriesel
  - Gewitter sowie Gewitter mit Hagel
- Einheitliche Verwendung in Dashboard, Kurzfrist- und Tagesvorhersage, Ensemble, Widget, Berg-, Wasser-, Reise- und Routenwetter

### II. Gewitterinformation – ISO-3166-Ländercodes

- Ortsnamen werden als `Ort, ISO3` ausgegeben, beispielsweise `Niederkassel, DEU`
- Gilt für Bezugsort, aktuelle Zellposition und prognostizierte Zellposition
- Vollständige ISO-3166-Alpha-2-zu-Alpha-3-Zuordnung integriert
- Gewitter-Ortscache auf `v2` migriert

### Prüfung

- TypeScript-/TSX-Parserprüfung der geänderten Dateien
- `node scripts/test-weather-pictograms-country-codes-08230.mjs`
- vollständige MID-Regressionsprüfung
- Worker-Syntaxprüfung

### Worker

- Keine funktionale Worker-Änderung
- Worker nur auf **v0.8.23.0** versionssynchronisiert

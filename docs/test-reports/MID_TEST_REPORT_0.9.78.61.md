# MID 0.9.78.61 – Testbericht

## Gezielte Prüfungen

- `test-pressure-axis-nice-spacing-097861.mjs`: bestanden.
  - ausschließlich ganzzahlige hPa-Ticks
  - identische Abstände zwischen allen Ticks
  - Datenbereich vollständig innerhalb der Achse
  - gemeinsame Nutzung in 24-h-Wetterprofil und Tagesdetail
- `test-seven-day-condition-label-consistency-097845.mjs`: bestanden.
  - kompakte einzeilige 7-Tage-Kategorien
  - vollständiger Tagescharakter bleibt Piktogramm-/Tooltipkontext
- `test-app-helper-block-buildfix-097857.mjs`: auf den neuen kompakten Pillenvertrag aktualisiert und bestanden.
- `test-detail-pressure-collapsible-legend-08150.mjs`: auf die gemeinsame Luftdruckachse aktualisiert und bestanden.
- Lokale relative Importprüfung: bestanden.

## Buildhinweis

Ein vollständiges lokales `npm ci` war in der Containerumgebung wegen eines Transport-Timeouts nicht verfügbar. Deshalb wird kein lokaler Vollbuild behauptet. Die geänderten neuen Helper sind eigenständig geprüft; die Release-ZIP wird zusätzlich auf Struktur, JSON-/Worker-Syntax, Versionierung und gezielte Regressionen kontrolliert.

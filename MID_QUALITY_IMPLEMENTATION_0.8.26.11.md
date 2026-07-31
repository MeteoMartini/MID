## MID v0.8.26.11 umgesetzt

**Automatische Versionsbewertung:** Wartungsrelease ab **v0.8.26.10**, da ausschließlich ein TypeScript-Buildfehler im bereits vorhandenen Ensemble-Tooltip korrigiert wurde.

### Ursache

`compactPrecipitationTooltipLabel(row)` wurde im Temperatur-Ensemble-Tooltip aufgerufen, die zugehörige Helferfunktion war im ausgelieferten Quellstand jedoch nicht mehr vorhanden. Dadurch brach der GitHub-Produktionsbuild mit `TS2304: Cannot find name` ab.

### Korrektur

- Helferfunktion wiederhergestellt
- Ausgabe weiterhin kompakt: Trocken, Regen, Schnee, Mischform oder Gewitter plus Best-Match-Menge
- genau eine Deklaration abgesichert
- keine Änderung an Wetterkästchen, Niederschlagssymbolik, Hazardmarkern, Tooltips, Tagesachsen oder Scroll-Optimierungen

### Prüfungen

- neuer Buildfix-Test für Deklaration und Verwendung
- zentrale Ensemble-Regressionen
- vollständiger MID-Regressionslauf
- JavaScript-/MJS-Syntaxprüfung
- TypeScript-/TSX-Parserprüfung
- Worker-Syntaxprüfung

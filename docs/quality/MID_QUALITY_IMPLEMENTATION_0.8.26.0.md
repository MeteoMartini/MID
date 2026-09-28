## MID v0.8.26.0 – Technik-, Performance- und Recharts-3-Release

### Versionsbewertung

Neue Funktionsversion ab v0.8.25.4. Die Hauptversion der zentralen Diagrammbibliothek wurde migriert und der technische Release-, Cache- und CI-Unterbau substanziell erweitert.

### Recharts 3

- Recharts 3.8.1 exakt festgeschrieben
- `react-is` 18.3.1 passend zur React-Version ergänzt
- Temperatur-, Niederschlags- und Windensemble vollständig erhalten
- Recharts-3-Zugänglichkeitsschicht in allen drei Diagrammen
- Resize-Verarbeitung gedrosselt
- responsiver Bildschirm- und fester PNG-Exportpfad in `EnsembleChartFrame.tsx` zusammengeführt

### Abhängigkeiten und Build

- TypeScript 5.9.3
- Vite 6.4.3
- `@vitejs/plugin-react` 4.7.0
- Node-/npm-Vertrag in `engines` und `packageManager`
- `package-lock.json` vollständig auf v0.8.26.0 synchronisiert und offline durch npm validiert
- TypeScript-Build auf `--noEmit` umgestellt
- generierte TS-/Vite-Artefakte entfernt und über `.gitignore` ausgeschlossen

### Performance und Speicher

- Radarhistorie: LRU-Limit 24 Orte
- KOSTRA-Punktcache: LRU-Limit 32 Orte
- Reisewetter-Speicher: 32 Einträge im Arbeitsspeicher, 24 persistente Standortdatensätze
- abgelaufene/malformed Local-Storage-Werte werden entfernt
- Quota-Fallback bereinigt kontrolliert und versucht genau einmal erneut
- dokumentweite Attributbeobachtung durch App-spezifischen Mutation-/Resize-/Interaktionspfad ersetzt

### CI und Sicherheit

- alle verwendeten GitHub Actions auf vollständige Commit-SHAs festgeschrieben
- Berechtigungen pro Job reduziert
- Produktionsaudit in Installations- und manuellem Deploy-Workflow
- wöchentlicher vollständiger Dependency-Audit
- Dependabot für npm und GitHub Actions ohne automatisches Major-Merging
- Release enthält eine kanonische, separat einzuspielende `.github`-Konfiguration; der Installationsjob verändert Workflowdateien nicht selbst

### Funktionsschutz

Es wurden keine bestehenden Wetter-, Radar-, Warn-, Ensemble-, Export-, Widget-, Reise-, Berg-, Wasser- oder Wetterzwillingfunktionen entfernt oder eingeschränkt. Sämtliche bestehenden Regressionstests bleiben Bestandteil des Releasevertrags.

## MID v0.8.26.2 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.1**, da die fachlichen Funktionen unverändert bleiben und ausschließlich zwei im GitHub-Runner fehlschlagende, umgebungsabhängige Regressionstests stabilisiert werden.

### Ursache

Die Produktion und der Recharts-3-Build waren erfolgreich. Anschließend scheiterten zwei Regressionen:

- `test-github-actions-runtime.mjs`
- `test-maintenance-recharts3-cache-ci-08260.mjs`

Die Prüfungen enthielten unnötige Abhängigkeiten von unverbindlichen Workflow-Kommentaren beziehungsweise von einer zweiten Offline-npm-Auflösung in einem temporären Verzeichnis. Das konnte auf einem frischen GitHub-Runner trotz zuvor erfolgreichem `npm ci` abweichend reagieren.

### Korrekturen

- Workflowprüfung beschränkt sich auf die drei verbindlichen MID-Workflows.
- Jede verwendete Action wird weiterhin zwingend auf einen vollständigen 40-stelligen Commit-SHA geprüft.
- Versionskommentare wie `# v6.0.2` sind nicht mehr Bestandteil der funktionalen Prüfung.
- Der zweite Offline-npm-Unterprozess wurde entfernt.
- Lockfile wird stattdessen direkt und deterministisch auf Version 3, Root-Abhängigkeiten, öffentliche Paketquellen und Integritätswerte geprüft.
- Neue Regression `test-ci-regression-determinism-08262.mjs` schützt diese Anforderungen dauerhaft.

### Funktionalität

Keine Wetter-, Diagramm-, Radar-, Ensemble-, Warn-, Cache- oder Exportfunktion wurde verändert oder eingeschränkt.

### Worker

Kein funktionaler Worker-Umbau; nur Versionssynchronisierung auf **v0.8.26.2**.

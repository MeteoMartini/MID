# MID v0.9.78.34 – PR-/Security-Matrix

| Punkt | Pro | Contra/Risiko | Entscheidung |
| --- | --- | --- | --- |
| PR #6: `react-dom`/Types 19 | Neuer React-DOM-Stand | React selbst bleibt 18; CI-Vertrag scheitert; unzulässige Mischinstallation | nicht übernehmen; Schließen durch GitHub-App-403 blockiert |
| PR #18: `@vitejs/plugin-react` 6 | Neuer Plugin-Stand und Compileroptionen | Reproduzierbarer Build scheitert gegen Vite 6.4.3 mit `ERR_PACKAGE_PATH_NOT_EXPORTED` | nicht übernehmen; Schließen durch GitHub-App-403 blockiert |
| PR #21: `react-is` 19 | Neuer Einzelpaketstand | React/React DOM bleiben 18; sechs Regressionen scheitern; inkonsistenter Runtime-/Lockfile-Stand | nicht übernehmen; Schließen durch GitHub-App-403 blockiert |
| CodeQL #83–#88: URL-Substringprüfung | Exakte Host-/URL-Prüfung beseitigt False Positives und schützt gegen ähnlich benannte Hosts | Kleiner gemeinsamer Testhelfer zusätzlich | umsetzen |
| CodeQL #81–#82: OAuth-Callback im Browser-Speicher | Keine persistente Ablage validierter Rücksprungdaten; geringere XSS-/Forensikfläche | Handoff gilt nur im laufenden App-Kontext; URL und serverseitiges 30-min-Ergebnis bleiben als vorgesehene Rückfallpfade nötig | umsetzen |
| CodeQL #89–#90: vorhersehbare `/tmp`-Dateien | Atomare Zufallsverzeichnisse, Modus 0700/0600, exklusive Dateierzeugung | Dynamische Pfade müssen zwischen Workflow-Schritten weitergereicht werden | umsetzen |

Die zehn Punkte CodeQL #81–#90 werden damit quellseitig geschlossen. React 19 und der zugehörige Vite-/Plugin-Sprung bleiben bis zu einem isolierten Major-Kompatibilitätslauf bewusst außerhalb von `mid-stable`.

Das Kommentieren und Schließen der drei PRs wurde versucht, von GitHub jedoch jeweils mit `403 Resource not accessible by integration` abgewiesen. Es erfolgte daher keine Repository-Mutation; die PRs müssen mit einem schreibberechtigten GitHub-Zugang geschlossen werden.

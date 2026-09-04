# MID Test Report v0.9.78.43

## Schwerpunkt

- iOS-/PWA-Splashscreen-Preload ohne zusätzliche Full-Ensemble-Abfrage
- Wiederverwendung der Splash-Promises in `App.tsx`
- appweite Periodenpiktogramm-Kohärenz
- korrekte Trennung von Tages- und Folgenacht-Piktogramm
- Erhalt des Weather Icon System 2.0 und der phasenabhängigen Niederschlagslogik

## Neue Regressionen

- `scripts/test-startup-splash-preload-097843.mjs`
- `scripts/test-period-pictogram-consistency-097843.mjs`

## Relevante Bestandsregressionen

- `scripts/test-weather-pictogram-ui-lock-09781.mjs`
- `scripts/test-day-following-night-boundaries-09155.mjs`
- `scripts/test-forecast-cockpit-daynight-wind-09134.mjs`
- `scripts/test-forecast-cockpit-pictograms-09100.mjs`
- `scripts/test-weather-profile-skybar-pills-097723.mjs`
- `scripts/test-parallel-merge-skybar-phase-097839.mjs`
- `scripts/test-startup-recovery-08281.mjs`
- `scripts/test-release-lineage.mjs`

## Fachliche Erwartung

- Ein als „Sonnig“ zusammengefasster Tag darf im 7-Tage-Hauptpiktogramm nicht mehr nur aufgrund einer einzelnen stärker bewölkten Stunde als geschlossene Wolke erscheinen.
- Das kleinere Folgenacht-Piktogramm bildet ausschließlich die nachfolgende Nacht ab und wird nach Periodenrelevanz statt Worst-Hour ausgewählt.
- Splash-Preload darf die vollständige Ensemble-Memberfusion nicht zusätzlich parallel starten; der bestehende Full-Fusion-Pfad nach Bootstrap bleibt erhalten.
- Der Open-Meteo-Guard bleibt bei maximal zwei aktiven Requests.

## Lokaler Prüflauf

Erfolgreich ausgeführt wurden:
- beide neuen v0.9.78.43-Regressionen,
- der aktualisierte appweite Weather-Pictogramm-Lock,
- Forecast-Cockpit Tag/Nacht und Piktogramme,
- Skybar-/Parallel-Merge-/Startup-Recovery-Verträge,
- Versioning und Aggregate-Version-Contract,
- appweite Parameterfarben,
- v0.9.78.41-TS6133-Skybar-Schutz,
- erweiterte 7d-Nachtfläche,
- Ensemble-Rate-Budget, Mean/Spread-Fast-Availability und Deadline-Watchdog,
- Release-Lineage,
- Syntaxprüfung von `worker.js`, `worker/metar-proxy.js`, `public/service-worker.js` und `public/sw.js`.

Der vollständige lokale Regression-Runner wurde zusätzlich angestoßen. Ausführbare Tests liefen bis zum Zeitbudget weiter; mehrere ältere Tests konnten in der entpackten Offline-Arbeitsumgebung ausschließlich wegen des fehlenden Pakets `typescript-strada` nicht starten. Ein anschließendes `npm ci` konnte innerhalb des lokalen Netzwerkzeitbudgets nicht abgeschlossen werden und wurde beendet. Daher bleibt der GitHub-Installer mit seinem vollständigen `npm ci` + TypeScript-7 + Vite-Build der finale Komplett-Quality-Gate. Die neuen v0.9.78.43-Dateien selbst wurden vor dem Paketieren zusätzlich mit dem verfügbaren TypeScript-Parser/Compilerpfad geprüft.

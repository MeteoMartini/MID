# MID Test Report 0.9.78.67

## Neue / gezielt erweiterte Regressionen

- `scripts/test-ensemble-multiparameter-097865.mjs`
  - robuste Mehrparameter-Aggregation
  - 50:50-Niederschlagsereignis ohne Konfidenzstrafe
  - Trennung meteorologischer Konfidenz und Datenqualität
  - parameterbezogene erwartete Modellfamilien
  - Vorlaufnormalisierung und Langfrist-Cap
  - lokale Skill-Kalibrierung mit Schrumpfung und 96-h-Grenze
  - vollständige native Tagesabdeckung der Ensembleparameter
- `scripts/test-ensemble-confidence-calibration-097867.mjs`
  - Gewichte 32/28/28/12
  - Datenqualitätsgrenzen
  - Brier-/Rückblickadapter
  - App-, Cockpit- und EnsemblePanel-Verdrahtung
  - separater Datenqualitäts-Außenring
  - kein Rückfall auf „schwächster Parameter gewinnt“

## Aktualisierte Altregressionen

- `scripts/test-cockpit-fourteen-day-character-094017.mjs`
- `scripts/test-cockpit-fourteen-uncertainty-date-09153.mjs`
- `scripts/test-ensemble-fast-availability-097836.mjs`

Diese Tests wurden nur auf die neue API-/Konfidenzarchitektur aktualisiert; ihre fachlichen Schutzverträge bleiben erhalten.

## Lokale Ergebnisse vor Release-Packaging

- `test-ensemble-multiparameter-097865.mjs`: bestanden
- `test-ensemble-confidence-calibration-097867.mjs`: bestanden
- `test-cockpit-fourteen-day-character-094017.mjs`: bestanden
- `test-cockpit-fourteen-uncertainty-date-09153.mjs`: bestanden
- `test-ensemble-fast-availability-097836.mjs`: bestanden
- Breiter Ensemble-/14d-/Cockpit-Lauf: 81/90 bestanden; die verbleibenden neun Tests konnten lokal ausschließlich wegen des fehlenden Pakets `typescript-strada` nach abgebrochenem `npm ci` nicht ausgeführt werden. Es wurde dabei keine weitere fachliche Regression gefunden.
- `test-audit-science-097864.mjs` war aus demselben lokalen Abhängigkeitsgrund nicht ausführbar; der neue eigenständige Konfidenzvertrag wird durch `test-ensemble-confidence-calibration-097867.mjs` abgedeckt.

## Buildumgebung

Ein erneutes `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline` wurde versucht, aber vom Container mit `TransportTimeoutError` abgebrochen. Deshalb wird kein vollständiger lokaler TypeScript-7-/Vite-Build behauptet. Der GitHub-Installer bleibt die verbindliche vollständige Buildprüfung.

## Prüfung des gepackten Artefakts

Die Professional-ZIP wurde nach dem Packaging in ein leeres Verzeichnis entpackt. Dort bestanden erneut:

- `test-ensemble-multiparameter-097865.mjs`
- `test-ensemble-confidence-calibration-097867.mjs`
- `test-cockpit-fourteen-day-character-094017.mjs`
- `test-cockpit-fourteen-uncertainty-date-09153.mjs`
- `test-ensemble-fast-availability-097836.mjs`
- `test-fourteen-day-bestmatch-fallback-097829.mjs`
- `test-fourteen-day-pill-favorite-tap-097866.mjs`
- `test-skybar-sun-cloud-exclusive-097863.mjs`
- `test-pressure-axis-nice-spacing-097861.mjs`
- Versionsschema, Release-Lineage, Baseline-Vertrag, Aggregat-Versionen und Upload-Budget.

`worker.js` und `worker/metar-proxy.js` bestanden den Syntaxcheck. Der Worker im separaten Worker-ZIP war bytegleich mit dem Worker des Professional-Artefakts. Beide ZIP-Dateien bestanden `unzip -t` ohne Fehler.

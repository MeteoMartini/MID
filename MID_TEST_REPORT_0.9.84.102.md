# MID v0.9.84.102 – Testbericht

## GitHub-Referenz

- letzter erfolgreicher stabiler Stand: v0.9.84.98 / `mid-stable`
- fehlgeschlagener Kandidat: v0.9.84.101
- Installer #1056 / Run `34844908449`
- ZIP-Prüfung: erfolgreich
- `npm ci`: erfolgreich
- Dependency-Audit: erfolgreich, keine HIGH/CRITICAL-Befunde
- TypeScript 7.0.2: erfolgreich
- Vite 8.2.2 Produktionsbuild: erfolgreich, 2601 Module transformiert
- Regressionen: 2 von 791 fehlgeschlagen, ausschließlich die beiden veralteten statischen Erwartungen `test-maplibre-precip-probability-09390.mjs` und `test-radar-colortables-09404.mjs`

## Hotfix-Prüfungen

Nach Aktualisierung der beiden Altverträge bestehen lokal:

- `test-maplibre-precip-probability-09390.mjs`
- `test-radar-colortables-09404.mjs`
- `test-radar-phase-echo-recovery-09406.mjs`
- `test-synoptic-phase-pictogram-cleanup-098499.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-synoptic-regional-fronts-098488.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-view-simulation-bottom-isohypsen-smoothing-098494.mjs`
- Versionsschema, Release-Lineage und Uploadbudget

Die Produktionsquellen sind gegenüber v0.9.84.101 fachlich unverändert; nur Regressionserwartungen, Versionsmetadaten und Dokumentation ändern sich. Der vollständige nächste GitHub-Installer bleibt das definitive Gesamt-Gate.

## Lokale Vollsuite

Eine zusätzliche lokale Vollsuite wurde angestoßen, ist aber in dieser isolierten Umgebung **nicht als Release-Gate verwendbar**: verfügbar ist lokal nur TypeScript 5.8.3 statt der im Projekt gepinnten Strada-/TypeScript-Version, wodurch einzelne Harnesses die TS7-Option `--ignoreConfig` nicht kennen; außerdem wurde der lokale Zeitrahmen überschritten. Diese umgebungsbedingten Meldungen werden daher nicht als Produktfehler gewertet. Entscheidend ist der GitHub-Lauf #1056, der TypeScript 7.0.2 und Vite 8.2.2 bereits erfolgreich durchlaufen hat; die dort einzigen beiden fachlich relevanten Regressionen wurden mit v0.9.84.102 gezielt korrigiert.

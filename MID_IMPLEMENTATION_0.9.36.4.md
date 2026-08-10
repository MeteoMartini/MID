# MID v0.9.36.4

## Änderungen
- Kumuliertes 14-Tage-Ensemble-Niederschlagsdiagramm: ENS-Mittel als dauerhaft sichtbare gestrichelte Linie ergänzt.
- ENS-Mittel erscheint im kumulierten Tooltip und in der Legende auch im Standardmodus.
- Export-Metadaten nennen ENS-Mittel verbindlich.

## CI-Diagnose
- `scripts/test-maintenance-recharts3-cache-ci-08260.mjs` läuft auf den unveränderten Releases v0.9.36.2 und v0.9.36.3 direkt grün.
- Zusätzlich wurden unter v0.9.36.2 alle 188 alphabetisch davor ausgeführten Regressionen in drei Blöcken ausgeführt; der Wartungstest blieb nach jedem Block grün.
- Mit `CI=true`, `GITHUB_ACTIONS=true` und `RUNNER_OS=Linux` bleibt er ebenfalls grün.
- Der rote Lauf fällt zeitlich mit der Aktualisierung des offenen Dependabot-PRs zusammen, der Recharts von 3.8.1 auf 3.10.1 anhebt. Der Wartungstest soll einen solchen ungeprüften Versionswechsel ausdrücklich blockieren und wird daher nicht abgeschwächt.

## Prüfung
- 355/355 automatisch erkannte Regressionstests bestanden (in vier Laufblöcken).
- `EnsemblePanel.tsx` mit TypeScript-Parser geprüft.
- Worker-Syntax geprüft.

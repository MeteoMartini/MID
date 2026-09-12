# MID Test Report 0.9.84.63

## Ausgangslage
- GitHub `mid-stable` blieb nach dem fehlgeschlagenen Installer auf v0.9.84.60.
- Upload 0.9.84.62 auf `main`: TypeScript- und Vite-Build erfolgreich; 753 von 754 Regressionen bestanden.
- Einziger Fehler: veraltete String-Assertion in `test-appwide-precipitation-and-daily-heat.mjs` zur Present-Weather-Priorisierung.

## Korrekturprüfung
Bestanden:
- `test-appwide-precipitation-and-daily-heat.mjs`
- `test-current-weather-intensity-design-098451.mjs`
- `test-ui-audit-standardization-098462.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`

## Bewertung
Der Hotfix ändert keinen meteorologischen Produktionspfad. Er synchronisiert zwei ältere Regressionen mit der bereits vorhandenen und durch den spezifischeren Istwettervertrag geschützten Implementierung. Dadurch wird kein Funktionsumfang reduziert und keine fachliche Schutzprüfung entfernt.

## Lokale Gesamtregression
Ein lokaler Durchlauf von `run-regressions.mjs` wurde zusätzlich angestoßen. Ohne das in der Release-ZIP bewusst nicht enthaltene `node_modules` konnte die isolierte Umgebung jedoch nicht alle TypeScript-Strada-basierten Tests ausführen; der Lauf wurde deshalb nicht als vollständiger Pass gewertet. Maßgeblich für die vollständige Suite bleibt der GitHub-Installer mit `npm ci`. Der unmittelbar vorherige Installerlauf hatte dort bei erfolgreich bestandenem TypeScript-/Vite-Build 753/754 Regressionen bestanden; genau die einzige fehlgeschlagene Regression wurde in diesem Hotfix korrigiert. Die betroffenen sowie versionsrelevanten Tests wurden lokal gezielt erfolgreich ausgeführt.

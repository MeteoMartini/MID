# MID Test Report v0.9.77.8 – Installer #814 / Issue #27 Hotfix

## Ausgangsbefund

- GitHub Actions Run #814 (`MID-Release aus ZIP installieren und veröffentlichen`, Commit `5cc7cbd`) entpackte den Release, installierte die Lockfile-Abhängigkeiten und bestand den Dependency-Audit. Der Lauf scheiterte anschließend im TypeScript-Gate ausschließlich an `TS6133` in `src/SubseasonalTrendPanel.tsx`: `pointsForMetric()` deklarierte `height`, verwendete den Parameter aber nicht.
- Auto-Revision Issue #27 entstand unabhängig davon im Produktiv-Healthcheck. Die Website-Prüfung war erfolgreich; `scripts/check-api-contracts.mjs` wertete einzelne regionale Météo-France-/JMA-Modellpfade als globalen Produktivfehler.

## Korrekturen

1. `pointsForMetric()` besitzt keinen ungenutzten `height`-Parameter mehr; beide Aufrufe wurden entsprechend bereinigt.
2. API-Health trennt kritische Kernverträge und regionale Zusatzmodelle:
   - fail-closed: Best Match + Mond, ECMWF AIFS Europe Ensemble, EU-AQI, 6-h-Min/Max-Aggregation;
   - Degradation/Warnung: Météo-France- und JMA-Einzelmodelle sowie JMA-MSM-Druckniveaupfad.
3. Regionale Oberflächenprüfungen verwenden einen gemeinsamen belastbaren Minimalvertrag (Temperatur, Niederschlag, Gesamtbewölkung, Wind).
4. JMA-Druckniveauprüfung ist auf `jma_msm` getrennt; GSM/Seamless werden nicht mehr pauschal an denselben Profilvertrag gekoppelt.
5. Der ältere Trend-14d+-Buildregressionstest wurde an die seit v0.9.77.7 verbindliche kombinierte Tmax/Tmin-Darstellung angepasst.

## Ausgeführte Prüfungen

PASS:
- `node --check scripts/check-api-contracts.mjs`
- `node --check worker/metar-proxy.js`
- `scripts/test-api-contract-health-resilience-09778.mjs`
- `scripts/test-subseasonal-unused-parameter-09778.mjs`
- `scripts/test-extreme-threshold-ruc-horizon-09778.mjs`
- sämtliche fokussierten `test-*0977*.mjs` nach Aktualisierung des veralteten v0.9.77.5-Vertrags
- ZIP-Integrität und Ausschluss von `node_modules`, `dist`, `__pycache__`, `*.pyc`

Nicht als PASS beansprucht:
- Ein vollständiges lokales `npm run verify` konnte in der Sandbox nicht reproduziert werden, weil `npm ci` beim externen Paketabruf hängen blieb/zeitlich abbrach. Der fehlgeschlagene GitHub-Run #814 hatte `npm ci` und den Dependency-Audit bereits erfolgreich abgeschlossen; sein konkrete TypeScript-Fehlerstelle ist im korrigierten Quellstand entfernt.
- Ein lokaler Lauf der gesamten Regressionssuite ohne vollständige `node_modules` ist nicht aussagekräftig; erwartungsgemäß scheiterten Tests an fehlenden Laufzeit-/TypeScript-Paketen. Diese Ausfälle werden nicht als Produktfehler gewertet.

## Versions-/Deploymentstatus

- Releaseversion bleibt `0.9.77.8`, weil Run #814 vor Commit/Deployment abbrach und `main` zum Prüfzeitpunkt weiterhin `0.9.77.6` auswies.
- Dieser Hotfix ändert keine Worker-Fachlogik gegenüber dem bereits ausgelieferten v0.9.77.8-Worker. Das vorhandene `MID-worker.zip` bleibt byte-identisch.
## Nachprüfung Installer #815

- GitHub Actions Run #815 (`eadfeb2`) bestätigte den vorherigen TS-Hotfix: `npm ci`, Produktionsabhängigkeitsaudit, TypeScript 7.0.2 und Vite 6.4.3 waren grün.
- Die vollständige GitHub-Suite erkannte 618 Regressionstests; 617 bestanden. Ausschließlich `test-extreme-rain-profile-night-097628.mjs` scheiterte an drei veralteten exakten Quelltext-Erwartungen.
- Der Test wurde semantisch auf den bereits verbindlichen v0.9.77.8-Vertrag aktualisiert. Danach bestanden lokal der korrigierte Test sowie die fokussierten Extremwetter-, RUC- und Trend-14d+-Regressionen.
- Ein lokaler erneuter 618er Lauf ohne installierte `node_modules` ist nicht als Volltest wertbar; die dortigen Zusatzfehler stammen aus fehlendem `typescript-strada`/lokaler TypeScript-CLI und fehlenden generierten Build-Aggregaten. Run #815 hat genau diese Installations-/Buildumgebung dagegen erfolgreich hergestellt und bis auf den nun korrigierten Test vollständig durchlaufen.


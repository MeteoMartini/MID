# MID API Contract Retry Contract · v0.9.85.111

## Zweck

Die automatische MID-Revision prüft zentrale externe API-Verträge weiterhin fail-closed. Einzelne kurzzeitige Transportfehler eines GitHub-Runners oder eines Providers dürfen jedoch nicht sofort als fachlicher API-Vertragsbruch gewertet werden.

## Verbindliche Retry-Logik

- Kritische und optionale API-Vertragsabrufe erhalten höchstens drei Abrufversuche.
- Wiederholt werden ausschließlich Transportfehler sowie HTTP 408, 425, 429 und 5xx.
- Erfolgreiche 2xx-Antworten werden inhaltlich genau einmal gegen den jeweiligen Vertrag geprüft. Ein inhaltlich ungültiger Payload wird nicht durch Wiederholung kaschiert.
- Nicht-transiente 4xx-Antworten werden nicht automatisch wiederholt.
- Jeder Abrufversuch besitzt ein endliches Timeout.
- Zwischen transienten Fehlern wird mit begrenztem exponentiellem Backoff gewartet; ein vorhandener `Retry-After`-Hinweis wird innerhalb eines begrenzten Fensters berücksichtigt.
- Nach dem letzten erfolglosen Versuch bleibt ein kritischer Kernvertrag rot. Die Änderung ist ausdrücklich keine Aufweichung des fail-closed-Prinzips.

## Hintergrund

Nach Veröffentlichung von v0.9.85.110 bestanden Build, vollständige Regression, npm-Audit und Build-Budget. Die nachgelagerte automatische Revision meldete dagegen gleichzeitig generische `fetch failed`-Transportfehler für Open-Meteo Best Match + Mond, EU-AQI und ECMWF IFS native 3h Min/Max. Ein gezielter Wiederholungslauf reproduzierte mehrere Transportfehler, ohne dass die Produktregressionen betroffen waren.

## Release-Gate

v0.9.85.111 muss mindestens `scripts/test-api-contract-retry-0985111.mjs`, den vollständigen Regression-Runner, Produktionsbuild, Dependency-Audit und den bestehenden Source-PR-/Installer-/Pages-/Stable-Promotion-Pfad erfolgreich durchlaufen.

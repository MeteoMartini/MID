# MID v0.9.84.16 – Release-Hotfix nach GitHub-Run #971

## Anlass

GitHub-Release-Lauf #971 installierte die Abhängigkeiten reproduzierbar und bestand den Produktionsabhängigkeits-Audit. Der Release brach anschließend im TypeScript-7-Check an genau einer Nullability-Stelle in `src/main.tsx` ab: `getMidUpdateStatus()` darf bei einem Fehler `null` liefern, während der nachfolgende Vergleich auf der rechten Seite noch ungeprüft `status.appVersion` las.

## Korrektur

- Der Post-Update-Healthcheck prüft den Update-Status jetzt ausdrücklich auf einen vorhandenen Wert, bevor `pendingVersion` und `appVersion` verglichen werden.
- Das Laufzeitverhalten ändert sich dadurch nicht: Nur ein tatsächlich vorhandener pending Update-Stand kann den gezielten Rollback auslösen. Ein nicht verfügbarer Status fällt weiterhin auf die normale, bedienbare Fehler-/Cacheoberfläche zurück.
- Die geschützte Update-/Startup-Regression verlangt nun zusätzlich den null-sicheren Guard, damit derselbe TypeScript-Fehler nicht erneut eingeführt wird.

## Umfang

Keine meteorologische, UI-, Datenquellen-, Radar-, Ensemble- oder Worker-Fachänderung gegenüber v0.9.84.15. Sämtliche Grundaudit-/Performance-/Update-Recovery-Korrekturen aus v0.9.84.15 bleiben unverändert erhalten.

## Worker

Keine fachliche Workeränderung. Ein Cloudflare-Worker-Upload ist für diesen Hotfix nicht erforderlich.

# MID v0.9.52.2 – Hyperlokal-Audit-Regression-Hotfix

Ausgangsbasis ist v0.9.52.1. Der Produktionsbuild und TypeScript liefen im GitHub-Runner bereits erfolgreich; ausschließlich `test-hyperlocal-quality-audit-08200.mjs` scheiterte.

Der historische Audit-Test definierte eine hochwertige Stationsanalyse ohne `surfaceClass` als vollständig. Seit v0.9.52.0 ist fehlender Oberflächenkontext jedoch absichtlich ein Anreicherungsgrund, damit DGM-, Landnutzungs-, Versiegelungs- und Rauigkeitsinformationen in die hyperlokale Repräsentativitätsprüfung eingehen.

Fix: Der gute Audit-Fall enthält jetzt einen vorhandenen Oberflächenkontext. Zusätzlich schützt der Test ausdrücklich, dass dessen Fehlen weiterhin eine Qualitätsanreicherung auslöst. Die meteorologische Produktivlogik bleibt gegenüber v0.9.52.1 unverändert.

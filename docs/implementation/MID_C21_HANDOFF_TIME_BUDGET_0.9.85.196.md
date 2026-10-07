# MID-C21 · Handoff-Zeitbudget

Verifizierte Basis: main = mid-stable = cd3f88d3852591a6375fb46701f11708d118b6f1 (.195).

Handoff Run 37683018228 für Head 3a30e125417d990a3764df73781ca1141426360a brach nach 15 Minuten ab. Bis 900/938 Prüfungen waren null Fehler gemeldet; Build, Dependencies und geschützte Pfade bestanden.

Ausschließlich das Zeitbudget des vollständigen npm run verify im kanonischen und aktiven read-only Handoff-Gate steigt von 15 auf 25 Minuten; der Jobrahmen bleibt 30 Minuten.

Keine Prüfungen ausgelassen, keine Schwellen angehoben, keine Tokens/Rechte/Actions-Pins/Releasegrenzen geändert. Die bestehende Collaboration-Regression schützt nun zusätzlich den vollständigen Verify-Aufruf und das Zeitbudget.

Die UI-Integration bleibt bis zum grünen Handoff getrennt. Danach erneute Prüfung gegen die freigegebene Stable-Basis und normaler Source-/Installer-/Worker-/Pages-/Stable-Pfad.

Beleg: https://github.com/MeteoMartini/MID/actions/runs/37683018228

Der bestehende Test `scripts/test-mid-collaboration-hardening-0985106.mjs` schützt weiterhin sämtliche Governancepfade und ergänzt Assertions für den vollständigen Verify-Aufruf mit 25 Minuten sowie den 30-Minuten-Jobrahmen. Die kanonische Quelle wird ausschließlich über den ausdrücklichen Workflow-Sync gespiegelt.

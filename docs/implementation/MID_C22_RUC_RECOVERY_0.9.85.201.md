# MID-C22 · RUC-Veröffentlichung wiederaufnehmen · v0.9.85.201

Verifizierte Basis: main = mid-stable c3f3abebfd5e3da86013063d7b051b05399e3876 (.200). PR #293 wurde über Source-Gate/Installer/Pages erfolgreich veröffentlicht; alle Kartenänderungen und Widgetkorrekturen bleiben enthalten.

## Livebefund am 8. Oktober 2026

Worker ruc-health um 09:50 UTC: ready=false, fresh=false, reason=RUC-Lauf nicht frisch, Lauf 05:00 UTC, ageHours=4.85; sämtliche erforderlichen Objects vorhanden. Forecast-Fusion in Niederkassel (50.82/7.04): icon_d2_ruc successful=false, usedInCanonical=false. Keine Lockerung der 4-h-Fachgrenze.

RUC #37752646217 wurde nach Stablewechsel .198→.199 übersprungen. #37756706188 baute 08:00 UTC erfolgreich, 887712260 Bytes bei unverändertem 900-MB-Limit, veröffentlichte aber wegen .199→.200 Releasefenster nicht. Beide Runs insgesamt success, obwohl Publish/Worker-Übernahme skipped. Der Watchdog sah zuvor nur Schedulerzeit/Run-Erfolg, nicht veröffentlichte Datenaktualität.

## Korrektur

Watchdog nutzt den vorhandenen stdlib-only DWD/Pages-Frischevergleich. Ein grüner Schedulerlauf beendet den Watchdog ausschließlich bei unabhängig bestätigtem aktuell veröffentlichtem Lauf. Discovery-/Netzwerkunsicherheit führt zum bewährten force=false-Buildversuch; vollständige GRIB-Prüfung bleibt Autorität. Nach erfolgreichem Installer auf main im selben Repository wird derselbe guardierte Ablauf automatisch geprüft. Kein Checkout von Event- oder PR-Code, nur mid-stable, persist-credentials=false. Actions/Contents-Berechtigungen bleiben unverändert. Main/Stable-SHA-Sperre, aktive Runs, nachgewiesene leere Schedulerjobs und 18-min-Cooldown bleiben erhalten.

Upload-action hatte seit .198 ungültige Download-Inputs artifact-ids/merge-multiple; Logs bestätigten Unexpected input(s) und Defaultnamen artifact. Wiederholungen können damit kollidieren. Korrigiert auf name=mid-ruc-data-run_id-run_attempt. Download bleibt exakt an Producer-Artefakt-ID gebunden. Shell-Summary entfernt versehentliche Backtick-Kommandosubstitution.

## Validierung und praktische Grenze

Neue ausführbare Shell-Regression simuliert grünen Scheduler ohne Veröffentlichung, aktuelle Daten, unbekannte Datenaktualität, main/Stable-Differenz, aktiven Lauf, Dispatch-Cooldown und erfolgreichen Installertrigger. Upload/Download-Rollen und Workflow-Provenienz werden zusätzlich geprüft. Vorhandene RUC-/Workflow-Regressionssuite sowie vollständiger Source-/Installer-Gate bleiben erforderlich. Produktionsreparatur erst nach erfolgreicher .201-Promotion und anschließendem frischem RUC-Publish samt Worker-/Forecast-Nachweis bestätigt; ein bloß grüner Prepare-Run reicht nicht.

Audit vor Änderung: 0 critical/high; 7 bestehende medium-Fundstellen außerhalb dieses Reparaturumfangs. Generierten generischen Patch nicht übernommen. Keine Credentials, Hostprüfung, Budgets oder Branchschutz geändert.

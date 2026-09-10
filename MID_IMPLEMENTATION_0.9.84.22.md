# MID v0.9.84.22 – Release-Hotfix für RUC-Scheduler-Regression

## Anlass
Release-Run #977 scheiterte nach erfolgreichem Produktionsbuild und Dependency-Audit an genau einer veralteten Regressionserwartung. Der Test `scripts/test-ruc-scheduler-watchdog-09751.mjs` verlangte noch `force.default: true` und die frühere sechsfach stündliche GitHub-Watchdog-Cron-Expression, obwohl der kanonische und bereits aktive Workflow absichtlich auf `force=false` und `:23/:53` optimiert wurde.

## Änderung
- Testvertrag auf `force.default: false` synchronisiert.
- Erwartete Watchdog-Cron-Expression auf `23,53 * * * *` synchronisiert.
- Testbeschreibung auf den Zwei-Slot-Watchdog angepasst.
- Keine Änderung der produktiven Workflowlogik, Wetterlogik, Datenquellen oder UI.

## Sicherheitsvertrag
Primäre RUC-Slots `:11/:41`, Freshness-Guard, Active-Run-Sperre, 18-Minuten-Cooldown, guarded dispatch, Run-Nachweis und der unabhängige Cloudflare-Watchdog bleiben unverändert geschützt.

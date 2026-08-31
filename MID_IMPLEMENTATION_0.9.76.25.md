# MID v0.9.76.25 – RUC-Watchdog-Regressionsabgleich

## Anlass
Die in v0.9.76.24 eingeführte Scheduler-Resilienz war fachlich und in den aktiven GitHub-Workflows korrekt. Der ältere Regressionstest `scripts/test-ruc-scheduler-watchdog-09751.mjs` schützte jedoch noch die vorherige `:18/:48`-Watchdogstruktur mit zwei separaten Cron-Einträgen. Dadurch scheiterte der Release-Installer nach erfolgreichem TypeScript-/Vite-Build mit genau einer veralteten Regression.

## Korrektur
- Der bestehende Test schützt nun den aktuellen Vertrag mit einer Cron-Expression `8,18,28,38,48,58 * * * *`.
- Active-Run-Sperre, 18-Minuten-Cooldown, `force=false`, `trigger_source=github-watchdog`, Push-Self-Test und Dispatch-Nachweis bleiben explizit regressionsgeschützt.
- Die Primärslots `:11/:41` bleiben unverändert.
- Die GitHub-interne Ebene wird korrekt als **same-provider** bezeichnet; echte Scheduler-Unabhängigkeit liefert erst der optional vorbereitete Cloudflare-Cron-Watchdog.
- Keine fachliche Änderung am produktiven MID-Wetterdaten-Worker; manueller Worker-Upload bleibt unnötig.

# MID v0.9.85.220

- Abgebrochene RUC-Snapshot-Downloads werden direkt mit begrenztem Backoff wiederholt.
- Nur vollständig geladene und per Größe/SHA geprüfte Dateien werden übernommen.
- Bei dauerhaftem Fehler bleibt der vorhandene Snapshot erhalten; Teilbytes werden nicht veröffentlicht.

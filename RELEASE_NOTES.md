# MID v0.9.85.373

## RUC: sichere Wiederaufnahme nach Versionswechsel
- Die automatische RUC-Überwachung prüft jetzt vor der Wiederverwendung eines vorbereiteten Datenlaufs, ob die zugrunde liegenden Worker-, Daten- und Verarbeitungsverträge zur veröffentlichten MID-Version passen.
- Veraltete oder nicht eindeutig verifizierbare Aufbereitungen werden nicht wiederholt gestartet. Stattdessen bleibt der etablierte Pfad zur vollständigen Neuaufbereitung verfügbar.
- Reine Versionsnummernwechsel können weiterhin ohne Neuberechnung behandelt werden, wenn die Originalverträge tatsächlich unverändert sind.
- Frischegrenzen, RUC-Horizont, verlustfreie Datenprüfung, amtliche Datenherkunft und die vollständigen Worker-/Pages-Veröffentlichungsprüfungen bleiben unverändert.

# MID v0.9.85.135

## Unveränderliche DWD-Karten-Snapshots

- Niederschlagssummen aus ICON-D2 erhalten eine eigene, vom tatsächlichen Datei-Hash abgeleitete Objektadresse innerhalb des bestehenden RUC-/Pages-Manifests.
- Ein neuer ICON-D2-Lauf oder eine Wiederholung der Aufbereitung kann dadurch keine bereits gecachte Raster-URL überschreiben, auch wenn der RUC-Lauf unverändert bleibt.
- Die Auswahl des aktuellen Kartenobjekts lädt das DWD-Manifest mit einer frischen Anfrage, damit ein Browser-/CDN-Cache keinen alten Lauf festhält.
- Snapshot-Erhalt, Kartenansicht, Favoriten, PNG-/SVG-Downloads und alle Änderungen aus v0.9.85.134 bleiben erhalten. Kein zusätzlicher Anbieter oder Workflow; bestehende kostenlose DWD-Pipeline.
- Regression prüft zwei unterschiedliche ICON-D2-Läufe bei identischem RUC-Lauf und verschiedene unveränderliche Objektadressen.

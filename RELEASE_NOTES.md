# MID v0.9.85.234

- GDPS-Wolken und Niederschlagsart erhalten das von GeoMet verlangte UTC-Zeitformat ohne Millisekunden. Lauf und gültiger Termin bleiben exakt erhalten; echte Sekundenbruchteile werden abgewiesen.
- Jede RUC-Aufbereitung protokolliert jetzt Speicheranteile, Restbudget, mögliche identische Objekte und begrenzte verlustfreie gzip-Stichproben. Zusätzlich werden die tatsächlich veröffentlichten Wolken-/Wetterstunden ausgewiesen.
- Das 900-MB-Budget, die Datenauflösung und sämtliche veröffentlichten Wetterwerte bleiben unverändert. Kompression und Deduplizierung werden zunächst gemessen, bevor ein neuer Datenvertrag eingeführt wird.

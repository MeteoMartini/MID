# MID v0.9.53.22

## Standort-Rückkehr und appweiter Request-Reuse

- Sichtbare AQI-Erklärung sprachlich bereinigt: keine Prompt-/Gestaltungsbegriffe wie „dezent“; die Skala wird neutral als Vergleichsskala beschrieben.
- Rückkehr zu einem bereits verwendeten Standort löst innerhalb fachlich geeigneter Frischefenster keine komplette Sekundärquellen-Abfrage mehr aus.
- GPS-Jitter wird durch räumlich tolerante, quellenbezogene Cache-Wiederverwendung abgefangen.
- Wiederverwendet werden insbesondere Stationsanalyse, Luftqualität, Radar-Nowcast, Radarhistorie, amtliche Warnungen, Gewitteranalyse und Starkregenbasis.
- Reverse-Geocoding der automatischen Standortbestimmung wird 14 Tage lokal mit räumlicher Toleranz wiederverwendet; eine neue GPS-Messung muss damit nicht erneut dieselbe Ortsmetadaten-Abfrage erzeugen.
- Open-Meteo/CAMS-Luftqualitätsdaten besitzen einen 15-Minuten-Frischecache und einen 2-Stunden-Stale-if-error-Pfad.
- Die nächstgelegene EEA-Messstationsmetadaten werden bei gleicher Umgebung cache-first wiederverwendet; der Worker-Cache bleibt zusätzlich erhalten.
- Push-Abonnementssynchronisation läuft nur noch, wenn sich der tatsächlich an den Worker gesendete Regel-/Ortspayload geändert hat. Ein bloßer Ortswechsel ohne relevante Push-Konfigurationsänderung erzeugt keinen erneuten Sync.
- Automatische Hazard-Abrufe verwenden kurze, fachlich passende Wiederverwendungsfenster; periodische Aktualisierung und Focus-/Visibility-Refresh bleiben erhalten.
- Manueller Reload bleibt ein echter Fresh-Reload und umgeht die kurzfristigen Wiederverwendungscaches bewusst.
- Bereits vorhandene appweite Caches für Kernforecast, Mehrquellen-Fusion, Ensemble, Modellmetadaten und Klimadaten bleiben unverändert erhalten.

Neue Required-Regression: `scripts/test-location-return-request-reuse-095322.mjs`.

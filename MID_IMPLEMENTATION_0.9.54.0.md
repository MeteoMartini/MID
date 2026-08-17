# MID v0.9.54.0

## Open-Meteo Update-/Auditintegration vom 17.08.2026

Dieser Release übernimmt die für MID verbindlich vorgesehenen Open-Meteo-Änderungen, ohne den bestehenden Best-Match-, Wetterbündel-, Nowcast- oder Wetterzwilling-Vertrag aufzulösen.

### 1. ECMWF AIFS Europe Ensemble

- `ecmwf_aifs_europe_ensemble` fordert für den Auditpfad zusätzlich `cloud_cover`, `cloud_cover_low`, `cloud_cover_mid` und `cloud_cover_high` an.
- Bewölkungswerte werden vor Verwendung auf 0–100 % und Niederschlag auf einen plausiblen nicht-negativen Bereich geprüft.
- Unplausible AIFS-Europe-Antworten werden nicht still in die Ensembleauswertung übernommen.

### 2. Météo-France AROME / ARPEGE

- Die aktuellen AROME-Modellkennungen `meteofrance_arome_france_hd`, `meteofrance_arome_france`, die 15-Minuten-Varianten und `meteofrance_seamless` sind Bestandteil des Providerpfads.
- ARPEGE Europe/World bleiben getrennte Modellpfade; die Europa-Reichweite wird mit 96 Stunden behandelt.
- Der Auditvertrag prüft Niederschlag, Wind, Gesamt-/Schichtbewölkung und Sonnenscheindauer.
- Der veraltete AROME-Alias `meteofrance_arome_france0025` ist nicht mehr Primärvertrag.

### 3. JMA MSM / GSM / Seamless

- `jma_msm`, `jma_gsm` und `jma_seamless` sind im Modell- und Meteogrammvertrag registriert.
- Für japanische Orte bildet das Druckniveau-Meteogramm den lokalen Best-Match-Pfad kontrolliert auf JMA Seamless ab.
- Höhenübergabe und Druckniveaus von 1000 bis 100 hPa bleiben erhalten; nicht nativ geeignete JMA-Oberflächenvariablen werden im Direkt- und Workerpfad defensiv ausgelassen.
- Der hyperlokale Hintergrund kann in Japan JMA MSM bzw. JMA Seamless verwenden, bevor auf allgemeinen Best Match zurückgefallen wird.

### 4. Europäischer Luftqualitätsindex

- MID fordert neben Konzentrationen auch den gesamten europäischen AQI und die pollutantenspezifischen europäischen AQI-Werte an.
- Die Open-Meteo-AQI-Klassifikation wird bei vorhandenen Teilindizes vorrangig verwendet; die bestehenden Konzentrationsschwellen bleiben als defensiver Fallback erhalten.
- Zusätzlich werden stündliche PM-/AQI-Reihen für Rückblick und Verlauf mitgeladen.

### 5. Aggregationsmetadaten / Begleitregressionen

- `temperature_2m_min` und `temperature_2m_max` werden im API-Vertrag als getrennte 6-stündliche JSON-Aggregationen geprüft. MID führt dafür keinen unnötigen FlatBuffers-Laufzeitpfad ein.
- Mondfelder `moonrise`, `moonset`, `moon_phase` bleiben Bestandteil des Open-Meteo-Vertrags.
- Die DWD-ICON-Modellfamilie und der deutsche ICON-D2-Vorrang bleiben regressionsgeschützt.

### Regression

`scripts/test-openmeteo-update-audit-09540.mjs` bündelt die neue verbindliche statische Regression. `scripts/check-api-contracts.mjs` prüft die betroffenen Verträge zusätzlich gegen die Live-APIs, sobald Netzwerkzugriff verfügbar ist.

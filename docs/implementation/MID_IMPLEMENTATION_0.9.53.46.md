# MID v0.9.53.46 – Regression-Vertragsabgleich nach Lüftungsassistent

- Behebt den GitHub-Actions-Abbruch aus v0.9.53.45, ohne Wetter-, Stations- oder Lüftungslogik zu verändern.
- Der ältere v0.9.53.23-Follow-up-Test berücksichtigt nun den seit v0.9.53.45 zum Hauptmodulvertrag gehörenden Lüftungsassistenten vor `mountain`.
- Der Wetterzwilling-Stufentest wurde an die in v0.9.53.45 bewusst reaktivierte private Sensorintegration angepasst (`PRIVATE_SENSOR_INTEGRATION_ENABLED=true`).
- Die neueren Integritäts- und Stationsregressionen bleiben unverändert maßgeblich: Hauptsektionen sind default-closed; private Stationsdaten sind wieder explizit freigegeben.
- Keine Änderung an OAuth, Token-Speicherung, Wetterzwilling, Forecast-Fusion, Push- oder Lüftungsentscheidungen.

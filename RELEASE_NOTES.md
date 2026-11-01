# MID v0.9.85.392 – Bergwetter: Schneemessungen nur mit gesicherten Originalwerten

- Fehlende oder ungültige GeoSphere-Schneehöhen werden nicht mehr als gemessene 0 cm angezeigt. Eine tatsächlich gemessene Schneehöhe von 0 cm bleibt unverändert gültig.
- Schneemessungen ohne nachprüfbare Stationshöhe, mit widersprüchlichen Höhenangaben oder fehlerhaften Messzeiten werden im Bergwetter als nicht verfügbar behandelt.
- Die bestehende GeoSphere-Anbindung und alle Prognosen, RUC-Daten, amtlichen Warnungen, Karten sowie Modell- und Schneefallberechnungen bleiben erhalten. Die Fehlerfälle sind durch dynamische Regressionen abgedeckt.

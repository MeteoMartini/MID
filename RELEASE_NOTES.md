# MID v0.9.85.393 – Bergwetter: echte Schneehöhe statt fehlendem Nullwert

- GeoSphere-Schneehöhen mit fehlendem Originalwert werden nicht mehr als „0 cm“ angezeigt. Ein tatsächlich gemessener Wert von 0 cm bleibt gültig.
- MID prüft Stationshöhe, Entfernung, Höhendifferenz, Messzeit und Wertebereich der Schneemessung strenger. Ohne verlässliche Stationsdaten wird keine scheinbar aktuelle Messung ausgegeben.
- Alle bisherigen Prognosen, amtlichen Warnungen, Karten, RUC- und Modellfunktionen bleiben erhalten; die vorherige .392-Kartenlegendenverbesserung bleibt unverändert.

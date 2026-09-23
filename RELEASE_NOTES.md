# MID v0.9.85.95

- Gewitterhinweise zeigen diagnostische Modellwerte durchgehend als Signalstärke und nicht mehr als scheinbar kalibrierte Prozentwahrscheinlichkeit.
- Die Kurzfristdiagnose respektiert die native zeitliche Auflösung der DWD-RUC-Parameter: 15-minütige ML-CAPE/CIN-Werte und stündliche MU-CAPE/CIN-Werte werden nur zeitlich passend kombiniert.
- Die Skybar trennt Sonnenscheindauer und Gesamtbewölkung fachlich sauber. Wolkenlücken werden nicht mehr als Sonnenscheindauer ausgegeben.
- Ensembleinformationen berücksichtigen die native Zeitauflösung der Modelle. WeatherNext 2 bleibt für Tages- und Szenarioaussagen erhalten, wird aber nicht für überpräzise stündliche Warn-/Ereignisaussagen verwendet.
- Zusätzliche Performance-Grenzen schützen große Karten-, Radar-, Ensemble- und Vendor-Module vor schleichendem Wachstum.

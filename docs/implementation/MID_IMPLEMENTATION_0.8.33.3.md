# MID v0.8.33.3

## Nowcast- und Niederschlagskonsistenz

- Trockener Konsens aus adaptiver Tagesfusion und hochwertigem MOSMIX greift in den ersten zwölf Stunden deutlich stärker auf die stündlichen Niederschlagswerte durch.
- Ein hochwertiger trockener Radar-Nowcast erhält im unmittelbaren Zeitraum bis zu drei Stunden Vorrang vor kleinen, veralteten Best-Match-Niederschlagssignalen.
- Bei trockenem Radar werden kleine Niederschlagsmengen entfernt, Wahrscheinlichkeiten deutlich abgesenkt und nicht mehr plausible Regen-/Schauer-/Gewitter-Wettercodes in passende Bewölkungscodes zurückgeführt. Ein nachfolgender KONRAD3D-Nowcast kann ein tatsächlich herannahendes Gewittersignal weiterhin wieder einblenden.
- Auch 15-Minuten-/Kurzfristkarten zeigen bei 0 mm und unter 30 % Wahrscheinlichkeit keinen Regenpiktogramm-Code mehr, sondern den zur Bewölkung passenden trockenen Wetterzustand.
- Tageskarte, 7-Tage-Trend und Detailpillen verwenden für kurzfristig betroffene Tage dieselben final korrigierten Stundenwerte.
- Die Detailansicht zeigt bei Niederschlagsmenge und maximaler Wahrscheinlichkeit nun exakt dieselben Tageswerte wie die 7-Tage-Karte.
- Für den aktuellen Tag bewerten Wettertext und 7-Tage-Trend nur noch die verbleibenden Prognosestunden; abgelaufene Modellstunden können keine zukünftige Regenaussage mehr auslösen.

## Regression

- Neue dynamische Prüfung für trockenen Tages-/MOSMIX-Konsens, trockenen und nassen Radar-Nowcast, Wettercode-Bereinigung und Tages-/Detailkonsistenz.

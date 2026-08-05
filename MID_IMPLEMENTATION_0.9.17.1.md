# MID v0.9.17.1

- Kurzfrist-Cockpit unterhalb der 90-Minuten-Vorhersage optisch und strukturell überarbeitet.
- Neue responsive Insight-Zone mit stündlicher Vorschau, Temperaturspanne, Windspitze und Niederschlagsfenster ergänzt.
- Kurzfristdiagramm vertikal kompakter abgestimmt.
- Redundanten 14-Tage-Streuungstext oberhalb des MID-Prognose-Kompasses entfernt; Kompass bleibt zentrale inhaltliche Referenz.
- Regression `scripts/test-cockpit-shortterm-insight-09171.mjs` ergänzt und in `package.json` sowie `MID_BASELINE.json` verankert.
- CI-Korrektur: bestehende Ganzzahl-Prozentregression für das maximale Niederschlagsrisiko an die neue Kurzfristdarstellung angebunden.

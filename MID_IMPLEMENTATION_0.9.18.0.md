# MID v0.9.18.0

## Schwerpunkt
Professionelle Neuentwicklung des Cockpit-Kurzfristmeteogramms.

## Änderungen
- Konfliktanfällige alte Kurzfristdiagramm-Klassen durch einen vollständig separaten `cockpit-meteogram-pro`-Baustein ersetzt.
- Hochauflösendes SVG-Meteogramm mit ECMWF-Temperaturfarbverlauf, neutral gestrichelter gefühlter Temperatur, Niederschlagsbalken, Wetterpiktogrammen und Windpfeilen.
- Vollständige Dark-/Light-Mode-Anpassung über eigene Meteogramm-Variablen.
- Desktop-Overlay und separate mobile Detailbox für verlässliche Lesbarkeit auf schmalen Displays.
- Horizontales Wischen mit stabiler Mindestauflösung statt zusammengedrückter, unlesbarer Darstellung.
- Deterministische TS5076-Regression ohne umgebungsabhängigen TypeScript-Import.
- Neue Regression `scripts/test-cockpit-meteogram-pro-09180.mjs`.

# MID 18.2.2 · obligatorisches Redesign · v0.9.85.75

## Ziel

Das MID-Redesign ist ab dieser Version die einzige produktive Gesamtoberfläche. Die bisherige Umschaltung zwischen „Design 2.0.1“ und „Klassisch“ entfällt vollständig aus der Bedienoberfläche.

## Verbindlicher Vertrag

- Die Hauptnavigation verwendet ausschließlich die neue Bottom-/Workspace-Navigation.
- Ein gespeicherter alter Wert `mid:designMode:v1` wird beim Start entfernt und kann die Oberfläche nicht mehr auf die klassische Gesamtansicht zurückschalten.
- Einstellungen enthalten keinen Umschalter „Design 2.0.1 ↔ Klassisch“ mehr.
- Der moderne Forecast-Cockpit-Pfad bleibt obligatorisch aktiv.
- Das responsive MID-Design bleibt für Smartphone, Tablet und Desktop sowie Light/Dark maßgeblich.

## Ausdrücklich unverändert

Die fachliche Darstellungsoption **Skybar ↔ 24 Stundenquadrate** bleibt vollständig erhalten. Beide Varianten zeigen dieselben Einzelstunden und dieselbe Sonne-/Bewölkung-/Niederschlagslogik; entfernt wird nur die Gesamt-Designauswahl.

Auch Standard/Erweitert, Informationsdichte, Farbdesign und andere fachliche bzw. Bedienoptionen bleiben unabhängig vom obligatorischen Redesign erhalten.

## Regression

`scripts/test-mid-18-2-2-mandatory-design-098575.mjs`

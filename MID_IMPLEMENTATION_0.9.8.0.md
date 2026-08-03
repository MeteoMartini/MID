# MID v0.9.8.0

## Warnungen
- Automatische und amtliche Warnungen sind standardmäßig eingeklappt.
- Titel und Gültigkeitspille bleiben sichtbar.
- Kartenraster, Innenabstände und Schriftgrößen wurden für Desktop, Tablet und Smartphone deutlich verdichtet.

## Kurzfrist-Cockpit
- Klarer Umschalter `3 h` / `1 h`.
- 90-Minuten-Schnellblick zeigt Wetterpiktogramm, Temperatur, Niederschlag, Wahrscheinlichkeit, Wind und Böen.
- Wetterpiktogramme verwenden die zentrale plausibilisierte Niederschlagsart.
- Temperaturachse, Zeitachse und Temperaturmittel sind eindeutig beschriftet.
- Windpfeile folgen den Farben der Warnstufen in der vollständigen Analyse.

## 14-Tage-Schalter und Cockpit
- Temperaturvorschau als Abweichung zum klimatologischen Mittel mit Nullinie.
- Positive Abweichung rötlich, negative Abweichung bläulich.
- Abweichungen in Kelvin; Tmin blau, Tmax rot.
- Niederschlag als ein kombinierter Balken aus Menge und Wahrscheinlichkeit.
- Wind/Böen in den Farben des vollständigen Winddiagramms.
- Technisch wenig hilfreiche Mitgliederzeile entfernt.

## Ensemble-Diagramme
- P10–P90 im Niederschlagsdiagramm ist ein eigener Layer-Schalter.
- Ausschalten entfernt ausschließlich die schwarzen Spannen, nicht Achsen oder Rahmen.
- Desktop-Tooltips reagieren auf Hover; Touchgeräte weiterhin auf Antippen.

## Version
- Ausgangsbasis: MID v0.9.7.1 (`mid-stable`).
- Neue Version: MID v0.9.8.0.
- Worker funktional unverändert; nur Versionssynchronisation.

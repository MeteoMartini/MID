# MID Design 2.0.1 · Aktuell kritisch geprüft · v0.9.85.46

Basis: v0.9.85.45.

## Screenshot-Befund

Der mobile Stand war gegenüber v0.9.85.44 verbessert, aber noch nicht freigabefähig. Kritisch waren vor allem:
- 12-h-Linie ohne Zeit-/Wertkontext und mit irreführender Hervorhebung am rechten Ende,
- unnötig hohe Niederschlagsfläche bei trockener Lage,
- kollisionsanfällige Zusatzwerte,
- Warnstatus mit knapper Breite,
- zu frühes Wiedererscheinen der Floating-Bottom-Bar.

## 12-h-Wetterfaden

Der Faden bleibt ein kompakter Temperaturtrend und ersetzt kein Meteogramm. Er ist jetzt eindeutig lesbar:
- Datenquelle: vorhandene stündliche MID-Temperaturwerte,
- Fenster: aktueller Stundenwert bis +12 h,
- 13 Stundenpunkte,
- Zeit-/Temperaturanker: Jetzt, Mitte, Ende,
- kompakte Min-/Max-Spanne,
- Jetzt-Punkt am linken Beginn,
- separater unaufdringlicher Endpunkt,
- keine Interpolation, Mittelung oder zeitliche Verschiebung.

## Feuchtehierarchie

Taupunkt bleibt primär:
- Hauptwert: Taupunkt in °C,
- Sekundärwert: relative Feuchte in %.

## Mobile Dichte

- trockene Niederschlagslage als kompakte Statuszeile,
- UVI/AQI volle Breite ohne Überlagerung,
- Sonnenschein und Sonne/Mond kompakte Zeilen,
- Labels nicht unnötig ellipsiert,
- sichtbare Info-Schaltflächen klein, Touchflächen groß genug,
- Warnstatus vollständig im Viewport.

## Bottom-Bar

Im Auto-Modus:
- früheres Ausblenden beim Abwärtsscrollen,
- deutlich weniger empfindliches Wiedereinblenden beim Aufwärtsscrollen.

Damit bleibt die Navigation erreichbar, verdeckt aber laufende Inhalte deutlich seltener.

## Regression

`scripts/test-design-2-0-1-current-critical-098546.mjs` schützt 12-h-Fenster, Zeitanker, korrekten Jetzt-Punkt, Taupunkt-Priorität, Dry-Nowcast, Bottom-Bar-Schwellen, Responsive-CSS und Classic-Isolation.

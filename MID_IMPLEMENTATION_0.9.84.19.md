# MID v0.9.84.19 – Widget: Windlayout und Temperaturfarben

## Extern
- Wind und Böen bleiben im kompakten Tages-Widget immer in genau zwei Zeilen: oben Wind, unten Böen. Lange bzw. breitere Werte dürfen nicht mehr in eine dritte Zeile umbrechen.
- In der Widget-/PNG-Ausgabe gibt es eine neue Option **ECMWF-Temperaturfarben**. Sie ist für neue Standard-Exporte aktiviert und kann bei Bedarf abgeschaltet werden.
- Die ECMWF-Farben gelten sowohl für die kompakten Tageskarten als auch für die Kurvenübersicht. Heller und dunkler Export erhalten kontrastangepasste, weiterhin temperaturwertbasierte Farbtöne.
- Feste Live-/Standard-Export-URLs verwenden die ECMWF-Temperaturfarben ebenfalls.

## Intern
- Widget-Persistenzschema von 4 auf 5 erweitert; ältere gespeicherte Einstellungen werden verlustfrei übernommen.
- `SevenDayCurveOverview` erhält einen optionalen Temperaturfarb-Schalter; außerhalb des Widget-Generators bleibt das bisherige ECMWF-Verhalten unverändert.
- Neue Regression `test-widget-wind-temperature-export-098419.mjs` schützt Zweizeilenlayout, Persistenz, Standard-Export und Kontrastdarstellung.

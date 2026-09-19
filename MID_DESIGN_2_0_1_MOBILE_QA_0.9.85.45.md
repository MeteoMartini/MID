# MID Design 2.0.1 · iPhone-QA · v0.9.85.45

Ausgangsbasis: v0.9.85.44. Die reale iPhone-Darstellung zeigte noch mehrere sichtbare Abweichungen vom freigegebenen Designziel.

## Erkannte Probleme

- Die geöffnete Zusatzwertefläche wirkte wie eine große blaugraue Kartenwand.
- UVI- und Luftqualitätswerte kollidierten optisch mit Info-Steuerungen und Skalen.
- Zwischen Footer und schwebender Bottom-Bar entstand unnötig viel Leerraum, weil Sicherheitsabstände doppelt reserviert wurden.
- Der Warnstatus im Ortskopf kürzte selbst kurze Zustände wie „Keine Warnung“ unnötig.
- Die Aktuell-Fläche war vertikal weiterhin zu hoch.
- „Feuchte / Taupunkt“ setzte die relative Feuchte als Hauptwert, obwohl im MID-Design 2.0.1 der Taupunkt als meteorologisch aussagekräftigerer Feuchteindikator priorisiert werden soll.

## Korrekturvertrag

1. Kernwerte auf normalen Smartphones einzeilig mit vier Spalten; 2×2 nur unter 370 px.
2. Taupunkt groß in °C, relative Feuchte sekundär in %.
3. Warnstatus 154 px breit und mit umbrechbarem Status statt Ellipse.
4. 12-h-Wetterfaden und Istwetterkopf vertikal verdichten.
5. Kurzfrist-Niederschlag bleibt fachlich unverändert; nur Dichte und Lesbarkeit werden angepasst.
6. Zusatzwerte ohne gemeinsame farbige Leerfläche; einzelne kompakte Instrumentzeilen.
7. UVI und EU-AQI volle Breite; Wert rechts, Skala darunter.
8. Sonnenscheindauer und Sonne/Mond als flache Vollbreitenzeilen.
9. Sichtbare Info-Schaltflächen 22 px, Touchziel 42 px.
10. Nur eine Bottom-Bar-Sicherheitsreserve; keine doppelte Unterkante.
11. Alle Regeln ausschließlich unter `data-mid-design='next'`.

## Unverändert

Klassisch, Datenquellen, Modellfusion, RUC/Nowcast, Warnschwellen, Wetterpiktogramme, Skybar-Fachlogik und stündliche Skybar-Auflösung bleiben unverändert.

## Regression

`scripts/test-design-2-0-1-mobile-qa-098545.mjs` schützt die genannten Verträge.

# MID v0.9.85.97

- Forecasts für denselben Ort unterscheiden Cache-Stände jetzt zuverlässig nach Höhe und Ortszeitzone. Ein Wechsel zwischen Tal und Gipfel oder zwischen Zeitzonen kann deshalb keinen unpassenden alten Kernforecast mehr übernehmen.
- Direkte und Worker-basierte Kernprognosen verwenden dieselbe angeforderte Höhe und Zeitzone.
- Dialoge, Popover und Sheets besitzen eine gemeinsame Tastatur-Fokusführung: Tab bleibt in der geöffneten Ebene, Escape schließt nur die oberste Ebene und der Fokus kehrt anschließend zum auslösenden Bedienelement zurück.
- Tages- und Folgenachtlogik orientiert sich an lokalen Kalendertagen und realen Prognose-Epochen statt an einem festen UTC-Mittag; dies schützt insbesondere Mitternacht, Sommerzeitwechsel und weit von UTC entfernte Zeitzonen.

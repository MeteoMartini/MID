# MID Implementation v0.9.10.0

## 14-Tage-Übersicht und Wettersymbole

- Wetterpiktogramm je Tag in der kompakten 14-Tage-Karte ergänzt.
- Wetterpiktogramm und Wetterzustand auch in der ausgewählten Fokuskarte ergänzt.
- Die vorhandene professionelle MID-Piktogrammfamilie deckt klare, bewölkte, neblige, stratiforme, konvektive, winterliche und gewittrige Wetterzustände einschließlich Tag/Nacht ab.

## Einheitliche Windpfeile

- Kurzfrist-, 7-Tage- und 14-Tage-Cockpit verwenden dieselbe Pfeilkonvention.
- Die Pfeile zeigen die Strömungsrichtung konsistent aus der meteorologischen Herkunftsrichtung abgeleitet.
- Böenwarnstufen übernehmen die gemeinsame Farbfolge Grün, Gelb, Orange, Rot und Violett.
- Böenwerte werden bei erhöhten Warnstufen zusätzlich textlich hervorgehoben.

## Hyperlokale Ultra- und Kurzfristprognose

- Ein gemeinsamer `ShortTermAnchor` wird im App-Datenpfad einmal aus aktueller hyperlokaler Stationsanalyse und Best Match erzeugt.
- Derselbe Anker wird sowohl an die vollständige Kurzfristvorhersage als auch an das Prognose-Cockpit übergeben.
- Die nächsten 90 Minuten und das 1-/3-Stunden-Raster werden aus derselben lokal assimilierten Kurzfristserie erzeugt.
- Berücksichtigt werden – sofern aktuell beobachtet – Temperatur, gefühlte Temperatur, Feuchte, Taupunkt, Druck, Wind, Böen, Windrichtung, Bewölkung, Sicht, Niederschlag und Wettercode.
- Stationskorrekturen laufen zeitlich kontrolliert aus; die kohärente Best-Match-/Nowcast-Prognose bleibt der meteorologische Grundpfad.

## Präzisere Kurztexte

- Die bisher sperrige Formulierung „kein Niederschlag voraussichtlich markant …“ entfällt.
- Trockene Lage beispielsweise: `Trocken · Böen bis 26 kt um 21:00`.
- Bei Niederschlag beispielsweise: `Schauer ab 18:00 · Böen bis 26 kt um 21:00`.
- Dieselbe Kurzform wird im Cockpitkopf, im Registeruntertitel und in der geöffneten Kurzfristansicht verwendet.

## Version

- Neue Funktionsversion: **MID v0.9.10.0**
- Worker funktional unverändert; nur Versionssynchronisation.

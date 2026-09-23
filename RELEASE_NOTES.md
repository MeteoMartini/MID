# MID v0.9.85.94

- MID behandelt die native Zeitauflösung von ICON-D2-RUC jetzt eindeutig und nachvollziehbar: 5-Minuten-Niederschlag, 15-Minuten-Felder nur dort, wo der DWD sie tatsächlich so liefert, und stündliche Felder bleiben stündlich.
- CAPE_MU und CIN_MU werden nicht mehr fälschlich als 15-Minuten-Rapidfelder angefordert. Dadurch sinkt unnötiger RUC-Aufwand und die Datenherkunft bleibt fachlich korrekt.
- Gewitter-Mehrparameterdiagnosen werden nicht mehr wie kalibrierte Prozentwahrscheinlichkeiten dargestellt. Sichtbar ist jetzt eine klar bezeichnete Signalstärke; amtliche und echte probabilistische Angaben bleiben davon getrennt.
- Trockene Wetterpiktogramme werden zusätzlich gegen die finalisierte Gesamtbewölkung plausibilisiert, damit „stark bewölkt“, „bedeckt“, Skybar und Symbolik nicht durch einen zu groben Wettercode auseinanderlaufen.
- Radar-, Gewitter- und Starkregen-Aktualisierungen teilen sich einen gemeinsamen Vordergrund-Refresh-Broker. Fokus-, Sichtbarkeits- und Online-Wechsel lösen dadurch weniger doppelte Arbeit aus.
- Identische gleichzeitige Worker-Abfragen ohne eigenen Abbruchkontext werden zusammengeführt, bevor der gemeinsame Cache greift.
- Ein automatisches Bundle-Budget schützt den bereits großen Haupt-JavaScript- und Haupt-CSS-Pfad vor weiterem unbeabsichtigtem Wachstum. Eine tiefere CSS-Konsolidierung bleibt dadurch messbar und regressionsgeschützt.

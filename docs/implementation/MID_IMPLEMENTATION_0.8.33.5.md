# MID v0.8.33.5

## UVI
- Sämtliche sichtbaren UVI-Werte werden app-weit auf ganze Indexstufen gerundet.
- Aktuelle UVI-Kachel, Schutz-Popover, Tagesdetail, Stunden-Tooltip, Berg-/Wintersport und Wasserwetter nutzen dieselbe zentrale Formatierung.
- Die aktuelle Gefahrenstufe wird aus dem ebenfalls gerundeten Anzeigewert bestimmt, damit Zahl und Stufenbezeichnung nicht widersprechen.

## Niederschlagswahrscheinlichkeit / Nowcast
- Die Karte „Aktuelle Niederschlagswahrscheinlichkeit“ verwendet bei einem belastbaren trockenen Radar-Nowcast dieselbe Autorität wie die kurzfristige Stundenkorrektur.
- Ohne relevantes Echo gelten bei hoher/mittlerer/eingeschränkter Radarqualität 94/82/58 % Radar-Gewicht.
- Ein vorhandenes Echo oder eine belastbare Ankunftsprognose bleibt von der trockenen Unterdrückung ausgenommen.
- Die Quellenzeile kennzeichnet den trockenen Radar-Nowcast ausdrücklich.

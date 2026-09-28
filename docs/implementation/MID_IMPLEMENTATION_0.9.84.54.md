# MID 0.9.84.54

## Widget-Kurvenexport
Im hellen Kurvenexport werden Box-/Drop-/Text-Schatten am Windrichtungspfeil vollständig unterdrückt. Dadurch entsteht zwischen Pfeil und Windwert kein grauer Exportartefakt mehr.

## Aktuelles Wetter
Der kompakte Faktenbereich zeigt weiterhin fünf logisch gruppierte Felder. Wind enthält nun Wind und Böen; Feuchte enthält zusätzlich den Taupunkt. Für die aktuelle Niederschlagsrate gilt die Reihenfolge: frischer Standort-Radarwert (max. 15 min, echter Standortniederschlag) -> frische hyperlokale Stationsanalyse -> kanonischer Current-/Best-Match-Wert. Damit wird ein bereits radar-/stationsgeeichter Wert genutzt, ohne trockene Radar-Nullwerte gegen eine noch vorhandene Modellphase hart zu überschreiben.

## Emsdetten / Bewölkung
Die Ursache des 8/8-Falls lag in der hyperlokalen Wolken-Gegenprüfung: METAR CAVOK wurde erkannt, aber wegen fehlendem numerischen Gesamtbedeckungsgrad aus der qualitativen Gegenprüfung entfernt. Parallel konnte ein DWD/Bright-Sky-Gesamtbedeckungswert einer nahen Einzelstation die Restfeldanalyse stark prägen.

Korrektur:
- CAVOK/CLR/SKC/NSC/NCD dürfen als qualitative Himmelsbeobachtung auch ohne numerischen cloudCover in die Gegenprüfung eingehen.
- Explizit wolkenlose Meldungen und CAVOK sind getrennt.
- CAVOK wird nicht als 0 % Gesamtbewölkung interpretiert, da hohe Wolken mit CAVOK vereinbar sind.
- Bei CAVOK bleibt der lokale Modellhintergrund für die Gesamtbewölkung führend; die stationsbasierte Restfeldkorrektur ist entfernungsabhängig begrenzt.
- BKN/OVC-Wolkenlagen bleiben weiterhin als positive Wolkenbeobachtung nutzbar.

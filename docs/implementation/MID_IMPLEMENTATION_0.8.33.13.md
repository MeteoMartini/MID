# MID v0.8.33.13

## Konsistente Tagesmenge und stündliche Niederschlagsdarstellung

Tagesmengen können bei Open-Meteo Best Match, MID-Mehrquellenfusion und lokalem Wetterzwilling aus einer anderen Aggregation stammen als die stündliche Mengenserie. Dadurch konnte der Tageskopf beispielsweise 0,4 mm und 74 % anzeigen, obwohl das Detaildiagramm keine stündliche Niederschlagsmenge enthielt.

MID gleicht nun die finale Darstellungszeitreihe in beide Richtungen ab:

- Eine für einen vollständig vorhandenen künftigen Tag noch nicht stündlich zugeordnete Tagesmenge wird nur dann verteilt, wenn die stündliche Niederschlagswahrscheinlichkeit das Ereignis belastbar stützt.
- Die fehlende Menge wird kompakt auf die wahrscheinlichsten Stunden verteilt; vorhandene Stundenmengen werden erhalten und nur um die Differenz ergänzt.
- Niederschlagsart, Teilmengen, Wettercode, Piktogramm und Tooltip werden gemeinsam aktualisiert.
- Die vorhandenen stündlichen Wahrscheinlichkeiten werden nicht verändert.
- Ohne ausreichendes stündliches Wahrscheinlichkeitssignal wird keine Uhrzeit erfunden; bei vollständig vorhandener Stundenreihe werden dann auch Tagesmenge und Tagesmaximum auf die tatsächlich sichtbare Stundenreihe zurückgeführt.
- Unvollständig abgedeckte Tage und der bereits laufende Tag bleiben von der Verteilung ausgeschlossen, damit vergangene Tagesanteile oder ein trockener Nowcast nicht künstlich umgedeutet werden.

Damit stimmen Tageskopf, Niederschlagskurve, Stundenkarten, Detailtooltip, Wetterpiktogramme, Tageszusammenfassung und alle auf der finalen Darstellungszeitreihe basierenden Auswertungen überein.

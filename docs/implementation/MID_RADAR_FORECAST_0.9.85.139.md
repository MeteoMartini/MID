# MID v0.9.85.139

## Radar-Nowcast und sichtbare Vorhersagespannen

- Radar-Balken und der unsichtbare Auswahlanker sind Grafikmarkierungen statt Buttons. Globale Touch-Mindesthöhen können Mengenunterschiede nicht mehr verdecken. Die gesamte Zeitachse bleibt per Berührung und Tastatur bedienbar.
- Ein kompakter nativer DWD-RV-Abruf über Bright Sky liefert Fünfminutenwerte ohne Ausdünnung. Einheiten, Referenzlauf, Aktualität und fehlende Werte werden geprüft; der direkte DWD-Pfad bleibt als Reserve erhalten. Fehlende Daten werden nicht interpoliert oder als trocken bilanziert.
- Summen, Hinweise, Achsen und Jetzt-Markierung erhalten ein abschließendes, eng begrenztes Layout. Auswahlanker werden auf einen unsichtbaren Pixel begrenzt.
- 7- und 14-Tage-Übersichten zeigen verfügbare P10–P90-Modellspannen für Tageshöchsttemperatur und Niederschlag. Das Temperaturband markiert zusätzlich P25–P75 und den angezeigten Wert auf einer gemeinsamen Skala. Fehlende Ensemblewerte erzeugen keine erfundenen Spannen.
- Eine aufklappbare Erklärung trennt Modellübereinstimmung von Trefferwahrscheinlichkeit und erläutert den zunehmenden Stellenwert von Tendenzen.

## Prüfung

- Basis: `main == mid-stable == 72c19e18f48cc9997d3ad65c69e3b00d8d723bf4` (v0.9.85.138).
- Neue Pflichtregression prüft native Einheiten, 24 Prognoseintervalle, Summen, Referenzläufe, fehlende/veraltete Werte und echte Mengenunterschiede.
- Im CI werden zusätzlich echte Browserprüfungen mit vollständiger CSS-Kaskade auf sechs Displaygrößen in Hell und Dunkel ausgeführt.
- UTCI-, Quellen-, Niederschlagsintervall- und gemeinsame Modellkartenänderungen aus .138 bleiben erhalten.

Native Quelle: https://github.com/jdemaeyer/brightsky/issues/144 und https://github.com/jdemaeyer/brightsky/blob/master/brightsky/query.py. Pixelwerte sind 0,01 mm/5 min; Prognosen werden nur aus dem neuesten frischen RV-Referenzlauf übernommen. Die verwendete öffentliche API benötigt keinen kostenpflichtigen Schlüssel. DWD-Daten und Bright-Sky-Bereitstellung werden in der Herkunft getrennt angegeben.

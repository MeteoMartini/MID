# MID 0.9.66.19

## Konturbezogene Regionen und nullsichere Wolkenuntergrenzen

Regionsname und meteorologischer Spitzenwert einer modellierten Gefahrenfläche
werden getrennt bestimmt. Die fachlichen Intensitäts- und
Wahrscheinlichkeitswerte stammen weiterhin aus den stärksten zur Kontur
gehörenden Signalen. Der angezeigte Regionsname stammt dagegen ausschließlich
aus der räumlich nächstliegenden, innerhalb der Kontur gelegenen Rasterzelle.
Eine entfernte stärkere Zelle, beispielsweise in der Ostschweiz, kann damit
keine Kontur im Raum Nürnberg mehr benennen.

Die Liste „Stärkste Regionen“ gruppiert nur identische Kombinationen aus
Region, Gefahr und Intensität und behält den Eintrag mit der höchsten
Wahrscheinlichkeit. Dadurch verschwinden redundante Wiederholungen derselben
Region und Stufe, ohne tatsächlich getrennte Regionen zu unterdrücken.

Im Flugwetterpfad werden `null`, `undefined` und leere Werte vor jeder
numerischen Umwandlung abgefangen. Ein noch nicht verfügbarer TAF- oder
Ceiling-Wert bleibt „nicht belastbar“ und kann nicht als 0 beziehungsweise
„unter 100 ft AGL“ erscheinen. Zusätzlich werden sehr niedrige diagnostische
Untergrenzen gegen Sichtweite, tiefe Bewölkung und Wettercode geprüft. Der
geänderte Cache-Schlüssel verhindert, dass ältere fehlerhafte
Zusammenfassungen weiterverwendet werden.

Da die regionale Rasterzuordnung und die Flugwetter-Cacheverträge auch den
Worker betreffen, sind Professional-App und Worker gemeinsam zu aktualisieren.

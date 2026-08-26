# MID 0.9.66.17

## DACH-Gefahrenflächen: eindeutige Kartenbeschriftung

Die Gefahrenflächen und ihre Marker verwendeten zuvor unterschiedliche
Gruppierungen: Konturen konnten mehrere räumlich getrennte Komponenten bilden,
während Marker nach dem zusammengefassten Regionsnamen dedupliziert wurden.
Dadurch blieb bei zwei getrennten Feldern derselben Region eines unbeschriftet.

MID leitet die Kartenmarker nun direkt aus den dargestellten Konturkomponenten
ab. Jede getrennte Fläche erhält I-Stufe und Wahrscheinlichkeit. Liegt ein
stärkerer Kern innerhalb einer schwächeren Hülle, wird nur der stärkere Marker
gezeigt; getrennte schwächere Flächen bleiben eigenständig bezeichnet.

Die zuvor anonym aufgerufenen CARTO-Rasterkacheln verlangen inzwischen einen
API-Schlüssel und lieferten das sichtbare Wasserzeichen `API KEY REQUIRED`.
Die Extremwetterkarte verwendet deshalb eine schlüsselfreie
OpenStreetMap-Kartenbasis. Ein transparenter zweiter Orientierungslayer erhält
Grenzen und Beschriftungen oberhalb der Gefahrenfarben.

## Flug-Events: lokale Eckwerte gegen Remote-Terminalwerte geschützt

Der bereits bestehende Plausibilitätsfilter verwarf modell-diagnostische
Wolkenuntergrenzen unter 100 ft bei guter Sicht und ohne stützendes
Low-Cloud-Signal. Danach konnte jedoch ein METAR-/TAF-Signal eines bis zu
120 km entfernten Terminals erneut in `ceilingMinFt` einfließen. So entstanden
widersprüchliche Zusammenfassungen wie `Sicht ≥ 10 km` und
`Wolkenuntergrenze unter 100 ft AGL`.

Standortbezogene Event-Eckwerte für Wolkenuntergrenze, Sicht und Böen werden
nun ausschließlich aus dem lokalen Modell-/Druckniveaupfad gebildet. Amtliche
METAR-/TAF-Signale bleiben mit Quelle, Entfernung und Gültigkeit im
Hazard-Screening erhalten, ersetzen aber nicht mehr den lokalen Eckwert.
Zusätzlich verwirft der Worker Terminal-Cloud-Basen unter 100 ft sowie Werte
oberhalb von 60.000 ft als fehlende, Sentinel- oder unphysikalische Angaben.

Die Korrektur der Kartenquelle ist rein frontendseitig. Der erweiterte
Terminalfilter liegt im Worker; für den vollständigen Vertrag müssen deshalb
Professional-App und Worker gemeinsam aktualisiert werden.

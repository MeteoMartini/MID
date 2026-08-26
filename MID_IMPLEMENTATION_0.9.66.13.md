# MID 0.9.66.13

## Sonnenschein und Niederschlag: appweiter Zeitkonsistenzvertrag

Die im Stundenprofil bisher angezeigte Niederschlagsdauer war nicht belastbar: Eine
Niederschlagswahrscheinlichkeit von beispielsweise 66 Prozent wurde rechnerisch zu
40 von 60 Minuten gemacht. Wahrscheinlichkeit beschreibt jedoch das Eintreten eines
Ereignisses im Bezugsintervall und nicht dessen Dauer. Diese Umrechnung ist entfernt.

- Stunden- und 3-Stunden-Details zeigen Menge, Eintrittswahrscheinlichkeit und
  Niederschlagsart, aber keine erfundenen Niederschlagsminuten.
- Reale Tages-Niederschlagsstunden sowie zeitlich aufgelöste 15-Minuten-/Radarwerte
  bleiben als eigene, fachlich getrennte Größen erhalten.
- Im Infofeld des Stundenprofils wird der Unterschied zwischen Wahrscheinlichkeit
  und Dauer ausdrücklich genannt.

Die Sonnenscheindauer durchläuft nach Modellbündel, Wetterzwilling, lokaler
Assimilation und Radar eine gemeinsame letzte Plausibilisierung:

- nachts 0 Sekunden; Stunden an Sonnenauf- und -untergang werden auf die reale
  Tageslichtüberdeckung des vorangehenden Zeitintervalls begrenzt und nicht nach
  einem einzelnen Tag-/Nacht-Zeitpunkt pauschal verworfen;
- begrenzt bei mehrfach gestütztem Nebel, geschlossener tiefer Bewölkung oder
  stratiformem Niederschlag mit belastbarer Niederschlags- und Wolkenstützung;
- keine pauschale Kürzung allein durch die Niederschlagswahrscheinlichkeit;
- keine pauschale Kürzung bei Schauer oder Gewitter, weil Sonnenregen möglich ist;
- fehlende Providerwerte bleiben fehlend und werden nicht zu 0 Minuten;
- 15-Minuten-, Stunden-, Tages-, Event- und Widgetpfade beziehen ihre Werte aus
  demselben bereinigten Zeitvertrag.

Die 3-Stunden-Ansicht summiert drei stündliche Sonnenscheinwerte und kann deshalb
korrekt bis 180 Minuten anzeigen. Zuvor wurde fälschlich gemittelt und anschließend
auf 60 Minuten begrenzt.

Der Worker spiegelt den Konsistenzvertrag für aktuelle und stündliche native
Apple-Widgetwerte. Für die Web-App wirkt die Korrektur im Professional-Build; für
vollständige appweite Einheitlichkeit einschließlich nativer Widgets ist der
Worker 0.9.66.13 mit auszurollen.

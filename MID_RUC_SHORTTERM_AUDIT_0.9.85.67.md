# MID v0.9.85.67 · RUC-/Wolken-Kurzfristaudit

## Ergebnis

Der Screenshot-Fall „Klar“ bei gleichzeitig „Wolken 12 % · H/M/L 100/100/0 %“ darf nicht als widerspruchsfreie meteorologische Aussage erscheinen. MID behandelt ab dieser Version Gesamt- und Schichtbewölkung weiterhin als getrennte Modellfelder, kennzeichnet aber klar widersprüchliche Schichtkombinationen als nicht belastbar. Ein trockenes WMO-Wettersymbol wird außerdem mit der tatsächlich verwendeten Gesamt-/Tiefbewölkung und Sicht abgeglichen.

## ICON-D2-RUC · native Zeitauflösung

Nach aktuellem DWD-Modellvertrag:

- CLCT, CLCL, CLCM und CLCH: 60 min.
- VIS, CEILING, HZEROCL und SNOWLMT: 15 min.
- CAPE_ML / CIN_ML und mehrere Konvektions-/Reflektivitätsdiagnosen: 15 min.
- Niederschlagsakkumulationen stehen produktspezifisch bis hinunter zu 5 min zur Verfügung.

MID erzeugt daher **keine fiktive 15-min-Gesamtbewölkung**. Die Wolkenfelder bleiben im stündlichen Zustandskern und werden für Zwischenzeitpunkte nur im bestehenden kanonischen Darstellungs-/Fusionspfad verwendet.

## Neu für 90 min / +0…6 h

VIS, CEILING, HZEROCL und SNOWLMT werden zusätzlich zum bisherigen stündlichen Fallback in einem nativen 15-min-RUC-Spezialprodukt vorverarbeitet und an die kanonische 15-min-Reihe weitergegeben.

- Sicht: unterstützt Nebel-/Sicht-Plausibilisierung.
- Ceiling: unterstützt tiefe Wolken-/Aviation-Diagnostik.
- Nullgradgrenze und Schneefallgrenze: stehen als zusätzliche Phasengrenzen zur Verfügung; die bereits native RAIN_GSP/SNOW_GSP/GRAU_GSP-Phase bleibt direkter.
- Lokale Beobachtungen und Radar behalten im Nahbereich Vorrang.
- Gesamt-/Tief-/Mittel-/Hochbewölkung werden nicht auf eine angebliche native 15-min-RUC-Auflösung hochgestuft.

## Wolken-Kohärenz

Schichtwerte werden in der Profilanzeige nicht mehr als präzise H/M/L-Zahlen oder Bänder ausgegeben, wenn sie der Gesamtbewölkung klar widersprechen. Der konservative Schutz toleriert kleinere Quell-/Interpolationsunterschiede, unterdrückt aber Kombinationen, bei denen eine Schicht den Gesamtwert um mehr als 20 Prozentpunkte überschreitet oder bei nennenswerter Gesamtbewölkung alle drei Schichten praktisch null sind.

Für trockene Wettercodes wird „klar“ nur noch verwendet, wenn die Bewölkung auch auf der gerundeten Okta-Skala 0/8 entspricht. Damit wird beispielsweise eine Gesamtbewölkung um 12 % nicht mehr als vollständig wolkenlos bezeichnet.

## Redesign

Der 24-h-Profilblock bleibt vollständig stündlich und behält alle fachlichen Spuren. Die visuelle Hierarchie wird weiter beruhigt; Tooltips, Einzeldaten und Bottom-Bar-Safe-Area bleiben vollständig lesbar. Meteogramm, Warnungen, Wasser/Tide und „Mehr“ folgen dem in Replit vollständig geprüften MID-18.2-Shell-/Responsive-Vertrag.


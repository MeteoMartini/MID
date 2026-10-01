# MID v0.9.85.131

## Aktuell · Radar-Nowcast
- Die Radar-Nowcast-Auswertung startet früher und verwendet für die erste Echoentscheidung einen schlanken DWD-Rasterpfad; die vollständige 5-Minuten-Punktserie wird unmittelbar danach nachgeladen.
- Die Grafik erscheint weiterhin nur, wenn am Standort oder im relevanten Umfeld ein Niederschlagsecho erkannt wird.
- Regelmäßige scheinbare „Trockenphasen“ aus der ausgedünnten Schnellserie werden nicht mehr als 0-Niederschlag dargestellt. Eine unvollständige Schnellserie wird transparent als noch zu vervollständigende 5-Minuten-Auswertung behandelt.
- Echte trockene 5-Minuten-Abschnitte bleiben sichtbar, wenn der vollständige DWD-Punktpfad für den jeweiligen Zeitschritt tatsächlich kein relevantes Echo liefert.

## Wetterkarten
- Der MID-C11-Handoff vereinheitlicht und verdichtet die Zeitsteuerung in den Kartenansichten.
- Ausgewählte Zeitpunkte und Navigationskontrollen bleiben auf Smartphone, Tablet und Desktop klarer lesbar und beanspruchen weniger Kartenfläche.

## Fachlichkeit und Leistung
- DWD-Radarquelle, saisonale Echoprofile und bestehende Niederschlagsschwellen bleiben unverändert.
- Kurzer Radar-Kurzcache, früherer Preload und größere parallele Pakete für die exakten 5-Minuten-Punktwerte reduzieren unnötige Wiederholungs- und Wartezeiten.

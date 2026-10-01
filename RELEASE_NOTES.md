# MID v0.9.85.138

## Radarintensität, konsistente Niederschlagsstufen und UTCI appweit

- Die 5-Minuten-Balken des Radar-Nowcasts folgen jetzt der tatsächlichen DWD-RV-Intensität des jeweiligen Zeitschritts. Unterschiedlich starker Niederschlag wird deshalb wieder durch unterschiedlich hohe Balken sichtbar; Datenlücken bleiben ausdrücklich schraffiert und werden nicht als trocken interpretiert.
- Die Radar-y-Achse zeigt Maximum, halbe Skala und Null gleichmäßig am selben Raster wie die Balken. Die Einheit bleibt fachlich eindeutig mm/5 min.
- Niederschlagsangaben verwenden appweit dieselbe zentrale WMO-/DWD-basierte Intensitätsklassifikation. Angezeigte Rate und Textstufe stammen aus demselben Intervall; 1,9 mm/h Dauerregen wird beispielsweise als „mäßig“ eingeordnet.
- UTCI (Universal Thermal Climate Index) ist nun der kanonische Index für die gefühlte Außentemperatur in Aktuell, Kurzfrist, 24-h-Profil/Cockpit, Event- und Wassersportansichten sowie Bergwetter. Temperatur, Feuchte, Wind und Strahlungseinfluss werden gemeinsam berücksichtigt; die sichtbaren Belastungsstufen folgen den Standard-UTCI-Klassen.
- Wo keine direkte mittlere Strahlungstemperatur verfügbar ist, schätzt MID sie transparent aus Tageszeit, Bewölkung, UVI und Höhe. Unbrauchbare Eingangsdaten erzeugen keinen erfundenen UTCI-Wert.

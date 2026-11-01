# MID v0.9.85.397 – Extremwetter-Datenlücken nicht mehr als Nullwerte anzeigen

- Fehlende Extremwetter- und RUC-/EPS-Modellkennwerte werden als „nicht verfügbar“ statt etwa als 0 mm, 0 cm, 0 km/h oder 0 J/kg angezeigt. Echte Nullwerte bleiben erhalten.
- Die Menge von Niederschlag und Neuschnee wird nur mit einem Zeitfenster bezeichnet, wenn die Akkumulationsdauer tatsächlich bekannt ist. Auch fehlende Geländehöhen und Geländearten bleiben als Datenlücke sichtbar.
- Wettermodelle, vorhergesagte Gefahrenwahrscheinlichkeiten, DWD-Warnungen, Wetterkarten und bestehende Nutzerfunktionen bleiben unverändert.

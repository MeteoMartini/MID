# MID v0.9.18.7

## Schwerpunkt
Korrektur des 24-h-Kurzfrist-Meteogramms im Forecast-Cockpit, damit Datum/Zeitachse, Wetterpiktogramme und meteorologische Windfiedern sich bei responsiver Darstellung exakt mit dem Diagramm skalieren und deutlich näher an der Referenzvorlage liegen.

## Umgesetzt
- Prozentuale Positionierung aller Meteogramm-Overlays statt pixelbasierter Positionen.
- Prozentuale Hitlayer-Breiten und -Offsets, damit Auswahlspalten exakt über den Stundenfeldern liegen.
- Hauptzeitachse auf 6-Stunden-Markierungen (00/06/12/18 Uhr) verdichtet, bei unverändert stündlicher Datenbasis und stündlichen Rasterlinien.
- Meteorologische Windfiedern entlang der unteren Windreihe mit korrekter responsiver Ausrichtung beibehalten.
- Neue Regression für Overlay-Skalierung und Hauptzeitachse ergänzt.

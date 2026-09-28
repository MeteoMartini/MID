# MID v0.9.15.2

## Temperaturdarstellung

Die ECMWF-orientierte 2-m-Temperaturfarbskala bleibt erhalten, wird in der klassischen Stundenübersicht jedoch nur noch als schwache transparente Tönung mit dezenter Kontur verwendet. Die Temperaturfelder sind schmaler, niedriger und typografisch kompakter.

## Ensemble-Tooltip Desktop

Nach einem Außenklick blieb der Tooltip-Zustand bisher unterdrückt, bis im Diagramm geklickt wurde. Auf Geräten mit Maus und echtem Hover wird diese Unterdrückung jetzt bereits beim erneuten Betreten oder Bewegen über dem Diagramm aufgehoben. Zusätzlich ist die Recharts-Tooltip-Ebene am Desktop nicht mehr pointer-aktiv, sodass sie den Hover-Zustand des Diagramms nicht unterbrechen kann. Mobile Klick-/Touch-Tooltips bleiben interaktiv und schließbar.

## Regression

Ein neuer Vertrag prüft die dezente Farbtransparenz, die kompakte Feldbreite, die Desktop-Hover-Reaktivierung für Temperatur, Niederschlag und Wind sowie die getrennte Pointer-Event-Behandlung von Desktop und Touch.

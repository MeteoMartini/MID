# MID v0.9.18.1

## Schwerpunkt
Kurzfrist-Meteogramm bereinigt und die 24-h-Leiste weiter verdichtet.

## Änderungen
- Buildfix: den nach dem UI-Umbau ungenutzten Helfer `shortTermVisibilityText` entfernt; damit ist TS6133 im GitHub-Produktionsbuild beseitigt.
- Überlagernden Detailtext direkt im Meteogramm entfernt; das Diagramm bleibt nun frei von störendem Text im Bereich der Temperaturkurve.
- Das zusätzliche Detailfeld zwischen Legende und 24-h-Leiste entfernt.
- Das verbleibende Datenfeld unterhalb des Diagramms neu strukturiert:
  - Temperatur- und Begleitwerte ganzzahlig dargestellt
  - Windzeile kompakter als Richtung + Mittelwind + Böenspitze, z. B. `SW 4 kt, G15 kt`
  - letzte Zeile jetzt `Luftdruck` statt `Böen`
- 24-h-Leiste visuell weiter abgeflacht und kompakter gestaltet (kleinere Chips, reduzierte Abstände, verdichtete Wetter-/Winddarstellung).

## Technische Umsetzung
- `src/ForecastCockpit.tsx`
  - Desktop-Overlay des Meteogramms entfernt
  - Detaildaten als separates `cockpit-meteogram-pro__datafield` direkt unter dem Diagramm gerendert
  - redundante Fokuskarte unterhalb der Legende entfernt
  - kompaktere Wind-/Böenanzeige in Datenfeld und 24-h-Leiste
- `src/styles.css`
  - neues Styling für `cockpit-meteogram-pro__datafield`
  - weitere Verdichtung der `cockpit-hourly-chip`-Darstellung
  - mobile 24-h-Karten noch flacher und platzsparender angeordnet
- Regressionstests angepasst auf v0.9.18.1 und das neue Datenfeldlayout.

## Hinweise
- In der CAAS-Umgebung wurden die dateibasierten Ziel-Regressionen ausgeführt. Ein vollständiger npm-Build war mangels installierter Abhängigkeiten lokal nicht möglich.

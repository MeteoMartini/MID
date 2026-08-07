# MID v0.9.23.0

## Schwerpunkt
Feinschliff des DWD-Niederschlagsarten-Radars, Bereinigung des Kurzfrist-Cockpits und Ausbau des Wetterkarten-Moduls.

## Enthaltene Änderungen
- **DWD Niederschlagsarten-Radar**
  - Neu konzipierte Standortverortung auf Basis kalibrierter Bildgrenzen statt der bisherigen fehleranfälligen Projektion.
  - Echter, auf die Viewport-Geometrie angepasster Crop-Ausschnitt; auf größeren Displays wird automatisch ein größerer Bildausschnitt gezeigt.
  - Bildpunkt-Auswertung jetzt **platzsparend direkt oberhalb** des Bildes statt als Overlay-Popup.
  - Kompakte Anzeige für **Radar-/Niederschlagsart** und **Satellit/Wolken** Zeitstände.
  - Marker bleibt separat ein-/ausblendbar; Legende weiterhin hinter dem **(i)**.
- **24-h-Meteogramm / Detaildiagramme**
  - Breitenberechnung robuster an die reale Containerbreite gekoppelt, damit Achsen und Diagramm in allen Ansichten sauber zusammenlaufen.
- **Kurzfrist-Cockpit**
  - Abschnitt **„Kurzfristkompass“** entfernt.
  - Spotlight-Kacheln bleiben erhalten (wärmster/kühlster Zeitpunkt, Windhöhepunkt, Niederschlagsspitze).
- **Wetterkarten**
  - **ICON-D2** als zusätzlicher Modellblock integriert.
  - Metadatenblock ergänzt um **INIT** und **Gültig**.
  - **Signifikantes Wetter** klar verfügbar/benannt.
  - Layout der Metadaten auf vier Felder erweitert.

## Technischer Hinweis
Für diese Version ist ein **Worker-Upload erforderlich**, da sowohl die Worker-Version als auch die Wetterkarten-Layerkonfiguration erweitert wurden.

# MID 0.9.66.2 – sichtbare Gefahrenflächen im DACH-Extremwetter-Ausblick

## Befund

Die Extremwetterdaten und Schwellenfilter arbeiteten korrekt: Die Oberfläche meldete betroffene Rasterfelder und zeigte deren Intensitäts-/Prozentmarker. Auf der mobilen DACH-Übersicht hatten die Marker jedoch annähernd dieselbe Bildschirmfläche wie die einzelnen 55–90-km-Rasterzellen und verdeckten dadurch die darunterliegende Füllung weitgehend. Zudem besaß die Karte keinen vom MapLibre-Vektorfülllayer unabhängigen Darstellungsweg.

## Umsetzung

- `ExtremeOutlookAreaOverlay` und die separat ausführbar geprüfte Canvas-Engine rendern jedes sichtbare Gefahrenfeld als georeferenziertes Polygon direkt aus Rasterzentrum, Breiten-/Längenschritt und der aktuell gewählten Gefahr/Periode.
- Farbe bleibt strikt an I1–I4 gekoppelt; die Deckkraft bleibt strikt aus der bestehenden Wahrscheinlichkeitsfunktion abgeleitet. Eine farbgleiche Kontur grenzt die Regionalfelder sichtbar ab.
- Das Canvas wird in gerätegerechter Pixeldichte gezeichnet und bei Kartenbewegung, Zoom, Resize sowie laufender MapLibre-Darstellung neu projiziert.
- Der MapLibre-GeoJSON-Layer bleibt als praktisch unsichtbare Interaktionsfläche für Desktop-Popups erhalten. Er ist nicht mehr für die sichtbare Flächenfüllung verantwortlich.
- Kartenmarker verwenden nur noch die sechs stärksten regionalen Maxima statt bis zu 28 Einzelzellen. Die Karte zeigt weiterhin sämtliche Schwellenfelder; die vollständigen acht stärksten Regionen bleiben in der Rangliste verfügbar.

## Funktionsschutz

DACH-Abdeckung, 117-Punkte-Analyseraster, Prognoseperioden, P-/I-Schwellen, Mehrparameter-Gewitterdiagnostik, Regen-/Wind-/Schnee-/Eisregenlogik, Datenquellen, Cache, Lokal-/Z-Zeit und appweite Einheiten bleiben unverändert. Der Worker erhält ausschließlich die gekoppelte Versionsnummer 0.9.66.2; seine meteorologische Fachlogik ändert sich nicht.

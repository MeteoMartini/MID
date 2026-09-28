# MID v0.9.30.0

## Wolken + Niederschlagsart: zweite Quellenrevision

- **Radarbild repariert:** Für die sichtbare Karte wird jetzt der vom DWD ausdrücklich für Anwendungen empfohlene stabile WMS-Alias `dwd:Niederschlagsradar` verwendet. Er liefert den aktuell nutzerfreundlichsten Radarstand (derzeit RV). Die explizite RV-Zeitdimension wird nur für den sichtbaren Zeitstempel ausgewertet; am Alias wird kein anfälliger TIME-Parameter mehr erzwungen.
- **Radar deutlich sichtbar:** Radar liegt als eigener Layer über dem Satellitenbild und wird deutlich höher deckend dargestellt.
- **Keine falschen Niederschlagsklassen:** RainViewer wird im DWD-Komposit nicht mehr als Niederschlagsart eingeblendet. Die DWD-HymecNG-Klassen erscheinen nur bei einem frischen und verifiziert decodierten HymecNG-Datensatz. Ist der öffentliche HymecNG-Feed veraltet oder die Codetabelle nicht verifiziert, zeigt MID keine erfundenen Hagel-/Graupel-/Gefrierklassen.
- **DWD-nähere Satellitenpriorität:** bevorzugt `Satellite_meteosat_1km_euat_rgb_clouds_day_and_night`; danach der offiziell dokumentierte offene 3-h-Meteosat-RGB/IR-Layer, DWD RGB und erst anschließend EUMETSAT-Fallbacks.
- **DWD-nähere Basiskarte:** amtliche `basemap.de Web Raster Farbe` wird mit `ColorDEM` und dezenter `Combshade` aus der amtlichen BKG-Schummerung kombiniert. Dadurch entsteht ein farbiger, orographischer Kartenuntergrund mit amtlichen Grenzen/Beschriftungen statt der bisherigen generischen TopPlusOpen-Anmutung.
- Radar-, Satelliten- und Niederschlagsart-Zeitstände bleiben getrennt und werden nur für die tatsächlich aktiven Quellen angezeigt.
- Standortmarker bleibt WGS84-direkt georeferenziert.

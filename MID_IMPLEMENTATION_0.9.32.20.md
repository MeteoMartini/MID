# MID v0.9.32.20

## Kompositbild – Satellitenfrische und Zoom-Konsistenz

- EUMETSAT EUMETView (`view.eumetsat.int/geoserver/wms`) ist weiterhin der direkte Upstream für MTG-FCI GeoColour. Der MID-Worker dient nur als CORS-/Allowlist-/Fehlerproxy.
- Die RGB-Produktauswahl ist recency-first: Bei verfügbaren exakten Zeitdimensionen gewinnt zuerst der jüngste valide Satellitenzeitpunkt, danach Produktpriorität/Auflösung.
- Der Freshness-Grenzwert für nominell aktuelle Satellitenprodukte wurde von 80 auf 35 Minuten verschärft.
- Bei `latestOnly` wird kein möglicherweise veralteter Capabilities-Zeitstempel mehr als `TIME` erzwungen. EUMETView liefert ohne `TIME` den jeweils aktuellen Dienststand.
- Raster-Zoom-Lifecycle wiederhergestellt: `zoomstart` entfernt WMS-Raster, `zoomend` erhöht `tileRevision` und baut alle Raster mit neuen URLs vollständig neu auf.
- Satelliten-WMS verwendet `keepBuffer=0` und `updateWhenZooming=false`, damit keine Kachel einer alten Zoomstufe sichtbar bleiben kann.
- Schutzregression: `test-composite-satellite-freshness-zoom-093220.mjs`.

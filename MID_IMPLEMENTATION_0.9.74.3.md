# MID Implementation v0.9.74.3

## Anlass

Im Kompositbild wurden bei der gespeicherten Kartenbasis `Schlicht hell · CARTO Positron` großflächig die CARTO-Wasserzeichen `API KEY REQUIRED` eingeblendet. Das ist derselbe externe Basemap-Vertragsbruch, der zuvor bereits in der Extremwetterkarte aufgetreten war. Die Wetterdaten-, Radar-, RUC- und Overlay-Layer selbst waren nicht betroffen.

## Umsetzung

- Alle produktiven anonymen `basemaps.cartocdn.com`-Rasterpfade aus Kompositbild, Wetterkarten und Synoptikkarte entfernt.
- OpenStreetMap bleibt als schlüsselfreie globale Rasterbasis erhalten.
- Die persistierten Basemap-IDs `osm`, `positron` und `dark` bleiben kompatibel. `positron` und `dark` verwenden dieselben OSM-Kacheln, werden aber ausschließlich lokal im MapLibre-Raster-Layer über `raster-saturation`, `raster-contrast`, `raster-brightness-min` und `raster-brightness-max` visuell als helle bzw. dunklere Variante aufbereitet.
- Basis- und Orientierungslayer des Kompositbilds erhalten dieselbe lokale Tönung, sodass Radar/Satellit/Blitze/Modelllinien unverändert darüberliegen und keine API-Key-Abhängigkeit zurückkehrt.
- Wetterkarten und Synoptikkarte folgen demselben appweiten schlüsselfreien Basemap-Vertrag.
- Neue Required Regression `scripts/test-keyless-basemap-contract-09743.mjs` verbietet CARTO-Rasterpfade in den betroffenen produktiven Modulen und schützt OSM + Raster-Tone-Weitergabe.

## Nicht geändert

Keine Änderung an Radar-/Satelliten-/Blitzdaten, DWD-WMS, Warnungen, Forecast-Fusion, RUC/RUC-EPS, Pages-Free-Speicher, Worker-Runtime oder iOS-Nativfähigkeiten. Kein API-Key, kein neues Konto, keine kostenpflichtige Infrastruktur und kein manueller Worker-Upload erforderlich.

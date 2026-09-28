# MID v0.9.39.3 – TypeScript-Buildfix MapLibre / Niederschlagsfenster

## Anlass

Der GitHub-Produktionsbuild von v0.9.39.2 meldete drei zusammenhängende TypeScript-Probleme: einen zu breit typisierten dynamischen MapLibre-Layer, den nicht exportierten Typ `maplibregl.Anchor` sowie einen `MemberDay` ohne das in v0.9.39.2 verpflichtend gewordene Feld `precipitationWindows`.

## MapLibre

`GeoJsonLayers` verengt die dynamische Layerdefinition vor `Map.addLayer()` auf `maplibregl.AddLayerObject`. `HtmlMarker` verwendet `maplibregl.PositionAnchor`, passend zum MapLibre-5.24-Typvertrag.

## Niederschlagswahrscheinlichkeit

Der Ensemble-Mean/Spread-Fallback führt jetzt wie die regulären Ensemble-Member vier 6-Stunden-Summen. Die Stunden werden anhand der lokalen Open-Meteo-Zeitstempel den Fenstern 00–06, 06–12, 12–18 und 18–24 Uhr zugeordnet. Nur Fenster mit mindestens fünf Stundenwerten gelten als auswertbar. Dadurch bleibt die DWD-nahe >0,2/>5-mm-Ereignislogik auch im Mean/Spread-Fallback vollständig erhalten.

## Regression

`scripts/test-maplibre-precip-buildfix-09393.mjs` schützt die MapLibre-Typnamen, die diskriminierte Layerübergabe und die vollständigen Niederschlagsfenster im Mean/Spread-Fallback.

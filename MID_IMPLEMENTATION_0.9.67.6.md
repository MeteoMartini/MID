# MID v0.9.67.6 – Release-Regressionshotfix

## Ausgangslage
Der v0.9.67.5-Produktionsbuild mit MapLibre GL JS 6.5.0 und dem Canvas-basierten Extremflächenrenderer kompilierte erfolgreich. Im vollständigen Release-Regressionlauf scheiterten jedoch zwei Schutztests.

## Korrekturen
1. `extremeOutlookAreaGeoJson.ts` bleibt absichtlich im Quellbaum als GeoJSON-/Regressionhelfer, ist aber seit dem v0.9.67.5-Flächenhotfix nicht Teil des aktiven Runtime-Importgraphen. Der Performancevertrag führt ihn deshalb ausdrücklich unter den bewusst dormanten Modulen.
2. `scripts/sync-version.mjs` synchronisiert nun `MID_IOS_STATUS.json.releaseVersion` mit der Web-/Releaseversion. Der echte native Capacitor-Sync bleibt separat in `validation.capacitorSync` dokumentiert und wird nicht künstlich als durchgeführt markiert.

## Unverändert
- Sichtbare DACH-Extremflächen: georeferenzierter Canvas-Konturrenderer.
- MapLibre GL JS 6.5.0, Lucide React 1.34.0 und der freigegebene Actions-/CodeQL-Stand.
- Meteorologische Kontur-, Hazard-, Marker-, Popup- und Regionenlogik.
- Native iOS-Webkopie wird erst durch einen echten `npm run ios:sync` aktualisiert.

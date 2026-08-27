# MID v0.9.67.5 – MapLibre-6-Extremflächen-Hotfix

## Fehlerbild
Nach dem Wechsel auf MapLibre GL JS 6.5.0 blieben Marker, Popups und „Stärkste Regionen“ vorhanden, die sichtbaren modellierten Gefahrenflächen jedoch unsichtbar. Damit war die Kontur-/Hazard-Datenbasis intakt; betroffen war ausschließlich der native Fill-/Pattern-Renderpfad.

## Korrektur
`ExtremeOutlookAreaOverlay` verwendet für die sichtbare Flächenebene wieder den vorhandenen georeferenzierten `CanvasOverlay` mit `drawExtremeOutlookContours`. Die Konturen stammen unverändert aus `buildExtremeOutlookContourSet`. MapLibre 6.5.0 bleibt aktiv und übernimmt weiterhin Basiskarte, Kamera/Touch, Marker und die unsichtbaren GeoJSON-Hit-Flächen.

## Regression
Der Flächenrendering-Vertrag prüft wieder explizit den Canvas-Konturpfad. Marker/Popups und die Regionenliste bleiben an denselben Kontursatz gekoppelt. Wetterlogik und Worker-Daten bleiben unverändert.

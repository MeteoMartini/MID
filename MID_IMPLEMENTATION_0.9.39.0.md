# MID v0.9.39.0

Ausgangsbasis: v0.9.38.6 / `mid-stable`.

## Kartenengine

MID verwendet app-weit MapLibre GL JS 5.24.0. Leaflet, React-Leaflet und `@types/leaflet` wurden aus Runtime-/Dev-Abhängigkeiten entfernt. `MapLibreCore.tsx` stellt gemeinsame Raster-/WMS-, GeoJSON-, Marker-, Image-Quad- und projektionstreue Canvas-Pfade bereit. Die bisher fachlich genutzten Pane-Prioritäten werden auf deterministische MapLibre-Layer-z-Indizes übertragen.

## Niederschlagswahrscheinlichkeit

Für Tageskarten wird bei verfügbarer Ensembleauswertung die bereits aus den einzelnen Ensemble-Mitgliedern berechnete modellgewichtete Wahrscheinlichkeit `Tagesniederschlag >= 0,1 mm` verwendet. Nur wenn hierfür keine belastbare Ensembleauswertung vorliegt, bleibt das Open-Meteo-Feld `precipitation_probability_max` als explizit gekennzeichneter Fallback aktiv. Stunden- und 15-Minuten-Produkte werden nicht auf Tageswahrscheinlichkeiten umdefiniert.

## Niederschlagsart im Kompositbild

1. Frisches, verifiziertes DWD HymecNG hat Vorrang.
2. Ist HymecNG nicht nutzbar, liefert OPERA CIRRUS DBZH die beobachtete Echomaske.
3. ICON-D2 klassifiziert nur innerhalb dieser Echos die thermodynamisch plausible Phase aus Wettercode, Schneefall, 2-m-Temperatur/Feuchte und Feuchtkugeltemperatur.
4. OPERA-Frame und ICON-D2-Zeitschritt müssen zeitlich nah am gewählten Radarbild liegen; andernfalls bleibt die Phasendarstellung aus.

Damit werden keine Schnee-/Regenflächen allein aus einem Modell außerhalb beobachteter Radarechos erzeugt.

## Worker

`weather-map-grid` liefert die zusätzlichen bodennahen Phasenparameter. Daher ist für v0.9.39.0 ein Worker-Upload erforderlich.

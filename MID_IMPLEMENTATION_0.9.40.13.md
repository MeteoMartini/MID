# MID v0.9.40.13

## Kompositbild / Satellitenzeit
- Untimestamped DWD-WMS-Snapshots werden nicht mehr mit der aktuellen Abfragezeit beschriftet.
- Der Worker liest den jüngsten plausiblen DWD-Satellitenquellzeitpunkt aus dem OpenData-Index und führt ihn als `latestTime`/`sourceSatelliteTime` mit.
- Keine künstliche 3-h-Abrundung des Quellzeitpunkts.

## Radarfarben
- Benutzerwählbare Radar-Farbtabellen entfernt.
- DWD-1-km-WMS verwendet den nativen Standardstil; PX/HX und OPERA verwenden eine feste Standardpalette.

## Appweite Zeitbasis
- Neue persistente Option `Lokalzeit` / `Z-Zeit (UTC)`, Standard `Lokalzeit`.
- Zentrale Zeitformatierung für Wetter-, Radar-, Warn-, Diagramm-, Meteogramm-, Wasser-/Berg- und technische Zeitangaben.
- Ausnahme: Ortszeit im Standortkopf bleibt immer lokal.

## Niederschlagsart-Symboloverlay
- Keine flächige Phasenfärbung mehr.
- OPERA-Echomaske + aktuelles Rapid-/Regionalmodell klassifizieren ausschließlich feste/gemischte Phasen für kleine Symbole: 🌨️ Mischphase, ❄️ Schnee, 🧊 gefrierender Niederschlag.
- Reiner flüssiger Niederschlag bleibt ausschließlich im normalen Radar sichtbar.
- Symboloverlay liegt über dem jeweils ausgewählten 1-km- oder 250-m-Radar; Deckkraft wird über den bestehenden Niederschlagsart-Regler gesteuert.

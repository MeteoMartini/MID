# MID v0.9.85.134

## Gemeinsamer Kartenbereich und echte DWD-Niederschlagssummen

- „Karte“ bündelt Radar/Satellit/Blitz, Modellkarten und Niederschlagssummen. Bestehende Wetterkarten-Einstiege öffnen weiterhin die Modellkarten; Radartimeline und Echo-/ETA-Markierungen bleiben erhalten.
- Direkte kostenfreie DWD-ICON-D2-TOT_PREC-Raster für 6/12/24/48 Stunden ab Laufstart, geprüft auf denselben Lauf, Einheiten, Rasterabdeckung und akkumulierte Endfelder. Keine Verlängerung der 14-Stunden-RUC-Daten.
- Deutschlandausschnitt, einheitliche mm-Farbskala, Favoritenwerte am nächsten DWD-Rasterpunkt, Kartenmaximum und tatsächlicher Gültigkeitszeitraum. PNG-/SVG-Download mit Legende, Favoriten, Quellen- und Lizenzangaben; auf unterstützten Mobilgeräten als Datei teilbar.
- Der vorhandene kostenlose DWD-/Pages-Prozess veröffentlicht die zusätzlichen Raster als geprüfte unveränderliche Objekte; App-Releases erhalten sie über den bestehenden Snapshot-Restore.
- Veraltete, unvollständige oder fehlende Raster werden nicht angezeigt oder exportiert. Die zusätzliche Karte wird erst nach erfolgreicher DWD-Aufbereitung freigegeben.
- Redundante Standort-Kartenbox entfernt. Die Änderungen und Zeitsteuerungen der veröffentlichten v0.9.85.131–.133 bleiben erhalten.

## Quellen und Kosten

DWD Open Data (CC BY 4.0), OpenStreetMap (ODbL 1.0), Natural Earth (Public Domain). Kein kostenpflichtiger Kartenanbieter, kein zusätzlicher API-Key und keine Bright-Sky-Abhängigkeit. Bright Sky ist eine kostenlose DWD-API, ersetzt jedoch keine vollständige ICON-D2-GRIB-Rasterschnittstelle; unbegrenzte Verfügbarkeit wird nicht zugesichert.

# MID v0.8.31.0

## Performance- und Stabilitätskorrekturen

- Einstellungs- und Favoritenfenster öffnen zunächst sofort als leichte Dialoghülle; der jeweilige Inhalt wird erst nach zwei Browser-Frames eingeblendet. Dadurch blockiert die umfangreiche Einstellungsstruktur nicht mehr den ersten Klick.
- Einstellungsbereiche werden beim Wechsel ebenfalls kontrolliert nachgeladen.
- Schwere Dashboard-Module werden nicht mehr bereits bei einer flüchtigen Intersection während schnellen Scrollens montiert. Die Aktivierung erfolgt erst nach stabiler Sichtbarkeit und in einer Idle-Phase.
- Der Standard-Vorladebereich der Viewport-Gates wurde reduziert.
- `content-visibility:auto` wurde für die betroffenen Dashboard- und Ensemblebereiche deaktiviert, da diese Kombination mit großen SVGs, Karten und iOS-WebKit instabil sein kann.
- Während schnellen Scrollens werden teure Schatten sowie Pointer-Interaktionen auf Karte und Ensemblegrafiken temporär reduziert.
- Scroll- und Overlaypfade verwenden begrenzte Layout-Container und kontrolliertes Overscroll-Verhalten.

## Daten- und Kartenstrategie

Siehe Antwort im Projektchat: priorisierte Einbindung direkter DWD-HDF5-Radarprodukte, MOSMIX, ECMWF IFS/AIFS, EUMETSAT/OPERA sowie selbst gehosteter Protomaps-PMTiles als langfristig geeignete offene Kartenbasis.

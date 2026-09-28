# MID 0.9.84.57

## Installer #1012
Der Installer erreichte nach erfolgreichem `npm ci` und Dependency-Audit den TypeScript-7-Check und stoppte dort mit `TS1005: ',' expected` in `src/RadarPanel.tsx` innerhalb der neu eingebundenen Frontensymbolik.

Ursache war die zu stark verdichtete TSX-Einzeilenkonstruktion in `compositeFrontSymbols()`. Der Block ist nun strukturiert aufgebaut: Geometrie, Variantenwahl, `L.divIcon()` und `<Marker />` sind getrennte Ausdrücke. Die meteorologische Synoptiklogik aus v0.9.84.56 wurde nicht verändert.

# MID v0.9.58.2 – MapLibre/Komposit TypeScript-Hardening

Der lange Zeitpfeil koppelt seine Achsenlänge an den sichtbaren Kartenausschnitt. Dafür werden die Südwest-/Nordost-Ecken des Kartenbounds benötigt. Der MapLibre-Legacy-Adapter kannte die Grenzen intern, exponierte im `CompatBounds`-Typ jedoch nur `contains` und `pad`. `RadarPanel.tsx` scheiterte deshalb im echten TypeScript-Check mit TS2339.

`CompatBounds` bietet nun zusätzlich `getSouthWest()` und `getNorthEast()`; `boundsAdapter()` liefert diese Werte aus den vorhandenen west/south/east/north-Grenzen. Darstellung und meteorologische Bewegungslogik bleiben unverändert.

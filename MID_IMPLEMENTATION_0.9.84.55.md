# MID 0.9.84.55

## Installer #1010
Node 22, TypeScript 7.0.2 und Vite 8.2.2 waren im Installer erfolgreich. Drei von 747 Regressionen waren veraltet oder folgebetroffen: der CAVOK-Wortlaut, eine zu breite statische Radar-Nowcast-Verbotsprüfung und der alte Schattenvertrag des hellen Widget-Windpfeils. Die Produktlogik musste dafür nicht zurückgerollt werden.

## Synoptik · 500-hPa-Isohypsen
Der Screenshot zeigte ein 576-gpdm-Label, aber keine ausreichend sichtbare zugehörige Kontur. Damit war klar, dass der Grid-/Labelpfad Daten lieferte und die Schwäche im Render-/Kontrastvertrag lag. Isohypsen nutzen nun im automatischen Modus eine eigenständige amber/gold Palette mit dunklem Halo. Hauptkonturen sind durchgezogen, Zwischenkonturen gestrichelt. Die Leaflet-Pane wird neben der historischen MapLibre-Klasse explizit geschützt.

Der neue Regressionstest verlangt echte Polyline-Konturen, Grid-Frame-Bindung, Palette, Pane und Major/Minor-Linienstile; ein allein sichtbares Geopotential-Label genügt nicht mehr.

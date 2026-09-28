# MID v0.9.37.2 · Komposit-Niederschlagsart

## Entscheidung
Der bisherige Komposit-Layer „Niederschlagsart“ wird ersatzlos aus der aktiven Karte entfernt.

## Warum
Der Layer war kein echtes Radarraster. Er nutzte den Worker-Modus `dwd-precipitation-type-image`, also das kombinierte DWD-Webbild „Wolken + Niederschlagsart“, und legte dieses Bild mit festen Deutschland-Bounds als `ImageOverlay` über die Leaflet-Karte. Das ist keine belastbare native Georeferenzierung.

DWD WN ist außerdem kein Niederschlagsartenprodukt, sondern ein Reflektivitätskomposit. Das aktuelle maschinenlesbare DWD-Produkt für die Niederschlagsart/Hydrometeorklasse in 2 m Höhe ist HymecNG im HDF5-Format.

## HymecNG-Gate
MID besitzt bereits einen vorbereiteten HymecNG-HDF5-Pfad. Er bleibt aber bewusst außerhalb des aktiven Bundles, bis beide Bedingungen anhand aktueller DWD-Dateien verifiziert sind:

1. native ODIM-Projektion/Geometrie wird vollständig aus der Datei gelesen und für den tatsächlich gelieferten Projektionstyp korrekt gerendert;
2. die numerische HDF5-Klassencodierung ist anhand einer amtlichen/verifizierten Codetabelle eindeutig den Hydrometeorklassen zugeordnet.

Es gibt keine Schätzung anhand der Reihenfolge von Legendenklassen und keinen Rückfall auf historische Kugelkoordinaten.

## Georeferenzierungs-Härtung
`HymecNgSource.ts` akzeptiert keine fehlende Projektionsdefinition mehr. Der frühere implizite stereografische Kugel-Fallback mit Radius 6 370 040 m wurde entfernt. Das ist wichtig, weil die betroffenen DWD-Radarkomposite bereits 2022 hart auf WGS84 umgestellt wurden.

## Unverändert
Die separat aktivierbare Darstellung „DWD Niederschlagsarten-Radar“ unter der Kurzfristansicht bleibt bestehen. Sie zeigt ausdrücklich das DWD-Originalbild „Wolken + Niederschlagsart“ und wird nicht als georeferenziertes Komposit-Radarlayer ausgegeben.

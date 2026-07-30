## MID v0.8.25.0 umgesetzt

**Automatische Versionsbewertung:** neue Funktionsversion ab **v0.8.24.2**, weil das Kompositbild um eine amtliche Warnkartenebene und serverseitig gerenderte DWD-Modelllayer erweitert wird. Gleichzeitig wurden mehrere Daten- und Darstellungsfehler in OPERA, Blitz- und KONRAD3D-Ebenen behoben.

### Umsetzung

1. **OPERA CIRRUS**
   - Reales HDF5-Raster wird weiterhin vor Verwendung geprüft.
   - Ein lokaler trockener oder NoData-Pixel verwirft nicht mehr das vollständige europäische Kartenraster.
   - Mobile Rasterreprojektion arbeitet mit reduzierter, anschließend weich skalierter Arbeitsauflösung.

2. **Amtliche Warnkarte**
   - Neuer optionaler Layer `dwd:Warnungen_Gemeinden_vereinigt`.
   - Eigene Ein-/Aus-Schaltfläche und Deckkraftsteuerung.
   - Außerhalb Deutschlands automatisch deaktiviert.

3. **Isobaren und Isohypsen**
   - Primär serverseitig gerenderte DWD-ICON-WMS-Produkte für Bodendruck und 500-hPa-Geopotential.
   - Lokale MID-Konturerzeugung nur noch als automatischer Ausfallfallback.

4. **Blitze**
   - DWD-Blitzdichte und MTG-LI werden auch ohne explizite Zeitdimension als aktueller WMS-Stand angezeigt.
   - NowCastMIX-Objekte unterdrücken das eigentliche Blitzraster nicht mehr.

5. **KONRAD3D / NowCastMIX**
   - Zuglinie und Unsicherheitskegel verwenden den zeitlich weitesten belastbaren K3D-Prognosepunkt.
   - Bei fehlender Prognosekoordinate kann aus Zellrichtung und Geschwindigkeit ein 30-Minuten-Zugpfad erzeugt werden.

6. **Kurzfrist-Windpfeile**
   - DWD-Warnschwellen 50/65/90/105/120/140 km/h werden auf Basis der Böe geprüft.
   - Pfeilkontur erhält die Farbe der höchsten erreichten Warnstufe.

### Worker

**Funktionaler Worker-Upload erforderlich**, da zusätzliche DWD-WMS-Layer freigegeben und KONRAD3D-Zugfelder erweitert wurden.

## MID v0.8.25.1 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.25.0**, da bestehende Komposit-Layer fachlich, visuell und technisch stabilisiert wurden, ohne ein neues Hauptmodul einzuführen.

### Umgesetzte Punkte

1. **Standortmarker**
   - Die Blickrichtungsspitze wird nur bei einem tatsächlich per Geräteortung geöffneten Standort angezeigt.
   - Gesuchte Orte und Favoriten erhalten einen neutralen Ortsmarker ohne Richtungsspitze.

2. **Isobaren und Isohypsen**
   - MID lädt die Modellkonturen nun unabhängig vom WMS-Fehlerstatus.
   - Konturpfade werden bereinigt und mit mehreren Chaikin-Durchläufen geglättet.
   - Isohypsen werden stärker geglättet als Isobaren.
   - Der DWD-ICON-WMS bleibt als schneller Lade- und Ausfallfallback erhalten.

3. **Radar 250 m**
   - redundante DWD-Open-Data-Endpunkte
   - erweitertes, weiterhin begrenztes Aktualitätsfenster
   - robuste Suche in mehreren ODIM-HDF5-Datensätzen
   - korrigierte PROJ-Parameterauswertung
   - sicherer Canvas-/PNG-Fallback
   - der neueste PX250-/HX-Einzelstand bleibt bei aktivierter Ebene sichtbar und wird nicht durch die Kompositzeitachse ausgeblendet

4. **Blitze**
   - eigene Kartenebene oberhalb der Rasterprodukte
   - gefüllte, kontrastreiche Marker mit Halo
   - Mindestgröße für sichere Sichtbarkeit auf hellen und dunklen Karten

5. **Zugpfeile**
   - kleiner und transparenter
   - nur auf tatsächlichen Niederschlagsankern
   - maximal zehn priorisierte Pfeile
   - Sicherheitsabstand zum sichtbaren Kartenrand
   - keine künstlichen Ersatzanker
   - äußere Zellen des Radar-Analyserasters werden nicht mehr als Bewegungsanker verwendet

### Prüfung

- **alle 179 automatisch erkannten MID-Regressionstests bestanden**
- vollständige TypeScript-/TSX-Parserprüfung der geänderten Dateien bestanden
- `node --check worker/metar-proxy.js` bestanden
- bestehender Kompositvertrag v0.8.25.0 bestanden
- neuer Komposit-Sichtbarkeits-/Qualitätsvertrag v0.8.25.1 bestanden
- finaler Vollbuild lokal nicht ausführbar, da die Projektabhängigkeiten und Typdefinitionen in der isolierten Umgebung nicht installiert sind

### Worker

Der Worker wurde funktional geändert und muss hochgeladen werden.

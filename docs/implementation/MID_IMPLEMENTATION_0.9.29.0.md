# MID v0.9.29.0

## Wolken + Niederschlagsart – eine einzige georeferenzierte Gesamtkarte

- Die zusätzliche Locator-Karte und das darunterliegende statische DWD-Kombinationsbild wurden aus der aktiven Darstellung entfernt.
- MID erzeugt nun **eine einzige georeferenzierte Gesamtkarte** aus aktuellen Einzelprodukten:
  1. farbige CARTO-Voyager-/OSM-Basiskarte,
  2. möglichst aktuelles **EUMETSAT MTG FCI GeoColour** als bevorzugtes Satellitenprodukt; DWD-/MSG-Produkte bleiben Fallbacks,
  3. **DWD HymecNG** als bevorzugte Niederschlagsart (11 Klassen, native HDF5-Georeferenzierung), jedoch nur bei einem im Frontend maximal 35 Minuten alten Datensatz,
  4. bei fehlendem/frischem HymecNG: **RainViewer Radar mit Regen-/Schnee-Differenzierung**,
  5. als letzter Fallback: zeitgestempeltes **DWD Niederschlagsradar** (nur Intensität),
  6. exakter Standortmarker direkt aus den WGS84-Koordinaten.
- Untimestamped Satellite-/DWD-Radar-Layer werden nicht als scheinbar aktuelle Produkte dargestellt.
- Die Zeitstempel im Kopf stammen aus genau den tatsächlich ausgewählten Kartenprodukten.
- Die Bildpunkt-Auswertung verwendet bei frischem HymecNG die native georeferenzierte Klassifikation; bei Fallbacks wird transparent auf die eingeschränkte Niederschlagsartinformation hingewiesen.
- Der Marker bleibt über das Pin-Symbol ein-/ausblendbar; der Zustand wird gespeichert.

## Worker

- `composite-times` liest wieder die aktuellen WMS-GetCapabilities-Zeitdimensionen statt nur unbestimmte Latest-Fallbacks auszugeben.
- MTG FCI GeoColour wird für die farbige Satellitenansicht priorisiert.
- DWD-Radarzeit und verwendeter Layer werden aus der aktuellen Capabilities-Antwort abgeleitet.
- Capabilities werden für 180 Sekunden gecacht, um Aktualität und DWD-/EUMETSAT-Last zu balancieren.

## Regression

Alle direkt oder historisch mit diesem Bereich gekoppelten Regressionstests wurden auf die neue Einzelkarten-Architektur geprüft und angepasst. Ein neuer Schutztest `scripts/test-mid-single-precip-composite-09290.mjs` verhindert die Rückkehr einer zweiten Locator-/statischen Karte und schützt die Quellenkaskade.

- CI-Hotfix: `test-interaction-performance-cleanup-08155.mjs` an die seit v0.9.29.0 bewusst aktive DWD-Niederschlagskarten-Pipeline angepasst; die früher dormant erwarteten Module `DwdPrecipitationMap.tsx`, `HymecNgOverlay.tsx` und `HymecNgSource.ts` werden nun ausdrücklich als erforderlicher aktiver Laufzeitpfad geprüft.

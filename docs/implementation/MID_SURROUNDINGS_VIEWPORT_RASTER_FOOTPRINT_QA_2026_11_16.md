# MID-Karten 1.11 · #853 – Vollständiger Rad/Sat-Bildfootprint, Vorstufe

**Status:** QA-DRAFT, kein aktiver UI-Fix, keine Merge-/Release-Freigabe.

## Verifizierte Basis / paralleler Besitz

Start: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` · v0.9.85.486; `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `package.json`, `contracts/index.json`, UI-/Cross-Platform-Vertrag und fünf aktive Rulesets geprüft. PR #832 (Zeitachsen/Originale), #850 (Wolken/SigWx) und #852 (Map-Open/Flaggen) gehören parallelen Arbeitssträngen. Die vorliegende additive QA-Stufe berührt **keine** der von ihnen geänderten UI-/Worker-/RUC-/CI-/Release-/Versionsdateien.

## Nachgewiesene Ursache

Stable `src/CurrentSurroundings.tsx` nutzt als festen Darstellungs- und WMS-Footprint `lon±1.4°`, `lat±.65°`, unabhängig von Containerbreite und gerenderter MapLibre-Kamera. Gleichzeitig erzeugt `MapFitBounds` an breiten Viewports bzw. bei Zoomobergrenzen sichtbare Kartenbereiche **außerhalb** des über `ImageQuadLayer` gerenderten Quellrechtecks. Das ist unabhängig davon, ob der Wetteranbieter außerhalb seines eigenen Datengebiets NoData liefert. `CurrentSurroundings.css` gibt der Karte eine responsive Breite und 220–285 px Höhe. Die bisherige ResizeObserver-Messung wird ausschließlich für Temperaturlabels genutzt.

Zusätzlich verursacht die feste WMS-Pixelgröße `512×256` bei BBOX mit abweichendem EPSG:4326-Degreeseitenverhältnis potenzielle Rasterverzerrung (OGC WMS 1.1.1 § 7.2.3.8). 

## Enger neuer Code

- `src/surroundingsViewportRaster.ts`: reine **geometrische** Planungsfunktion `planSurroundingsViewportRaster(visible,viewport,overscanPixels)`. Eingang **erst nach** tatsächlichem `fitBounds`/Resize aus `map.getBounds()` und gemessenem MapLibre-Container. Ein älterer Fokus-/WMS-BBOX ist ausdrücklich kein zulässiger Ersatz.
- Der Output liefert einen MapLibre-kompatiblen geografischen BBOX mit 12 Pixel Mercator-Overscan, eine WMS-1.1.1/EPSG:4326-`bbox`-Zeichenfolge sowie dazu passende Bildbreite/-höhe. Die WMS-Pixelobergrenze beträgt unverändert 512×256 bzw. 131072 Pixel; es gibt **keine** zusätzliche Providerlast.
- 6-Nachkommastellen-Rundung stets **nach außen**; weder Interpolation noch Quelle, UTC-Zeit, Modelrun, Radarphase, Temperatur, Warndaten, NoData oder Quellenpriorität werden verändert.
- Ungültige, polnahe, Datumsgrenzen überschreitende, nicht-finite oder unverhältnismäßige Anforderungen liefern `undefined`: **fail closed**, niemals ein altes Bild als gültigen Ersatz ausgeben.
- `tests/unit/surroundings-viewport-raster-qa.test.ts`: fünf Bildschirmgrößen (320, 390, 430, 768, 1024), breiter Desktop bis 4096, 0/50,82/65/-45°N, Provider-Pixelbudget und WMS-Aspekt, Kamera-/BBox-Identität, Seam-/Polar-/NaN-/Overflow-Negativfälle. **Kein** produktiver UI-Pfad importiert diese Funktion in diesem Draft.

## Notwendiger Integrationsschritt nach Abgleich der Parallel-PRs

1. `CurrentSurroundings`: MapLibre-Map nach initialem `MapFitBounds` und jedem `resize/moveend` mit **aktueller** Kamerageometrie lesen. Eine gebündelte State-Aktualisierung nach tatsächlicher Map-Größenänderung verwenden, kein Endlos-Zoom-/Fetch-Feedback. Den bisherigen initialen fokussierten Kartenausschnitt behalten, aber die Wetterbildfläche über die gesamte sichtbare Karte legen.
2. Dasselbe `plan.bbox` und `plan.width/height` an DWD/EUMETSAT-WMS, MapLibre-ImageQuad und OPERA-Rasterisierung weitergeben; OPERA-/Phase-Canvas und Request-Key an den neuen Footprint binden. Vorherige Antworten mit alter BBox/Ort/Zielzeit verwerfen. Persistierte Moduswahl/Originalzeit unverändert.
3. Wenn `plan` fehlt oder ein Provider nicht abdeckt: NoData sichtbar, keine Substitution von trockenem Wetter und keine alten Bilder unter neuem Zeitstempel. DWD-Domäne, OPERA-Partial-Coverage und RGB→IR-Fallback separat prüfen.
4. Georeferenzierte, farbkodierte **echte Pixel-**Browserprüfung auf Chromium + WebKit in Light/Dark auf Handy, Tablet, Desktop, inkl. Resize, Kamera-Übergang, `maxZoom`, Modell-/Radar-/Sat-Layer und GPU-Kontextverlust. Das reine erfolgreiche Vitest-Testergebnis dieses Drafts **ist kein** Nachweis einer bereits gefüllten Produktionkarte.
5. Nach selektiver Integration: vollständige Source-/Core-/Heavy-/Review-/Browser-/iOS-/Installer-/Worker-/Pages-/Stable-Gates am finalen Release-SHA; keine Umgehung von Issue #740.

**Normative Referenzen:** [MapLibre Map.getBounds / fitBounds / resize](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) und [OGC WMS 1.1.1 GetMap BBOX/WIDTH/HEIGHT](https://cite.ogc.org/teamengine/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html). Wetterdaten-/Nutzungsrechte werden nicht durch diese Geometrie-QA geändert.

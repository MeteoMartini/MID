# MID-Karten 1.11 · #853 – Vollständiger Rad/Sat-Bildfootprint, Vorstufe

**Status:** QA-DRAFT mit einer isolierten produktseitigen Rad/Sat-Verdrahtung in #856; **nicht veröffentlicht** und **nicht kombiniert** mit #854. Keine Ready-/Merge-/Release-Freigabe.

## Verifizierte Basis / paralleler Besitz

Start: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` · v0.9.85.486; `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `package.json`, `contracts/index.json`, UI-/Cross-Platform-Vertrag und fünf aktive Rulesets geprüft. PR #832 (Zeitachsen/Originale), #850 (Wolken/SigWx) und #852 (Map-Open/Flaggen) gehören parallelen Arbeitssträngen. Die vorliegende additive QA-Stufe berührt **keine** der von ihnen geänderten UI-/Worker-/RUC-/CI-/Release-/Versionsdateien.

## Nachgewiesene Ursache

Stable `src/CurrentSurroundings.tsx` nutzt als festen Darstellungs- und WMS-Footprint `lon±1.4°`, `lat±.65°`, unabhängig von Containerbreite und gerenderter MapLibre-Kamera. Gleichzeitig erzeugt `MapFitBounds` an breiten Viewports bzw. bei Zoomobergrenzen sichtbare Kartenbereiche **außerhalb** des über `ImageQuadLayer` gerenderten Quellrechtecks. Das ist unabhängig davon, ob der Wetteranbieter außerhalb seines eigenen Datengebiets NoData liefert. `CurrentSurroundings.css` gibt der Karte eine responsive Breite und 220–285 px Höhe. Die bisherige ResizeObserver-Messung wird ausschließlich für Temperaturlabels genutzt.

Zusätzlich verursacht die feste WMS-Pixelgröße `512×256` bei BBOX mit abweichendem EPSG:4326-Degreeseitenverhältnis potenzielle Rasterverzerrung (OGC WMS 1.1.1 § 7.2.3.8).

## Isolierter Implementierungs- und QA-Code

- `src/surroundingsViewportRaster.ts`: reine **geometrische** Planungsfunktion `planSurroundingsViewportRaster(visible,viewport,overscanPixels)`. Eingang **erst nach** tatsächlichem `fitBounds`/Resize aus `map.getBounds()` und gemessenem MapLibre-Container. Ein älterer Fokus-/WMS-BBOX ist ausdrücklich kein zulässiger Ersatz.
- Der Output liefert einen MapLibre-kompatiblen geografischen BBOX mit 12 Pixel Mercator-Overscan, eine WMS-1.1.1/EPSG:4326-`bbox`-Zeichenfolge sowie dazu passende Bildbreite/-höhe. Die WMS-Pixelobergrenze beträgt unverändert 512×256 bzw. 131072 Pixel; es gibt **keine** zusätzliche Providerlast.
- 6-Nachkommastellen-Rundung stets **nach außen**; weder Interpolation noch Quelle, UTC-Zeit, Modelrun, Radarphase, Temperatur, Warndaten, NoData oder Quellenpriorität werden verändert.
- Ungültige, polnahe, Datumsgrenzen überschreitende, nicht-finite oder unverhältnismäßige Anforderungen liefern `undefined`: **fail closed**, niemals ein altes Bild als gültigen Ersatz ausgeben.
- `tests/unit/surroundings-viewport-raster-qa.test.ts`: fünf Bildschirmgrößen (320, 390, 430, 768, 1024), breiter Desktop bis 4096, 0/50,82/65/-45°N, Provider-Pixelbudget und WMS-Aspekt, Kamera-/BBox-Identität, Seam-/Polar-/NaN-/Overflow-Negativfälle.
- `src/surroundingsViewportObserver.ts` und `src/SurroundingsViewportCapture.tsx`: MapLibre-`getBounds()`/`getContainer()` nach initialem `fitBounds`, gebündelte `resize`/`moveend`-Messung und Rückbau von Timer/Listenern.
- `src/CurrentSurroundings.tsx`: **dieser PR enthält nun auch eine isolierte, unveröffentlichte produktseitige Verdrahtung**. Initialer 2,8°×1,3°-Fokus für Kartenkamera und „Karte öffnen“ bleibt erhalten; Rad/Sat-WMS, ImageQuadLayer und OPERA/Phasenraster nutzen ausschließlich den bestätigten sichtbaren Rasterplan. BBOX und Bilddimensionen gehören zur Orts-/Requestidentität. Veraltete Ortskameras werden nicht wiederverwendet, ungültige Pläne geben keine WMS-Daten frei.
- `tests/unit/surroundings-viewport-observer-qa.test.ts` und `tests/unit/surroundings-viewport-integration-qa.test.ts`: Debounce/Revoke/Cleanup und statische Schnittstellenregressionen; diese ersetzen keine realen Browserpixel.


## Projektion-QA: OPERA/Phase versus externe EPSG:4326-WMS-Bilder

Ein vollständig sichtbarer geografischer Bild-Quad beweist noch **keine innere korrekte Georeferenzierung**. MapLibre verwendet standardmäßig Web Mercator (EPSG:3857); die Rasterzeilen des alten lokalen OPERA-Canvas wurden in `CurrentSurroundings.tsx` dagegen linear als Breitengrad zwischen `north` und `south` berechnet. Bei einem 1,3° hohen Footprint um 50,82° N führt das in der Bildmitte rechnerisch zu rund **0,50 km Lagefehler**, bei 65° N rund **0,88 km**. Das ist für 1-km-Radar und Nowcast/Phasen-Overlay relevant.

- `mercatorLatitudeAtImageFraction(north,south,fraction)` in `src/surroundingsViewportRaster.ts` berechnet die inverse Mercator-Latitude am angeforderten Zeilenanteil; bei nicht-finiten, polnahen, invertierten oder außerhalb des Bildes liegenden Eingaben wird mit RangeError fail-closed gestoppt.
- `src/CurrentSurroundings.tsx` erzeugt ein **einziges** Array geometrisch richtiger OPERA-Zeilenbreiten; dieselben Werte gelten für Echo-/dBZ-Sampling und den `paintPhaseRaster`-Callback. Es wird keine Wetterbeobachtung oder Niederschlagsphase interpoliert, extrapoliert, erzeugt oder vorab geglättet. OPERA-eigene NODATA/UNDETECT-Logik und lokale Laufzeit-/Originalzeitprüfungen bleiben erhalten.
- Neue Unit-/Integrationsprüfungen messen Bildmitte, Randwerte, Monotonie, symmetrische Äquator-Reihe, 65° N sowie invalides/überlaufendes Sampling. Der obige praktische Lagefehler wird somit regressionsgeschützt.
- **Unabhängiges offenes P1-Problem:** Externe Radar-/Satelliten-`GetMap`-Bilder werden weiterhin in **EPSG:4326** mit linearen Breitengrad-Pixelzeilen geliefert und als MapLibre-`ImageQuadLayer` dargestellt. Die neue **OPERA-Korrektur behebt diese WMS-Innenprojektion noch nicht**. Für WMS-Quellen entweder eine originalgetreue EPSG:3857-`GetMap`-Abfrage **nur nach Anbieter-`GetCapabilities`-Prüfung einschließlich konkreter Layer, Proxy und Nutzungsrechte**, oder eine dokumentierte, getestete Client-Reprojektion ohne Erfinden von NoData/Radar-Extremen. Keine stillschweigende CRS-Umstellung.
- Die bisherige 2×2-Magenta-Browserprobe beweist nur Bildabdeckung, Transparenz, BBOX und korrektes Quad. Vor finalem Release zusätzliche **geografische Gradnetz-/Farbquadranten-Originalbildprobe**, mit Sollkoordinaten an der Bildmitte und abseits der Mitte, in Chromium und WebKit.

Quellen: [OGC WMS 1.1.1 § 7.2.3.8](https://opengeospatial.github.io/ets-wms11/OGCTestData/wms/1.1.1/spec/wms1.1.1.html) (BBOX/Bildpixel) sowie [MapLibre ImageSource](https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/) und [MapLibre MercatorCoordinate](https://maplibre.org/maplibre-gl-js/docs/API/classes/MercatorCoordinate/).

## Noch notwendiger Integrations- und Abnahmeschritt nach Abgleich der Parallel-PRs

1. Die isolierte Verdrahtung in `CurrentSurroundings` ist nun implementiert, muss aber zuerst **konfliktfrei in den kombinierten Kandidaten #854** eingebracht werden. **Nicht** die komplette Stable-basierte `CurrentSurroundings.tsx` aus #856 über die bereits aktualisierte #854-Datei kopieren: #854 enthält zusätzliche Cloud-/SigWx-Originalreferenz- und Zeitverträge aus #850. Übernehmen nur die selektierten BBOX-/Request-/Layer-Hunks und die zuvor SHA-verifizierten neuen Hilfsdateien.
2. Nach der kombinierten Übernahme WMS-BBOX und WIDTH/HEIGHT, MapLibre-ImageQuad, OPERA-/Phase-Canvas und SHA-/UTC-/Orts-/Zeit-/Provider-Gates **end-to-end** beweisen. Ein Unit-PASS für die isolierte Quelle allein reicht nicht. Die Kombination darf keine alten Bild-Requests oder fremde Originale unter einem aktuellen Zeitstempel durchlassen.
3. Wenn `plan` fehlt oder ein Provider nicht abdeckt: NoData sichtbar, keine Substitution von trockenem Wetter und keine alten Bilder unter neuem Zeitstempel. DWD-Domäne, OPERA-Partial-Coverage und RGB→IR-Fallback separat prüfen.
4. Georeferenzierte, farbkodierte **echte Pixel-**Browserprüfung auf Chromium + WebKit in Light/Dark auf Handy, Tablet, Desktop, inkl. Resize, Kamera-Übergang, `maxZoom`, Modell-/Radar-/Sat-Layer und GPU-Kontextverlust. Das reine erfolgreiche Vitest-Testergebnis dieses Drafts **ist kein** Nachweis einer bereits gefüllten Produktionkarte.
5. Nach selektiver Integration: vollständige Source-/Core-/Heavy-/Review-/Browser-/iOS-/Installer-/Worker-/Pages-/Stable-Gates am finalen Release-SHA; keine Umgehung von Issue #740.

**Normative Referenzen:** [MapLibre Map.getBounds / fitBounds / resize](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) und [OGC WMS 1.1.1 GetMap BBOX/WIDTH/HEIGHT](https://cite.ogc.org/teamengine/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html). Wetterdaten-/Nutzungsrechte werden nicht durch diese Geometrie-QA geändert.

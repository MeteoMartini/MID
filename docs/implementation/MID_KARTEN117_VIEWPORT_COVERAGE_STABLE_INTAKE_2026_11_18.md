# MID-Karten 1.17 – isolierter Viewport-/OPERA-Produktkandidat auf Stable .491

**QA-DRAFT / NO READY / NO MERGE / NO RELEASE.** Keine Freigabe eines neuen WMS-CRS, Providers, Workers oder Releases. Kein eigenständiger Ausführungs- oder vollständiger Browsernachweis durch diese Dokumentation.

## Herkunft / Synchronisierung
- Source-of-Truth am Branch-Cut: `main=mid-stable=3f9c5e24dc55fa5154732a1ba73961ba76c29788` / v0.9.85.491 in `package.json`, `MID_BASELINE.json` und `contracts/index.json`. Fünf aktive Rulesets, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, UI- und Cross-Platform-Vertrag gelesen.
- Produktiver Stable-Blob `src/CurrentSurroundings.tsx=566967029f384e93c3e02d02c28fd917a28fbe4d` wurde **hunkweise** um genau die Geometrie-/Coverage-Verdrahtung erweitert. Keine unvollständige Komplettübernahme der 213-Dateien-Version aus [#868](https://github.com/MeteoMartini/MID/pull/868) oder der archivierten [#856](https://github.com/MeteoMartini/MID/pull/856).
- Identische Quellblobs aus #868 @ `dd9a9cc6eaca641785b095bf79862a4b1ba051cd`:
  - `src/surroundingsViewportRaster.ts=db86853237be9142305431cbaf10708723b5dee7`
  - `src/surroundingsViewportObserver.ts=e6d142b806c8335ee78994ebe35b612ebfe1442a`
  - `src/SurroundingsViewportCapture.tsx=a1098db43fc59301f8ee643001a6964de84b6d23`
  - `src/surroundingsOperaCoverage.ts=6dcf5216cb413c89b28ee4ceec7714968c387612`
  - Die drei Original-Vitest-Suites `surroundings-viewport-raster-qa`, `surroundings-viewport-observer-qa`, `surroundings-opera-coverage-qa` bleiben blob-identisch. Neu: `surroundings-viewport-current-qa.test.ts` als aktueller Verdrahtungswächter.
- Parallele `#924` (RUC-Release), `#929` (Nowcast-Mengen), `#930` (Ladezustände), `#926` (RainViewer), `#925` (Ortsnamen) wurden bei Branch-Cut geprüft. Kein Merge, kein fremdes PR-Update.

## Produktsemantik, eng abgegrenzt
1. **Bildfootprint:** `MapFitBounds` setzt weiterhin den initialen Fokus (`lon±1.4°, lat±0.65°`) und der Detailkarten-Handoff bleibt unverändert. Der danach tatsächlich sichtbare MapLibre-Kamera-Bereich via `getBounds()` + `getContainer()` liefert nach 160 ms gebündelter Resize-/Moveend-Erfassung ein **eigenes WMS-/OPERA-Rasterrechteck mit 12px Overscan**. Keine weiteren Wetterzeit- oder Provideranfragen während dieser Messung.
2. **Gebundene Identität:** WMS-URL, Bitmapbreite/-höhe (maximal 512×256 = 131072 Pixel), beide MapLibre-ImageQuads, OPERA/Phasen-Canvas und Rasterzustand hängen an derselben orts-/viewportgebundenen Geometrie. Kein stilles Vererben fremder Orts-/BBox-Bilder; veränderte Footprints unmounten alte ImageQuad-Instanzen.
3. **OPERA-Georeferenzierung:** Rasterzeilen nutzen inverse Mercator-Y statt linearem Breiten-Delta; die Phase verwendet dieselben Rasterzeilen. Validitätszellen werden unabhängig von `dbz` gezählt (inkl. gültigem `undetect`), `0` echte gültige Zellen blockieren das Bild; positive Teilabdeckung wird ausdrücklich als Prozentteil benannt und nie auf 100 % aufgerundet. Regenwahrscheinlichkeit, Null-Echo und Quellabdeckung bleiben verschieden.
4. **Ungültige Kamera:** fail closed ohne WMS-URL/OPERA-Darstellung; sichtbarer Status, keine Wetterbeobachtung als `0 mm`. Die bisherigen DWD-/EUMETSAT-/WMO-Werte, Radar-/Sat-Zeiten und Warnungen bleiben unverändert.

## NICHT behobene P0-/P1-Restpunkte
- **WMS-Innenprojektion:** Externes GetMap bleibt explizit `WMS 1.1.1 / EPSG:4326`. Die quadratische MapLibre-Kamerageometrie ist WebMercator; passende Ecken beweisen **keine** exakte innere Pixelgeoreferenzierung. Anbieter-/Layer-CRS-Support und konkretes Lizenz-/Proxy-/Zeit-/Attributionsrecht gemäß GetCapabilities prüfen und erst mit georeferenzierten Pixelproben und Source-/Budget-Gates auf 3857 umstellen bzw. originaltreu reprojizieren.
- **Alpha-Verwechslung:** Die bestehende DWD-WMS-Alpha-Rückleseprobe (0.5 MiB bei 512×256) ist weiterhin ungeeignet, Quell-Coverage oder Trockenheit nachzuweisen. Eine alternative sichere Bilddekodierung, WMS-Exception-Prüfung und getrennte echte Abdeckungsmetadaten müssen separat umgesetzt werden (siehe #853 sowie Karten-1.16-Handoff); keine stille optische Korrektur als meteorologische Freigabe verkaufen.
- **Sat RGB/IR:** Die bestehende quellzeitliche RGB-Priorität bleibt unverändert; ein gültiger IR-Fallback bei ungültigem RGB braucht separate Quellmetadaten und Rechteprüfung, keine erfundene Satellitenbeobachtung. RainViewer [#928](https://github.com/MeteoMartini/MID/issues/928) bleibt ohne schriftliche Zustimmung deaktiviert.
- **Echte Daten/Browser:** Es sind keine tatsächlichen DWD-, EUMETSAT- oder OPERA-Live-Originale durch diesen Draft abgenommen. Kontrollierte Browserfixture muss Rand- UND innere Kartenpixel prüfen, nicht nur sichtbare Kartengeometrie.

## Prüfmatrix für Leit-Chat/-Work
- Geometrie: 320/390/430/768/1024/1440 CSS-px, Hoch/Quer, Light/Dark, 200 % Text, Safe Areas, lange Ortsnamen, Touch >=44 px, Tastatur- und Fokusführung.
- Meteorologie: DWD-RV, OPERA, EUMETSAT-RGB/IR separat; tatsächliche Gültigkeitszeit, Modelllauf, Radar-Beobachtung vs. Nowcast, NoData-/undetect-/Phasen-Status, Quell-Coverage bei 0/1/partial/alle Pixel. Kein Alpha=trocken.
- Laufzeit: 0°, 50.82°, 65° N, Datumsgrenze/Polar/NaN, Resize-Serien, Orts- und Modellwechsel, 3× schneller Zeitsprung, Abort, UI-Pause, WebGL-Kontextverlust, Memory/GPU-Netzwerk-Budget. Performance nur gemessene Differentialzahlen.
- Freigabe: identischer finaler Source-SHA, Core + Heavy + Review, serverseitiges ZIP, `install-mid.yml`, Worker-/Pages-Gates, erfolgreiche Stable-Promotion. Vollständige iOS-/VoiceOver-Abnahme gesondert, nicht aus Chromium-Fix als bestanden ausgeben.

## Offizielle Referenzen
- OGC WMS 1.1.1, §7.2.3.6–8: https://opengeospatial.github.io/ets-wms11/OGCTestData/wms/1.1.1/spec/wms1.1.1.html
- MapLibre ImageSource / getBounds / fitBounds: https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/ ; https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- meteoblue Radar-/Satellitenquellen und Originalauflösung: https://docs.meteoblue.com/en/meteo/data-sources/satellite-and-radar-providers
- meteoblue Maps Plugin – Animation / Puffer (nicht ungeprüft für MID übernehmen): https://docs.meteoblue.com/en/weather-apis/maps-api/maps-plugin

**Intake-Empfehlung:** Keine automatische Merge- oder Releasefreigabe. Nach unabhängiger TypeScript-/Vitest- und Browser-/Anbieter-Pixelabnahme selektiv integrieren, ohne Überschneidungen mit PRs #868/#889/#904/#908. Die getrennten P0-CRS-/Alpha-Rechte-Gates bleiben offen.

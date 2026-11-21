# MID-Karten 1.19 · nicht-forcierte Umfeldkarte-Integration auf Stable .497

**QA DRAFT – NO READY / NO MERGE / NO RELEASE.**

## Provenienz / Basiskontrolle
- Quelle: `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, Version **v0.9.85.497** in `package.json`, `MID_BASELINE.json` und `contracts/index.json`; fünf aktive Rulesets und AGENTS-/MID_SOURCE_OF_TRUTH-/UI-/Cross-Platform-Verträge.
- Quell-Draft: [#937](https://github.com/MeteoMartini/MID/pull/937), bisher HEAD `77fae8e9a937b53d13414cf7b9d9f66cc343e4c7` auf alter Stable-Basis `eee0bb0ac351115f5e85b7625825cc8d1376594f` / v0.9.85.494.
- Jeder der **15** in #937 geänderten Pfade ist am neuen Stable .497 **blob-identisch zu seiner .494-Base** (bisher existierende Dateien), beziehungsweise noch nicht vorhanden (neue Dateien). Unveröffentlichtes altes #937-HEAD und alle Original-Git-Blobs erhalten.
- Neuer Source-Draft-Head als **nicht-forcierter Merge-Commit**: erster Parent der bisherige PR-HEAD `77fae8e9a937b53d13414cf7b9d9f66cc343e4c7`, zweiter Parent das zuletzt verifizierte Stable `9fd872a789f4b158bc691d085589616c2c04f776`. Git-Tree ist aktuelles Stable .497 **plus exakt die 15 QA-Original-Git-Blobs** und diese zusätzliche Dokumentation. Keine alten Git-Zustände überschrieben, kein force push, kein Direktwrite zu main/stable, kein Einmischen in RUC-Fast-Lane-Release-PR #946.

## Erhaltener Karten-Produktumfang
1. Echte MapLibre-Kamera-/Container-BBox statt festem 2.8°×1.3°-RadSat-Bild und ein einheitliches, dimensionsgebundenes WMS-/OPERA-/ImageQuad-Raster, 12px Overscan, 160ms Debounce, maximal WMS 512×256 / OPERA 256×128.
2. OPERA-/Phasen-Raster entlang inverser Mercator-Breiten statt linearer Pixel-Latitude; gültige Rasterzellen werden gezählt, Teilabdeckung sichtbar, Missing ≠ 0 und keine unbelegte Trockenheitsbehauptung.
3. WMS-Radar vorab nur auf erfolgreich dekodiertes Bild und *exakte* angeforderte Pixelbreite/-höhe geprüft; kein zusätzlicher `getImageData`-RGBA-Readback und keine `alpha>0`-Pseudo-Quellabdeckung. Der bisherige zusätzliche Vollbildleseaufwand bis 524.288 Bytes je 512×256-Bild entfällt; Leistungssteigerung **nicht gemessen**. Bisherige DWD-Zeit-/WMS-Quellen-/Warnlogik unverändert.
4. Original-Draft-Tests umfassen falsche BBOX-/Raster-Form, Datumsgrenze/Polar und echte Chromium-Kartenprobe mit maßhaltigen, synthetischen transparenten und deckenden PNGs. **Kein Originaldaten-Live-Test** allein aus diesen Fixtures.

## Parallelität / Freigabesperren
- **Getrennte P0-Worker-Kandidatur:** [#955](https://github.com/MeteoMartini/MID/pull/955) (Basis Stable .497) begrenzt Proxy-WMS-GetMap-Requests, verhindert doppelte Parameter und sichert TIME-/LAYERS-Casefolding. #955 verändert Worker-Spiegel, #937 nicht; bei einem späteren Release-Train nur SHA-genaue disjunkte Integration und neue vollständige Source-/Worker-Gates.
- **Unabhängig:** [#929](https://github.com/MeteoMartini/MID/pull/929) Nowcast-Mengen, [#926](https://github.com/MeteoMartini/MID/pull/926) RainViewer (Rechte weiterhin nicht freigegeben), [#889](https://github.com/MeteoMartini/MID/pull/889) GPU-Owner, [#904](https://github.com/MeteoMartini/MID/pull/904) Fade, [#908](https://github.com/MeteoMartini/MID/pull/908) Canvas und [#946](https://github.com/MeteoMartini/MID/pull/946) RUC-Fast-Lane. Keine verdeckte Produkt-/Daten-/Release-Übernahme.
- Offene **P0-Fachprüfung**: WMS 1.1.1 `EPSG:4326` hat in der MapLibre-WebMercator-ImageQuad bei bloßer Eckpunktbindung **noch keine nachgewiesene Bildinnen-Pixelgeometrie**. Per Layer DWD-/EUMETSAT-`GetCapabilities`, zulässige CRS/TIME, Lizenz/Attribution, echter PNG-Original-/NoData-/undetect-Inhalt und Innen- und Rand-GCPs vor Änderung der Projektion validieren; keine fingierten 15-min Radar-Sat-Bilder.
- Offene **P1-Browser-/Perf-Matrix**: 320/390/430/768/1024/1440 CSS-px, Hoch-/Querformat, Light/Dark, 200% Text, Safe Area, lange Ortsnamen, Tastatur/44px Touch, Resize-/Zeitwechsel, WebGL Context Loss, getrennte echte WebKit/iOS/VoiceOver-Abnahme. WMS-Vordekodierung und MapLibre-ImageSource-Doppelarbeit getrennt messen.
- **Testergebnisse vor Merge:** Früherer SHA-gebundener .494-Pilot [44391949990](https://github.com/MeteoMartini/MID/actions/runs/44391949990) Vitest/V8-Coverage + Draft-Regressions beide success; das beweist **nicht** den neuen Merge-HEAD. Neue GitHub-CI und vollständiger Source-/Review-/Core-/Heavy-/server ZIP-/Installer-/Worker-/Pages-/Stable-Gates sind notwendig.

## Offizielle Quellen und UI-Vergleiche
- OGC WMS 1.1.1 https://cite.ogc.org/teamengine/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html
- MapLibre ImageSource https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/
- meteoblue Radar-/Sat-Provider https://docs.meteoblue.com/en/meteo/data-sources/satellite-and-radar-providers
- Windy Radar+ Quellenwechsel/Zeitachse https://community.windy.com/topic/36164/windy-launches-radar-layer-combining-satellite-and-radar-view

**Handoff an Leit-Chat/-Work:** kontrollierter Release-Train ausschließlich nach allen verbindlichen offiziellen SHA-Gates. Nicht selber bereitstellen, kein Umgehen existierender Review- oder Branchregeln.

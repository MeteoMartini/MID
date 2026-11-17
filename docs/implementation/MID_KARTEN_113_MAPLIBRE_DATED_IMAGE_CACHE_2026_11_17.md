# MID-Karten P1 · Datumstreue WMS-Bildwiederverwendung ohne erneut dekodierte Bildrequests

**Source-Draft, nicht veröffentlicht — 17.11.2026.** Verifizierte Ausgangsbasis `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets. Vor jeder Übernahme den dann aktuellen Integrations-Draft #868, seinen Full-SHA/Datei-Diff, bestehende Raster-/Modell-/Security-Verträge und alle parallelen Entwicklungen erneut lesen. Der Source-Draft betrifft die von #868 ebenfalls geänderte Datei `src/MapLibreCore.tsx`; deshalb **keine direkte Zusammenführung / kein ungeprüftes Cherry-Pick einer ganzen Datei**.

## Ausgangsproblem und technische Entscheidung
Das in `ImageQuadLayer` bereits etablierte GPU-`render`-/`isSourceLoaded`-Barrier und der 350-ms-Crossfade (C441) schützen ein bereits sichtbares Bild. Bislang erzeugte aber jede Auswahl eines WMS-Termins `new Image()` + `src=url`, selbst wenn dieselbe URL vor wenigen Sekunden schon vollständig geladen wurde. Das kann unnötige Bildanforderungen und Bilddekodierung beim schnellen Zurück-/Vor-Scrub auslösen.

MapLibre `ImageSource.updateImage({image:HTMLImageElement})` akzeptiert ein **bereits geladenes** Bild ohne erneuten Netzwerkrequest. Wir ändern ausschließlich den vorgeschalteten Loader, nicht die Quellenzeit-, Pixel- oder GPU-Readiness-Entscheidung. Originell: https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/ und https://github.com/maplibre/maplibre-gl-js/blob/main/src/source/image_source.ts

## Änderungen
- **`src/mapRasterImageCache.ts`**: kleine geteilte, testbare Cache-Instanz. Nur HTTP(S)-`WMS GetMap` mit **exaktem UTC-`TIME`**, Layer, BBOX und Pixeldimension wird gespeichert. Der vollständige URL-String inklusive Produkt, Provider, BBOX, Originalzeit und Revisionsparametern ist der Cache-Key. Zeitlich dynamische `latest`, `data:`-/`blob:`-Bilder, ungültige Quellen, URLs mit Benutzerpasswort und nicht datierte Produktausgaben gehen weiterhin direkt zum bisherigen Browser-Image-Loader.
- **Begrenzung**: höchstens 8 dekodierte Frames, geschätztes RAM maximal 8 MiB (4 Bytes/Pixel), TTL 120 Sekunden, maximal 8 gleichzeitig deduplizierte laufende Requests, 20 Sekunden Ladezeitlimit. Bilder über Budget werden **nicht** gehalten. Fehler entfernt den Eintrag, ein erneuter Versuch bleibt möglich. Kein Prefetch neuer Wetterdaten, keine Speicherung in LocalStorage/IndexedDB, keine Secrets/externen Dienste. Die TTL begrenzt das Risiko spät korrigierter WMS-Stände.
- **`src/MapLibreCore.tsx` / `ImageQuadLayer`**: benutzt `loadMapImageForQuad(url)` anstelle neuer `Image()` bei jedem Auswahlwechsel. Ein aufgerufener, inzwischen ungemounteter Consumer darf den Frame nicht mehr einbauen. Gleiche URL in wenigen Sekunden heißt keine neue Browser-Bildanforderung, **nicht** kein MapLibre-Texture-Upload. Der alte GPU-Rahmen bleibt bis zum render-fertigen neuen Bild bestehen; der bestehende 350-ms-Crossfade und Reduced-Motion-Guard bleiben unangetastet.
- **`tests/unit/map-raster-image-cache.test.ts`**: sieben Gruppen zu absoluter UTC-WMS-Quellidentität, 5-min-Rückwärts-/Vorwärtsnavigation, Inflight-Dedup, BBOX/Layer/Revision, Nichtcache für dynamische Satelliten-/OPERA-Snapshots, LRU/Byte-/TTL-Grenzen, Fehler und nicht mehr aktiven Konsumenten.

## Bidirektionale MID-Auswirkungsmatrix

| Aspekt | Wetter im Umfeld (MapLibre) | Kartenbereich |
|---|---|---|
| Rad/Sat TIME/WMS | **Direkter künftiger Nutzen**: bereits geladene datierte WMS-Bildquads beim Rückwärtsscrub über denselben URL erneut verwenden | Die großen Radar-/Satelliten-`WMSTileLayer` sind **Leaflet** und nutzen diese MapLibre-Cacheinstanz nicht. Ihr schon vorhandener Tile-Cache und Doppelpuffer bleiben bestehen; Zoom-Remount muss separat browsergeprüft behoben werden |
| Modellkarten/PseudoSat | `ImageQuadLayer`-Originale profitieren, soweit als datierte WMS-URL übergeben; Daten-URLs bleiben ausgeschlossen | Weitere Kartenbereiche mit demselben `ImageQuadLayer` profitieren unmittelbar, darunter MapLibre-Modellkomposite. Keine falsche Behauptung über Leaflet-Radar-/Sat-Layer |
| Wissenschaft & Status | Zeitstempel, UTC, Original/Nowcast, NoData, Provenienz, Warnungsstatus bleiben Sache der bestehenden Providerselektoren | Gilt unverändert; neuer Cache gewährt **keine** Wetterquelle, Pixelabdeckung, Messzeit oder GPU-Freigabe |
| User Experience | Bei Rückkehr zu einem datierten Bild weniger wiederholte Requests, 350-ms-Fade bleibt | Kartenbereich-Leaflet-Zoomretention ist **weiter offen**; gemeinsamer UX-Vertrag und echte parallele Browser-Abnahme erforderlich |

## Nachweis- und Freigabegates
Die reinen Cache-Unit-Tests beweisen keine echte Bandbreiten-, iOS-, GPU- oder vollständige Cross-Surface-UX-Verbesserung. Für Integration auf dem **aktuellen** LC-#868-HEAD: exakt diesen Import und `ImageQuadLayer`-Hunk mit verifiziertem Source vergleichen, alle Tests neu auf Integrations-SHA ausführen, WMS-Scrub A→B→A in 320/390/430/834/Desktop Light/Dark, schnelle 5-min-Wechsel, 2×Pixelratio, Netzfehler/Timeout, CORS und Alpha-NoData, Reduced Motion, RAM/Netzwerk (`PerformanceResourceTiming`) im echten Chromium **und** WebKit messen. Browser-Checks niemals als native iOS-/VoiceOver-Abnahme ausgeben. Vor einer weitergehenden Leaflet-Zoomoptimierung vorhandene `scripts/test-composite-satellite-freshness-zoom-093220.mjs`-Verträge fachlich prüfen; nicht schwächen.

**Keine Änderung** an npm-Abhängigkeiten, CI/Rulesets/Secrets, Worker-/DWD-Originalen, Releases oder Hauptbranches. Gate-Pfad Source-PR → SHA-Merge → Release-ZIP → `install-mid.yml` → Worker/Pages → Stable. #740/#839 ist anderen Spezialchats vorbehalten.

**NO READY · NO MERGE · NO RELEASE.**

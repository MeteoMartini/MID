# MID Karten 1.13 · MapLibre-WMS-Zoom: reale Chromium-Source-Identität und bidirektionaler Karten-Check

**Datum 17.11.2026 · Status QA-DRAFT (keine Produktion, kein Release).**

## Warum ein gesonderter Test nötig ist
Der LC-PR #868 hat den Source-Fix aus #874 inklusive `src/mapTemporalWmsZoomPolicy.ts` übernommen. Dessen bestehende Vitest-Prüfungen und früherer `scripts/test-composite-satellite-freshness-zoom-093220.mjs` belegen die UTC-Richtlinie und historischen Zoom-Status, **aber keinen echten Browsernachweis**, dass die im GPU-Renderer gespeicherte datierte WMS-Rasterquelle beim Zoom dieselbe MapLibre-Source **bleibt**. Ein neuer synthetischer Browserfall ergänzt den gemeinsamen MID-Source-Gate-Browserlauf, ohne bestehende Tests abzuschwächen.

## Dateilieferung
- `scripts/fixtures/map-native-wms-zoom-browser.tsx`: importiert die **produktiven** MID-Komponenten `MidMapLibre`, `WmsTileLayer` aus `MapLibreLegacyCompat`, `ImageQuadLayer` und `mapTemporalWmsZoomPolicy`. React-UI ermöglicht echte MapLibre-`easeTo`-Zoomereignisse, zeitlich festes UTC-Beobachtungsbild, UTC-Nowcast-Original und ausdrücklich nicht datiertes `latest`. Die synthetische ImageQuad-Quelle ist ein zusätzlicher Vergleich zum Umfeldwetter.
- `scripts/verify-map-native-wms-zoom-browser-0985487.mjs`: startet Vite und **echtes Playwright Chromium 1.56.1** auf `127.0.0.1`. WMS-GetMap wird lokal als synthetisches gültiges 256×256-PNG mit eigener Quellfarbe beantwortet; jede Anfrage wird protokolliert. Kein echter DWD-/EUMETSAT-Pixelwert wird simuliert oder meteorologisch als valide ausgegeben.
- `tests/unit/map-native-wms-zoom-browser-admission.test.ts`: prüft im bestehenden Vitest-Glob die syntaktische Ausführbarkeit per `esbuild.transformSync`, produktive MapLibre-Komponenten, Source-Identitätsassertions, UTC-/Latest-Trennung und fehlende Leaflet-Abhängigkeit. **Diese Unit-Prüfungen sind ausdrücklich nicht identisch mit einem ausgeführten Browserlauf.**
- `src/mapTemporalWmsZoomPolicy.ts` liegt nur als **byte-identische Voraussetzung** aus LC-#868 (Git-Blob `a1c4d6c94908f86c087dd78a0dc08187582521d4`) im isolierten Spezialbranch. **Beim LC-Intake NICHT nochmals kopieren.**

## Tatsächliche Browserassertions
1. Initiale Beobachtung: ein MapLibre-WMS-Source und ein MapLibre-ImageQuad-Source sind wirklich geladen; das WMS-`time` ist der belegte synthetische Testtermin.
2. Während eines animierten `map.easeTo` (Zoom in 390px und 1024px, Light/Dark): beide **identischen JavaScript-Source-Objekte** sind weiterhin auf der Karte montiert. Erst `isSourceLoaded` bestätigt die Ladebereitschaft; ein HTML-Image-Load allein wäre kein GPU-Beleg.
3. Nach `zoomend`: beide Source-Objekte bleiben identisch, URL inklusive Original-`TIME` und `_mid_revision` unverändert. Neue XYZ-Kacheln für die veränderte Zoomstufe sind zulässig.
4. Umschalten auf das geprüfte synthetische Nowcast-Original erzeugt einen **neuen** WMS-Quelltermin; alte Beobachtungspixel dürfen keine neue Gültigkeit erhalten.
5. Umschalten auf `latest`: ImageQuad wird entfernt; WMS-URL enthält keine erfundene `TIME`. Beim folgenden Zoom muss die mutable WMS-Source ausgetauscht und die Revision erhöht werden.
6. Keine React/PageError-Fehler, fehlgeschlagene Kachelmeldung oder horizontaler Overflow. Der Lauf meldet `MID_MAPLIBRE_NATIVE_WMS_ZOOM_BROWSER` mit Quellprüfung und den 4 tatsächlichen Chromium-Kontexten, nicht mit erfundener Netzlastoptimierung.

## Ausführung, Gate und Einschränkungen
**Auf dem finalen SHA-gebundenen LC-Integrationsstand** nach selektivem Import:

```bash
node scripts/verify-map-native-wms-zoom-browser-0985487.mjs
```

Im CI muss der vorhandene, erlaubte Browser-Installationspfad genutzt werden (Playwright 1.56.1, echtes Chromium + WebGL/SwiftShader; keine neuen Abos). Der Spezial-PR führt nur den bestehenden Draft-Vitest und gezielte Regressionen aus; **solange dieser neue Chromium-Browserlauf nicht gesondert tatsächlich ausgeführt wurde, ist der Browser-Status OFFEN**. Eine reine Kompilierung/Codeinspection kann die GPU-/Netzwerkprobe nicht ersetzen.

Die Probe ist **synthetisches Browser-Verhalten und kein DWD-Pixel-/Warnungs-/Satellitenoriginal, keine physische iOS- oder VoiceOver-Freigabe**, kein realer Netz- oder Produktiv-Performancebeweis und keine Garantie durchgehender Rasterdeckung bei ungünstigen WMS-Quellen. Zusätzlich sind bei der späteren LC-Freigabe die vollständige Karte/Umfeld-5min-Steuerung, WMS-Viewport-Geometrie, echte NoData-Abdeckung, Play/Pause, Langsamnetz, WebKit, Reduced Motion, Touch, 320/430/834/Desktop und alle Source-/Heavy-/Release-/Installer-/Worker-/Pages-/Stable-Gates notwendig. Bestehende Release-Security-Aufträge #740/#839 bleiben unangetastet.

**Pfadschutz:** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets zum Branch-Start geprüft. LC #868 hat dieselbe Policy bereits; einzig die **drei** neuen QA-Dateien und dieses Dokument dürfen nach SHA-/Blob-Abgleich übernommen werden. Kein Direktmerge, kein Release.

**Technische Originalquelle:** <https://maplibre.org/maplibre-gl-js/docs/API/classes/RasterTileSource/> (WMS-Rasterkacheln); <https://github.com/maplibre/maplibre-gl-js/blob/main/developer-guides/life-of-a-tile.md> (TileManager Zoom-Fallback); <https://maplibre.org/maplibre-gl-js/docs/API/classes/MapSourceDataEvent/> (Quell-/Ladeereignisse).

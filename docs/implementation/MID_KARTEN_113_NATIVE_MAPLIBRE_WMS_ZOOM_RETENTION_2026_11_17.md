# MID-Karten 1.13 · MapLibre-native WMS-Radar-/Satellitenbild-Kontinuität beim Zoom (Source-Draft)

**Stand:** 17.11.2026 · **Ausgangsbasis:** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486. Fünf aktive GitHub-Branch-Rulesets. Kein Merge, keine Veröffentlichung.

## Verifizierte Ursache (Korrektur früherer Leaflet-Annahme)
- `src/RadarPanel.tsx` importiert `WMSTileLayer` aus `src/MapLibreLegacyCompat.tsx`, **nicht aus Leaflet**. `MapLibreLegacyCompat.WMSTileLayer` delegiert an `MapLibreCore.WmsTileLayer`, dieses über `RasterTileLayer` an MapLibre `map.addSource(type:'raster',tiles:...)`. Im aktuellen Adapter werden `keepBuffer`, `updateWhenIdle` und `updateWhenZooming` zwar als Props angenommen, aber an die echte MapLibre-Quelle **nicht** weitergegeben. Der frühere Vorschlag, diese Leaflet-Parameter direkt zu optimieren, war deswegen technisch unzutreffend; diese Änderung benutzt nur die tatsächliche MapLibre-Implementierung.
- Bisher: `RasterZoomLifecycle` setzt auf `zoomstart` `rasterZooming=true`, dadurch demontiert React auch zeitlich **fest ausgewiesene** DWD-Radar- und EUMETSAT/DWD-Satelliten-WMS-Komponenten. `zoomend` erhöht `tileRevision`, das sowohl in deren React-`key` als auch der WMS-Basis-URL steht: Wiederaufbau aller betroffenen Wetterquellen und neues Raster-Download trotz identischem Originaltermin. Sichtbare Basiskartenlücke und Netzlast sind plausible Auswirkungen; eine reale Pixel-/Netzwerkmessung auf dem finalen LC-Build fehlt noch.

## Begrenzter Source-Fix im echten Kartenbereich
- Neue reine gemeinsame Funktion `src/mapTemporalWmsZoomPolicy.ts`: Datumstreues UTC-ISO (sekundengenau, Millisekunden erlaubt, unmögliche Kalenderdaten ausgeschlossen) plus `latestOnly=false` ergibt `retainDuringZoom=true, revision=0`. Ohne echtes UTC-Original oder für `latestOnly` bleibt das bisherige `rasterZooming`-Un-/Remount-Verhalten und die aktuelle Revisionszählung erhalten. Source-Uhrzeit, UTC, Beobachtung/Nowcast, Modellrun und NoData werden **nicht** geändert.
- `src/RadarPanel.tsx`: Nur DWD-Radar mit realem Original-`TIME` und zeitlich explizit katalogisierte Satelliten-WMS-Ebenen behalten während Zoom ihr React-Element, identische WMS-Raster-`key`/URL und damit die existierende MapLibre-Rasterquelle. MapLibre lädt bei neuem Zoom automatisch die erforderlichen XYZ-Kacheln; es ist keine Leaflet-Option erforderlich. Der `satelliteLoadedFrames`-Reset ist für echte `latest`-Snapshots weiterhin an `tileRevision` gebunden, aber nicht für unveränderte katalogisierte Originalstände.
- Nicht verändert: Live-Snapshot ohne `TIME`, Blitz, Warnungs-WMS, satellitengestützte Niederschlagsrate, synoptische Modelle und deren bestehende Sicherheits-/Refresh-Logik. Diese Fälle erfordern separate zeitliche Rasteridentitäts-Prüfung vor Retention.
- Der Bildebenen-/WMS-Renderer bleibt in `MapLibreCore` unverändert; die neue Policy betrifft ausschließlich verifizierte Originalbild-Auswahl und Zoom-De-/Remount.

## Bidirektionale Auswirkungen Wetter im Umfeld ↔ großer Kartenbereich
| Aspekt | Großer Kartenbereich | Umfeldwetter |
|---|---|---|
| Datierte Radar-/Satelliten-WMS | **Direkt** weniger absichtliche Layer-Remounts und Source-URL-Änderungen beim Zoom | Bestehendes `ImageQuadLayer`-GPU-Ready/Crossfade und der in LC #868 integrierte begrenzte dekodierte WMS-Cache bleiben unverändert |
| Quellen-/Zeitschutz | Original-Uhrzeit in `time`/WMS und Beobachtung/Nowcast bleibt unverändert | 5-Minuten-Cursor / Original-Zeit, Provider-/BBOX-Grenzen bleiben unverändert |
| Live-Snapshot / Warnungen | Bewusst **kein** Spezialcache für mutable `latest` und amtliche Warnungsdaten | Der Umfeldwetter-WMS-Cache schließt entsprechende dynamische Quellen bereits aus |
| Test | Neu: 6 Policy-, UTC-/NoData-/Source-/MapLibre-Adapter-Gruppen | Bestehende Cross-Surface-/ImageQuad-Tests in #868 sind nach selektivem Intake ebenfalls erneut auszuführen |

## QA-/Abnahmebedingungen
1. Kein direkter Merge dieses Spezial-PR in `main`. `RadarPanel.tsx` wird auch im parallelen Leitchat-PR #868 editiert. Nach erneuter Live-SHA-/Konfliktprüfung nur **exakte Hunk-Übernahme** samt neuem Policy-Modul und Tests in den autorisierten Leitchat-Integrationsbranch; keine ganze React-Datei ersetzen.
2. Draft-Vitest-/gezielte Regressionen für SHA; ursprüngliche `scripts/test-composite-satellite-freshness-zoom-093220.mjs`-Checks für mutable Satelliten und Zoom-Callbacks **bleiben erhalten** (nicht zur CI-Kosmetik abgeschwächt).
3. Echte Raster-/GPU-/Netzwerk-/Browserabnahme: Geometrie bei 320/390/430/834/Desktop, WebGL-Ready, Radar/Sat-A→B→A, Zoomstart/-ende und Pan, Light/Dark, Reduced Motion, Netzwerkfehler, 5-/10-/15-Minuten-Originalcadence, Datenlücken, keine Basiskarten-only-Frames, Cache-Last und Speichergrenzen. Die von MapLibre ignorierten Kompatibilitäts-Props sind **keine** Beweise. Für bestimmte Layer können beim Zoom trotzdem neue XYZ-Kacheln nötig sein. Keine native iOS-/VoiceOver-Abnahme aus Chrom(i)um simulieren.
4. Volle Source/Core/Heavy/Security/Review-/Release-Gates nur im finalen Leitchat-PR, dann ZIP→Installer→Worker/Pages→Stable. #740/#839 bei Release-Sicherheit belassen.

**Extern geprüft:** <https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/> (GPU-Ready ist ein eigener Schritt). <https://leafletjs.com/reference-1.9.4.html> dokumentiert Leaflet-Optionen, ist aber **kein API-Vertrag des MID-Kartenrenderers**.

**NO READY · NO MERGE · NO RELEASE.**
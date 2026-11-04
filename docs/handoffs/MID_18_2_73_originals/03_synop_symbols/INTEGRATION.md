# SYNOP-/WMO-ww-inspirierte Modell-Niederschlagssymbole

**Basis:** v0.9.85.427 SHA `4d3051f80a17a180c3952c83bf5afa51623b1eb3`. **Status:** pure Codemap + ursprüngliche SVG-Plotformen, responsiver MapLibre-Marker-Kandidat, lokale isolierte Tests. **Kein amtliches WMO-Glyph-Faksimile, keine CI-/App-Abnahme.** Alter PR #480 ist ein .335-Draft und darf nicht direkt übernommen werden.

## Fachkonzept

- Originaler **Modellwetterinterpretationscode** und nur dieser darf den zugehörigen Plot auslösen, niemals reine Temperatur, Radarreflektivität oder abgeleitete Phase zu einer synthetischen SYNOP-**Stationsbeobachtung** umdeuten.
- `synopModelPlot.ts`: 33 explizite Codes (51/53/55, 56/57, 61/63/65/66/67/68/69, 71/73/75/77/78/79, 80–90, 95/96/97/99), Originaltexte mit Differenzierung. WMO 96/99 = **Gewitter mit Hagel**, 87/88 = Schneepellets oder kleiner Hagel; nicht einheitlich „Graupel oder Hagel“. Fehlende/ungültige/dry Codes erzeugen kein Symbol.
- `CloudWwMarkers.tsx`: Marker ausschließlich auf dem aktuellen geprüften Cloud-WW-Feld desselben Modells/Laufs/Termins, viewport-/zoomabhängig, begrenzt, 44px Touch, eigene dunkle/helle Palette, Herkunft, Modellcode und Zeit im Detail. Doppelte Regenmarker werden unter Radar vermieden; andere Niederschlagsphasen müssen mit OPERA-Validität abgeglichen werden.
- `sparseModelWeatherGlyphs`: alle Quell-ww-Codes je adaptivem Block inspizieren, **riskantesten Originalcode** übernehmen (keine Glättung). Isoliertes Gewitter/Hagel darf nicht wegen Stride-Sampling verlorengehen. Kein falscher Pixelwert im Zwischenraum.

## Integrationspunkte (nur auf autorisiertem neuen Sourcebranch)

1. Drei Dateien nach `src/` aufnehmen. `CloudWwMarkers` nur in dem tatsächlich sichtbaren `UnifiedWeatherMap`-Cloud-Layer und ggf. `NativeModelMap` `sigwx` mounten; Daten aus `cloudWeather.ready&&data` bzw. `combined` (nicht aus unpaarigem RUC-/Radarwert). Keine Marker über dem separaten ECCC GDPS WMS ohne echte, verifizierte WW-Rohcodes.
2. MapLibre `useMidMap`, `HtmlMarker`, `map.project`/`moveend`/`resize` und Styling am realen MID-JS/MapLibre-v6-Vertrag testen. Popups HTML-escapen und aria-Attribute/44px Ersttipper/Keyboard-Tabbability prüfen. Cluster und Legendeneinträge nicht doppelt darstellen. Fehlerzustand bei Modell-/Zeitmismatch anzeigen.
3. Nationale Wettercodes (DWD ICON-`WW`) gegen WMO 4677 und jeweils tatsächlich publizierte Modell-Code-Untermenge prüfen. Grund- und Phasentöne der MID-Matrix verwenden, keine kopierten WMO-Grafiken ohne Lizenznachweis. PNG/SVG/URL/Widgets/iOS dieselben Symbole oder explizite Herkunftsgleichheit; aktuelle Renderer nicht einfach mit Browser-HTML ersetzen.
4. Isolierte 4/4 Node-Fachtests sind grün einschließlich vereinzeltem 99er-Code im großen Raster. **Noch fehlen** reale O(6 Mio)-Worst-case Smartphone-Profiler, offizielle visuelle Einzelglyph-Abnahme, Live-ICON/OPERA-Sourcevergleich, Browser-Screenshots 320–1440, Exportparität, Vorschauregression, Source/Installer/Stable-Gate.

**WMO Primärreferenz:** https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM ; WMO-Manual No.306: https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-information-system-wis/about-manual-codes-volume-i2 .

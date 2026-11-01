# MID v0.9.85.396 – Pragmatischer A3/A4-Integrationsaudit

**Live-Source-Basis:** `MeteoMartini/MID`, v0.9.85.395, `main=mid-stable` SHA `bda6e60d37f2cac31b36e9993f5d6c045355d6ed`. Offizielle Veröffentlichung zuvor durch Installer #41288744774 erfolgreich. Fünf aktive Rulesets und Versionierungs-/Signaturverträge behalten.

## Drei zusammenhängende tatsächlich implementierte Pakete

1. **Original-WMS-Kartenexport statt irreführendem SVG:** `src/wmsOriginalMapExport.ts`, `src/WmsOriginalExportControl.tsx`, `src/wmsOriginalExport.css`, verbunden mit `src/UnifiedWeatherMap.tsx`, `src/WeatherMapsPanel.tsx` und `src/WmsProviderLegend.tsx`. Anbieterbild via bestehendem allowlisted Worker-`weather-map-wms` als WMS 1.1.1 `GetMap` mit `SRS=EPSG:3857`, exakt dem MapLibre-Ausschnitt, aktuellem WMS-Produkt, Stil, Lauf, Gültigkeit und gegebenenfalls Level. `GetLegendGraphic` muss zusätzlich als echtes Anbieter-PNG geladen und mit Quellen-/Lizenztext eingebettet werden. Leere/transparente Pixel bedeuten **nicht** 0. Die App behauptet **keinen** Export von Basiskarte, Radar, Satellit, amtlichen Warnungen, nativen numerischen Feldern oder Vektorgrafik. Ganze Anbieterbilder sind source-dependent; fehlende Bereitstellung bricht ab.
2. **Widgetpersistenz:** Zehn Auswahlschalter direkt beim Nutzerereignis in denselben Legacy-v5-Store, validierte v2–v5-Migration, explizites false, aktuelle Cross-Tab-Snapshots, Event-Synchronisation. Kein überschreibender Mount-/Unload-Effect, keine ungewollte Speicherung durch URL-/automatischen Bildexport.
3. **Kartenpersistenz:** Klassische Karte speichert Modell, Produkt, Niveau, Kartenbasis und Deckkraft sofort, liest die jeweils neueste Auswahl vor jedem Patch, synchronisiert andere geöffnete Tabs und setzt fehlende/null-Niveaus nicht als 0. Vorhandener v2-Key bleibt normativ.

## Fokussierte Regressionen ohne Inventarkürzung

- `scripts/test-unified-map-layers-0985167.mjs`: aus echter WMS-Implementierung transpilierte URL-/Bounds-/Run-/Time-/Level-/Stil-Konstruktion; zusätzliche negative Fälle mit unfreigegebenem Layer, verbotenem Stil, Null-/Ungültig-Zeit, Dateline/Mercator-Grenzen und Dimensionslimit; gesperrte UI bei unbestätigten Tiles. Echte klassische Kartenstore-Semantik mit parallelen Änderungen und Null-Level-Validierung.
- `scripts/test-widget-ensemble-selector-098414.mjs`: isolierte Ausführung der tatsächlichen Widget-v5-Parser-/Patch-Quelle, historische Migration, `false`, neue externe Tab-Schreibvorgänge und Storage-Denial; URL-only-Export darf den Store nicht ändern.
- Zusätzlich vollständige **1059/1059** Source-/Installer-Pflichtinventare, 38 Contracts, Versionsspiegel und Build 397 durch den bestehenden Releasepfad.

## Keine vorweggenommene Evidenz

Ein echter Layer-/Stil-/Provider-GetMap/Legend-Browserreadback und die abgenommene 320/390/430/768/1024/1440/1920-px-Matrix (Light/Dark/Touch/Fokus), reale iOS-/VoiceOver-Geräteabnahme, vorhandene Warnkarten und weitere A1/A2/A5-Module bleiben **separat** nachzuweisen. Provider-Ausfälle sollen keine ungetesteten Fake-PNGs auslösen. Anders als native numerische Raster sind WMS-Originalbilder reine visualisierte Felder.

## Quelle und Norm

- [ECCC GeoMet WMS-Dokumentation](https://eccc-msc.github.io/open-data/msc-geomet/wms_en/) zu GetMap, GetLegendGraphic, TIME und DIM_REFERENCE_TIME.
- [OGC WMS 1.1.1](https://cite.opengeospatial.org/teamengine/about/wms11/1.1.1/site/OGCTestData/wms/1.1.1/spec/wms1.1.1.html) zu SRS/BBOX/Styles.
- MID `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_STATE_INTEGRITY_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md`, `MID_PARAMETER_COLOR_CONTRACT.md` und Issues #508/#523.

**Releasepflicht:** Source-PR-Gate → kontrollierter SHA-Bot → serverseitiges Release-ZIP → `install-mid.yml` → Worker, Pages, Finalize → `mid-stable`. Ohne alle Gates kein erfolgreicher Produktivnachweis.

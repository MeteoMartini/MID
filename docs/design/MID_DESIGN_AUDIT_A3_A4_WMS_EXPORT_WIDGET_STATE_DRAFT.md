# MID-Designaudit 1.5 – A3/A4: Original-WMS-Kartenausschnitt exportieren und Widgetpräferenzen dauerhaft bewahren

**Status:** eigenständiger, **nicht freigegebener Draft**; Ausgangsbasis war die amtlich veröffentlichte Stable v0.9.85.394, SHA `d3e8446673488dc23d104b86d376c918524fa0be`. PR #564 reserviert .395 und integriert parallele disjunkte Klima-/Routen-/Saisonpersistenz sowie Workflow-/KNMI-Cleanup. Dieser Audit-Draft verändert **keinen** Release-Branch und keinen davon berührten Produktcode. Nach vollständiger .395-Promotion sind Quell-/Testblobs auf den frisch verifizierten Stable-Tree mit neuem Versions- und Releasevertrag selektiv zu integrieren.

## A3 – Pragmatischer echter WMS-Export statt SVG-/Canvas-Scheinparität

- **GetMap statt WebGL-Screenshot:** `src/wmsOriginalMapExport.ts` baut für die tatsächlichen MapLibre-Viewport-Grenzen ein einmaliges originales DWD-/ECCC-`GetMap` (WMS 1.1.1, EPSG:3857, originaler Layer/Stil, INIT, gültiger Termin, optionale Höhe/Druckfläche, PNG) ausschließlich über den bestehenden provider-/layer-allowlist-geprüften MID-Worker. Die identische EPSG:3857-Projektion wird bereits von `MapLibreCore.wmsTileUrl` für On-Screen-WMS verwendet. Begrenzte Anfragegröße und Projektion verhindern falsche Darstellungsmaßstäbe.
- **Originallegende:** Der bestehende `wmsProviderLegendUrl` erzeugt `GetLegendGraphic` für denselben Anbieter, Layer und Stil. Karte und Legende müssen beide als echte PNGs verfügbar und dekodierbar sein; fehlende Bilddaten, Bildmaßabweichungen, ungültige Zeiten/Bounds/Stile, nicht freigegebene Produkte/Provider oder veraltete Modell-/Levelkontexte brechen die Ausgabe ab. Keine aus Bildpixeln erfundenen numerischen Klassen oder geglätteten Extreme.
- **Benutzbare Ausgabe:** `WmsOriginalExportControl` benutzt in beiden Karteneinstiegen denselben Source-Code, 44px-Touchziel, Tastaturfokus und Fehlerstatus. Beim Wechsel von Lauf/Termin/Stil/Niveau werden laufende Downloads abgebrochen. Für `WeatherMapsPanel` darf erst nach tatsächlich bestätigtem WMS-Tile und ohne Animation exportiert werden; für `UnifiedWeatherMap` erst nach bestätigtem gleichen WMS-Key und abgeschlossener Zeitleistenumschaltung.
- **Expliziter Umfang:** Das resultierende PNG enthält **nur** die originale WMS-Wetterfläche, die originale Anbieterlegende und Titel, INIT, Gültigkeit, Niveau, Stil sowie Quellen-/Lizenzlabel. Basiskarte, Raster-Ortswerte, Radar-/Satellitenmontage, Warnlayer und sonstige MID-Konturen **nicht** im Export. Das ist **kein** vektorieller SVG-Export und keine numerische Rasterdatei. Der bestehende native PNG-/SVG-Export bleibt unverändert.

## A4 – Widgetpräferenzen als sofortige Nutzeraktionen

- `WidgetGenerator` speicherte zuvor zehn Widgetauswahlen ausschließlich in einem nachgelagerten Effect, der beim Mount/Re-Mount veraltete Defaults über einen bereits jüngeren Tabwert schreiben konnte. Jetzt schreibt **jede echte Nutzeraktion** atomar aus der zuletzt gespeicherten v5-Konfiguration unter dem unveränderten Legacy-Key. Weder das URL-Exportprofil noch initiale Defaults werden in den Nutzer-Storage zurückgeschrieben.
- Eine `storage`-/gleicher-Tab-Eventsubscription synchronisiert aktive Widgets; `false`, gültige 3–7 Tage, Darstellungs- und Ensemblemetriken und die v2/v3/v4→v5-Migration bleiben erhalten. Storage-Denial/Quota stürzt die aktive Anzeige nicht ab.
- Alle bestehenden fachlichen Widgetdarstellungen, Parameterpaletten, Ensemble-/Skybarwerte und URL-Exportvarianten bleiben unverändert.

## Prüfung / harte Grenzen

- `scripts/test-unified-map-layers-0985167.mjs` (bereits Pflichtinventar) enthält dynamische, aus der echten TS-Quelle transpilierte GetMap-Planungsfälle, einschließlich verbotener Layer, fehlendem/verkehrtem Termin, ungültigem Stil, Dateline-/Projektions- und Größenfehlern sowie beiden echten UI-Bindungen.
- `scripts/test-widget-ensemble-selector-098414.mjs` (bereits Pflichtinventar) führt die echte v5-Speicherlogik mit simuliertem Storage adversariell aus: `false`, Migration, konkurrierende Tab-Änderung, Quota/Denied und URL-Schutz.
- **Nicht behauptet und noch erforderlich:** erfolgreiche GitHub-CI-Gates auf *frisch promoteter* Basis, echte DWD-/ECCC-Live-GetMap-/GetLegendGraphic-Readbacks für verschiedene Produkte/Lauf-/Level-/Styles, WMS-Originalrechte, PNG-Render-/Positionierungsabnahme bei 320/390/430/768/1024/1440/1920 in Light/Dark, reale iOS-/VoiceOver-Abnahme. Externe WMS-Anbieter können einzelne Bildgrößen/Stile nicht bedienen; dann klare Fehlermeldung und **kein** unbestätigter Export.
- Kein externes kostenpflichtiges Produkt. Keine veränderten Warnungen, RUC-/Niederschlagsdaten, Lauf-/Zeitsemantik oder Production-Worker.
- Vollständiger Releasepfad nach neuer Stable: verifizierter Branch/PR → tatsächliches Source-Gate → kontrollierter SHA-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable; 1059 Pflichtregressionen und 38 Normverträge unangetastet.

## Normative Quellen

OGC Web Map Service 1.1.1 https://opengeospatial.github.io/ets-wms11/OGCTestData/wms/1.1.1/spec/wms1.1.1.html
ECCC GeoMet WMS/GetMap/GetLegendGraphic https://eccc-msc.github.io/open-data/msc-geomet/wms_en/
MID normativ `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_PARAMETER_COLOR_CONTRACT.md`, `MID_STATE_INTEGRITY_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md`.

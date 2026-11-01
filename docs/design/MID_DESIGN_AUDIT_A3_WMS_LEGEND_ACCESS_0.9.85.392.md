# MID-Designaudit #523 – A3 Anbieterlegenden und Exportprovenienz · v0.9.85.392

**Verifizierte Ausgangsbasis:** veröffentlichte v0.9.85.391, `main=mid-stable` SHA `79b3a8cb995f780c863d6f4b1762155f80e09a15`. Dies ist keine Behauptung einer veröffentlichten .392; Source-/Installer-Gates sind getrennt zu prüfen.

## Festgestellte Architektur
- Die DWD-/ECCC-Originalkarten sind WMS-GetMap-Bitmaps. Sie sind nicht dasselbe Datenprodukt wie MID-native numerische Raster, für die bereits eine eigene PNG-/SVG-Exportpipeline und Skalenidentität existiert.
- Die GetLegendGraphic-Route benutzt im Client `layers/styles`; der bereits vorhandene Worker prüft die Provider-/Layer-Allowlist, setzt für das **Upstream-GetLegendGraphic** `layer/style` (Singular) und entfernt die Pluralparameter. Die offizielle GeoMet-WMS-Dokumentation verlangt explizit `STYLE` statt `STYLES`; die Konvertierung ist bereits korrekt und wird nun durch den verpflichtenden A3-Regressionscheck geschützt.
- Die gemeinsame `WmsProviderLegend` wird in Unified-/Legacy-Karten erst nach bestätigten WMS-Kacheln für das gewählte Produkt, den Modelllauf, Zeitpunkt, Stil und gegebenenfalls das Niveau angezeigt.

## Qualifizierte Verbesserung
- Anbieter-Originalbild kann separat in voller Größe betrachtet werden, über **denselben** allowlist-geschützten Proxy. Kein fremdes Ziel, `noopener noreferrer`, beschriftetes 44px-Touchziel, sichtbarer Tastaturfokus und schmale Viewports berücksichtigt.
- Ein Fehlerstatus gilt für seine **konkrete Bild-URL**; spätere legitime Anbieter-/Stilwechsel dürfen durch frühere Fehler nicht als defekt erscheinen.
- Die Bildbeschreibung bezeichnet wahrheitsgemäß eine grafische Originallegende; es wird keine aus einer Bitmap erschlossene numerische Texttabelle, keine DWD-Warnskala und kein WCAG-2.2-AA-Zertifikat behauptet.
- Ein expliziter Hinweis erklärt, dass externe WMS-Karten weiterhin **keinen** qualifizierten MID-PNG-/SVG-Kartenexport haben. Native Rasterexporte werden nicht als WMS-Export ausgegeben.

## Fortbestehende P1-A3-Abnahmen
1. Echte, zeitgestempelte DWD-/ECCC-GetLegendGraphic-Readbacks pro konkretem angebotenem Layer und Stil, einschließlich Providerfehler und Proxy-CORS.
2. Exportparität nur nach Freigabe von GetCapabilities-/GetMap-Operationen, tatsächlichem Kartenausschnitt/CRS, INIT, ValidTime, Druck-/Höhenniveau, Stil, Farb- und Quelle/Attribution, Fehler-/NoData-Semantik und Nutzungslizenzen.
3. Anbieterbestätigte numerische Farbklassen als barrierefreie Tabelle; keine OCR, keine geratenen Schwellen und keine künstliche Palette.
4. Responsive/Light-Dark/Touch/Keyboard/Focus/Reload auf 320–1920 px, echte Browser-/iOS-/VoiceOver-Abnahme; Source-Assertions allein reichen nicht.
5. Alle 1059 bestehenden Pflichtregressionen und der vollständige SHA-gebundene Source-/Bot-/ZIP-/Installer-/Worker-/Pages-/Stable-Releasepfad.

**Unverändert:** DWD/WMO-Warnungen, RUC, Modellzeiten, reale Wetterextreme, meteorologische Werte und native Exportprodukte. PR #555 ist ein eigenständiger RUC-Full-Domain-Draft ohne App-Release und bleibt unberührt.

**Normative Referenz:** ECCC WMS https://eccc-msc.github.io/open-data/msc-geomet/wms_en/ (GetLegendGraphic, STYLE-Singular und Dimensions). DWD WMS https://www.dwd.de/DE/wetter/warnungen_aktuell/objekt_einbindung/einbindung_karten_geodienste.pdf

# Designaudit A3 – WMS-Originallegenden in der gesamten Karten-Navigation (v0.9.85.391)

## Basis, Provenienz und Regressionsverträge
Aktuelle und vollständig veröffentlichte Stable ist v0.9.85.390, SHA `8a886b3695ca0ae6ae94e7c18b1bfeb790ddb0a2`. Der bereits gesicherte Draft #552 @ `5cbfa528680fbd0a23e07d63d039df4e80f7eecc` stammte noch aus .389 und wird nicht blind gemergt. Neue Integrationsänderung ausgehend von .390 beinhaltet den dort bereits geprüften `weatherMapFrameReady`-Validator, dessen WMS-Produkt-/Lauf-/ValidTime-/Level-Testfälle, den Anbieter-WMS-Legenden-Builder, die responsive Legendenkomponente und ergänzte Legacy-Kartenparität.

## Fachliche Umsetzung
Beide WMS-Kartenoberflächen beziehen Anbieterlegenden über die vorhandene geschützte Worker-Route `weather-map-wms` mit `GetLegendGraphic`. Der Kartenprodukt-Layer muss im erlaubten Produktkatalog stehen, Provider und selektierter Style müssen passen; Original-PNG statt geschätzter Farbklassen. Quelle, Produktidentität und aktiver WMS-Stil bestimmen die URL; erst nach bestätigtem Kachelabruf ist eine Legende sichtbar. Bei fehlenden Grafiken erscheinen klare Fehlermeldungen, nicht synthetische Grenzwerte und nicht 0. Die native `ModelMapScaleLegend`, meteorologischen Skalierungen, RUC und DWD-Warnlogik bleiben unberührt.

## QA/Abnahmegrenzen
Pflichtmatrix mit 1059 Regressionen und 24 Browserfällen bleibt vollumfänglich. Der vorhandene Test `scripts/test-unified-map-layers-0985167.mjs` führt die funktionale URL-Layer-/Provider-/Style-Validierung aus und überprüft beide UI-Renderpfade; echtes Provider-/GetLegendGraphic-Lesen und WCAG-taugliche Textalternativen aller Farbintervalle stehen noch aus. Kein Screenshot-/Simulatorbefund als echte iOS-/VoiceOver-Abnahme ausgeben. `#523` bleibt offen für A3-Export, A4/A5, Persistenz- und Responsive-Restarbeiten.

## Veröffentlichungsgrenze
Keine Veröffentlichung, bevor Source-Gate, kontrollierter SHA-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-SHA nachweisbar erfolgreich sind.

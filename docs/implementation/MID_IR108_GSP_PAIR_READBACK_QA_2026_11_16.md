# MID-Karten P1: unabhängige IR10.8/GSP-Paarintegrität (QA-only)

**Basis:** mid-stable v0.9.85.485, SHA ccd1c0f60d67925aa01dd8d946b490fde4142709. Diese QA ist keine Produktionsaktivierung. Der Ursprung sind private zehn Original-Rasterpaare aus Karten-Draft #832, erzeugt durch tools/ruc/ir108_gsp_native_preview.py unter Schema mid.ir108-gsp.original-native-preview.shadow.v1 nach separater 40-GRIB/ecCodes-/Run-/SHA-/Lookup-Prüfung.

## Absicherung zwischen Rastererzeugung und einer späteren Veröffentlichung

Der rein lesende tools/ruc/qa_ir108_gsp_rendered_pair.py kontrolliert das **fertige private Ausgabeformat** nach dem Rasterprozess. Ziel ist, defekte, verschobene, aus alten Läufen stammende oder nachträglich geänderte Bildpaare vor einer späteren Kandidatenweitergabe zurückzuweisen.

- Genau zehn echte UTC-Viertelstundenpaare, ein Modelllauf, konservativer +14h-Shadowhorizont (die früheren +27h-Originalbefunde erteilen keine pauschale Produktionszulassung).
- Quellenmodell DWD ICON-D2-RUC, nativer 542040-Punkte-Nachweis, nearest-native-cell, begrenzte north-up-Geometrie, konstante 170–340 K nur zur IR-**Visualisierung**. Weder CLCT noch WMO-4677-Wettercodes.
- Gebundene Lookup-/RUC- und zwei separate Originalmanifest-SHAs, pro privater Datei SHA256 und Länge, streng festgelegte 20 Asset-Namen, kein Verzeichnis-Fremdinhalt, keine Symlinks oder Traversal.
- PNG-RGBA8 und zlib-uint8-Phasenraster werden mit CRC, Größenlimit, Alpha-/NoData-Masken und tatsächlicher Pixelzählung **zurückdekodiert**. Phasen-ID 255 (NoData) ist von ID 0 (no_gsp_signal) strikt getrennt. ID 0 ist keine meteorologische Entwarnung.
- Der Prüfer lässt keine Release-/Observation-/Official-WMO-Behauptung zu und gibt selbst bei Erfolg activationAuthorized:false, releaseAuthorized:false aus.

## Tests und Verwendung

Python-Testkommando:

    python3 -m unittest discover -s tools/ruc -p test_qa_ir108_gsp_rendered_pair.py -v

Readback nur auf einem **privaten** Kandidatenverzeichnis:

    python3 tools/ruc/qa_ir108_gsp_rendered_pair.py --private-preview /private/staging/ir108-gsp-preview

**17 lokale positive/negative Tests**, ausschließlich synthetische private 2x2-Bytes. Diese sind kein erneuter amtlicher GRIB-Download und keine echte Produktionsprüfung. Kein Worker, Client, ZIP, Installer, neuer Actions-Workflow oder Secret geändert. Der Prüfer liest nur private Daten; Roh-GRIBs, Pixelbilder und Ortsmetadaten niemals ungeprüft als öffentliche CI-Artefakte ausgeben.

DWD-Primärquellen: [ICON Database Reference v2.5.2 (2025), Kapitel 11](https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf) und [DWD ICON-D2-RUC Produktverzeichnis](https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/). In der Referenz steht noch +14h; +27h in früheren MID-Datenchecks gilt ausschließlich für die konkret nachgewiesenen Originalläufe.

**Verbleibende Gates:** Die echte zugelassene IR-/GSP-Originaldatenquelle und Verträge von #832, private unveränderliche Pixel-/Source-SHA-Readbacks, vollständige atomare Publish-/Rollback-Semantik, Benutzer-Renderer mit eindeutiger Quelle/Run/ValidTime und Legende, Browser-Matrix, iOS/VoiceOver, vollständiger Source-PR- und etablierter MID-Releasepfad. Dieser unabhängige Post-Render-Prüfer ersetzt keinen dieser Nachweise.

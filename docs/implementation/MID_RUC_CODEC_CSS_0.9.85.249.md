# MID v0.9.85.249 – RUC-Transportkandidat und nachvollziehbare CSS-Startlast

## Verifizierte Basis
Am 13. Oktober 2026: GitHub \`mid-stable\` und \`main\` identisch auf \`8ca975942540ee45471e6e321750905e3edbbaef\`, Version 0.9.85.248. Isolierter Integrationsbranch \`chatgpt/v0.9.85.249-ruc-codec-css-evidence\`. Der Source-PR/Installer/Pages-/Worker-/Stable-Veröffentlichungsweg bleibt unverändert.

## Tatsächliche RUC-Speichermessung, kein hypothetischer Datensatz
GitHub Actions \`38462012712\`: erfolgreicher Lauf 2026-10-13T19:00 UTC mit veröffentlichten 898.868.234/900.000.000 Bytes. Worker-/Pages-Health nach Publikation erfolgreich: Backend Pages, 542.040 Punkte, 20 EPS-Mitglieder. Der vollständige, bitidentisch rückgeprüfte Storage-Audit liefert \`gzip: 345361022\` und \`byteplanesGzip: 294511547\` Kandidaten-Bytes. Letzteres entspräche *theoretisch* 604.356.687 weniger Bytes – die Produktion verwendet weiterhin die bisherigen unkomprimierten Chunk-Formate. Der Audit berücksichtigt nicht zu komprimierende Dateien unverändert. Keine Behauptung über eingesparte Bandbreite oder Decoderlaufzeit.

### Wissenschaftlicher Befund zur Modelldichte
Das tatsächliche 19-UTC-Manifest enthält D2-Wolken/WW-Zeiten +1…+12,+15,+18,+21,+24,+30,+36,+42,+48; neue +13/+14/+16/+17 wurden nicht veröffentlicht. Platz und Herkunft/Verfügbarkeit bleiben limitierend; niemals künstliche oder leere Wettercodefelder einfügen.

## Neuer Prototyp – ausschließlich Offline-Tests
\`tools/ruc/lossless_codec_pilot.py\` definiert ein **nicht produktives** \`mid.ruc.lossless-candidate.v1\`-Manifest mit Codecnamen, Original-/Wire-Länge und getrennten SHA-256-Werten. Drei Verfahren: gzip, byteplanes-gzip, delta-byteplanes-gzip, jeweils mit deterministischem gzip (mtime=0).

\`tools/ruc/test_lossless_codec_pilot.py\` verifiziert alle 65.536 vorzeichenbehafteten 16-Bit-Muster inklusive des Missing-Sentinels (-32768), Original-Wire-Gleichheit, Wiederholbarkeit, Größen- und Alignment-Grenzen, Manipulation, abgeschnittene und angehängte Daten sowie begrenzte Dekompression. Die Tests laufen zusätzlich beim bereits bestehenden Offline-RUC-Test. Produktions-Encoder, Worker, Pages-Manifest, RUC-URLs und JS-Decoder bleiben unverändert. Keine alleinige Freigabe zur Aktivierung.

## CSS: echte initial verlinkte Produktion statt Quellgrößen
Der bisherige Cascade-Golden-Test bleibt vollständig. Er protokolliert zusätzlich bei vorhandenem Produktionsbuild die direkt aus \`dist/index.html\` eingebundenen Stylesheets mit tatsächlich roh/gzip/Brotli-komprimierten Größen und Assetidentität. Das ist eine **Delivery-Messung**, keine gemessene FCP-/INP-Verkürzung oder Computed-Style-/Paint-Parität; Lazy-Routen und ggf. zusätzliche spätere Styles werden ausdrücklich nicht als Startpaket gezählt. Kein CSS wird aus der 70-teiligen Kaskade entfernt. Issue #344 bleibt für den visuellen Pilot offen.

## Getrennte offene Schritte und Gates
Vor einer echten Transportmigration: JS- und Worker-Dual-Read, Größenlimite in Browser/Worker, NoData-/Raster-/Zeit-Invarianten, Cache- und Versionskompatibilität, Mobile-Decode-/RAM-Benchmarks, Hash-/Recovery-Tests, vollständige RUC-Pages-/Frische-Messung und Rollback-Strategie; danach erst zusätzliche Modelldaten oder Karten. Replit-Handoff nur nach SHA-verifizierter Neuorientierung und geklärten Least-Privilege-Rechten; physische WKWebView-/VoiceOver-Abnahme nicht behaupten. Live-Veröffentlichung ausschließlich bei grünen etablierten Gates.

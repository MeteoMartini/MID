# MID .257 — isolierter RUC-Transportcanary

Basis: main=mid-stable 8cd16809452617b4d38917c798f2fb849625b355 (.256, PR #363). Keine offenen überlappenden PRs bei Beginn. .254-Katalogkorrektur und .255-Browserlastverbesserung sind bereits integriert. Die Decoderentwicklung aus MID 18.2.31 wird verwendet, nicht erneut implementiert.

## Tatsächliche Infrastruktur
`ci/github/workflows/mid-ruc-preprocess.yml` und `install-mid.yml` veröffentlichen statische RUC-Dateien per GitHub Pages. Der Cloudflare-Worker konsumiert `https://midwx.app/ruc/`. Cloudflare-Pages-`_headers` sind daher keine gültige Migrationsstrategie auf diesem Ursprung. Offizielle Header-/Hostingreferenz: https://developers.cloudflare.com/pages/configuration/headers/ und https://developers.cloudflare.com/pages/configuration/serving-pages/; eine Headerbeschreibung allein ersetzt keinen echten Origin-Nachweis.

## Getrennte Prüfung
`/diagnostics/ruc-codec-v1/` enthält ausschließlich synthetische Dateien. Drei unveränderliche SHA-benannte Codecdateien stellen alle 65.536 int16-Muster wieder her. Kleine separate Rohdatei prüft bytegetreues Legacy-Lesen einschließlich 0, Missing=-32768, 32767, -1 und weiterer Worte. Der volle Originalvektor wird im Prüfer deterministisch erzeugt; eine redundante 128-KB-Rohdatei wird nicht ausgeliefert. Keine Wetterfelder, Zeiten oder RUC-Manifeste verändert.

Python erzeugt Fixtures mit dem vorhandenen .249-Codec. Browser und Worker verwenden unverändert den .256-Decoder. Generator kopiert die kanonischen Module bytegleich in die statische Diagnose und erzeugt denselben Code als eigenen Worker-Teil. Beide bestehenden Aggregate-Paritätstests enthalten den neuen Teil; zusätzlich wird seine genaue Ableitung geprüft. Keine parallele Decoderkopie mit unabhängiger Logik.

Browserprobe auf expliziten Klick: bounded HTTP-Read, SHA des gesamten erwarteten Manifests, rohe Altdatei, Wire-SHA/Länge vor Decode, Original-SHA/Länge und sämtliche Muster danach. Drei CacheStorage-Roundtrips mit zufällig benanntem separatem Cache, anschließend ausschließlich dessen Löschung. Bestehende App-/Service-Worker-Caches bleiben unberührt. Wiederholte Prüfungen an 390/844/1024/1440px. Negativfall mit tatsächlichem HTTP Content-Encoding:gzip: Browser entpackt automatisch; diese Bytes müssen vom opaken Wire-Prüfer abgewiesen werden, keine stille Reinterpretation.

Worker `mode=ruc-codec-canary`: fest eingebauter Ursprung und Pfad, keine frei wählbaren URLs, kein RUC-Hauptproduktzugriff. Gleicher bounded Prüfer, 20s Deadline, synthetisches Ergebnis mit `productionEnabled:false`; Fehler ergeben 503 und `verified:false`. Ergebnis nie als RUC-Frische oder produktive Freigabe behandeln. Die Route ist keine Datenmigration.

## Abnahme und nächste Stufe
Pflicht-Coretest prüft beide Consumer, 65.536 Muster, feste URL, SHA-/Längen-/HTTP-/Übergrößenfehler und 503. Browser-Negativtest erhält seine Fehlermeldung/strikte Verifikation. Lokale und Source-/Installer-Tests am finalen SHA erforderlich, danach öffentliche Diagnose und tatsächlich deployte Worker-Route lesen. Synthetische Dateigrößen/Zeiten erlauben keine Produktionskompressions- oder RAM-/CWV-Aussage und keine physische iOS-/WKWebView-Abnahme.

Produktive grid.v2-Chunks, Speichergrenze 900.000.000 B, App-RUC-Consumer und Datenvertrag bleiben unverändert. Erst nach echtem Transportnachweis versionierte Dual-Read-Migration mit separaten immutable Keys, realen Feldern, Cache-/Rollbackbelegen und Frische-/Watchdogprüfung. Alte Schlüssel niemals mit Byteplanes überschreiben.

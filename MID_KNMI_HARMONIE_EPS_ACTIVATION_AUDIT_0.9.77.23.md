# MID v0.9.77.23 – KNMI HARMONIE EPS Aktivierungs-Audit (Abschnitt 4/4)

Stand: 2026-09-02

## Ziel

Abschnitt 4/4 soll den in `tools/knmi_eps_decoder/` vorbereiteten KNMI-HARMONIE-AROME-Cy43-P4a-Punktdecoder real Ende-zu-Ende aktivieren und gegen den produktiven MID-Worker verifizieren. Das Aktivierungsziel bleibt kostenneutral, solange der Nutzer keine kostenpflichtige Infrastruktur ausdrücklich freigibt.

## Geprüfte Runtimepfade

### Cloudflare Python Workers

Cloudflare Python Workers laufen in Pyodide/WebAssembly. Unterstützt werden reine Python-Pakete, PyEmscripten-Wheels und Pakete aus der Pyodide-Distribution. Der MID-Referenzdecoder nutzt `eccodes`, dessen Python-Bindings die native ECMWF-ecCodes-Bibliothek benötigen. Das aktuelle `eccodeslib` veröffentlicht Binärwheels für Linux/macOS, aber keinen für diesen Pfad geeigneten PyEmscripten-/WebAssembly-Build. Der Referenzdecoder kann deshalb derzeit nicht unverändert in einem normalen kostenfreien Python Worker betrieben werden.

Referenzen:
- https://developers.cloudflare.com/workers/languages/python/packages/
- https://developers.cloudflare.com/workers/languages/python/how-python-workers-work/
- https://pypi.org/project/eccodes/
- https://pypi.org/project/eccodeslib/

### Cloudflare Containers

Ein Container ist technisch geeignet, weil dort Python plus native ecCodes-Bibliothek betrieben werden kann. Nach der Cloudflare-Preisliste sind Containers im Free-Plan jedoch nicht enthalten; der Einstieg erfolgt über Workers Paid mit einer Mindestgebühr von 5 USD/Monat. Nach `MID_COST_GOVERNANCE_CONTRACT.md` wird dieser Pfad ohne ausdrückliche Nutzerfreigabe **nicht aktiviert**.

Referenz:
- https://developers.cloudflare.com/containers/platform/pricing/

### KNMI EDR als decoderfreier Ersatz

Die aktuelle KNMI-EDR-Dokumentation bietet räumlich-zeitliche Punktabfragen für vorhandene Collections. Die derzeit öffentlich dokumentierten Collections umfassen jedoch nicht `harmonie_arome_cy43_p4a`. EDR ersetzt daher den P4a-GRIB-Decoder aktuell nicht.

Referenz:
- https://api.dataplatform.knmi.nl/edr/v1/docs

## Neu geprüfter kostenfreier Wasm-/Queue-Pfad

Mit `@meri-imperiumi/eccodes-wasm` existiert inzwischen ein Apache-2.0-Wasm-Build von ECMWF ecCodes mit GRIB1/GRIB2-Unterstützung. Die veröffentlichte Distribution ist noch **kein drop-in Worker-Free-Decoder**: sie ist Node/CommonJS-orientiert, baut standardmäßig wasm64 mit NODEFS und 64 MB Initialspeicher, exportiert keinen schmalen `codes_grib_find_nearest`-Pfad und muss gegen Cloudflares 3-MB-gzip-, 128-MB-RAM- und 10-ms-HTTP-CPU-Limits geprüft werden. Cloudflare untersagt außerdem das dynamische Kompilieren bzw. Instanziieren von Wasm aus einem zur Laufzeit geladenen Buffer.

Parallel ist Cloudflare Queues inzwischen im Free-Plan verfügbar. Mit 10.000 Operationen/Tag und bis zu 5 Minuten Consumer-CPU kann ein **asynchroner** Decode→numerischer-KV-Cache prinzipiell das 10-ms-HTTP-Limit umgehen. Dieser Weg erfordert jedoch eine neue Queue-Ressource und eine sichere Behandlung kurzlebiger Signed URLs; er wird daher erst nach einem fokussierten Wasm32/MEMFS/Nearest-Point-Prototyp aktiviert.

Der verbindliche technische Prüfplan steht in `MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md`. Es wird in diesem Release weder eine Wasm-Dependency noch eine Queue hinzugefügt.

## Aktuelle Upstream-Situation

KNMI hat am 27.08.2026 Wartungsarbeiten am UWC-West-HPC für den Zeitraum 01.–09.09.2026 angekündigt. Für Ensemble-Datensätze einschließlich `harmonie_arome_cy43_p4a` sind an den Wartungstagen zeitweise keine neuen Updates zu erwarten. Eine fehlende oder veraltete P4a-Datei während dieses Fensters darf deshalb nicht automatisch als MID-Fehler interpretiert werden.

Referenz:
- https://developer.dataplatform.knmi.nl/news

## Ergebnis / verbindliches Gate

Abschnitt 4/4 ist **technisch vorbereitet, aber nicht aktiviert**. Ein kostenfreier Wasm-/Queue-Kandidat ist identifiziert, muss jedoch vor jeder Infrastrukturänderung erst reproduzierbar gegen Bundle-, RAM-, CPU- und P4a-Korrektheitsgrenzen validiert werden.

Aktivierung ist erst zulässig, wenn mindestens eine der folgenden Bedingungen erfüllt ist:

1. ein bereits vorhandener, kostenfreier HTTPS-Runtimepfad kann Python + native ecCodes sicher betreiben;
2. `ecCodes`/ein gleichwertiger validierter GRIB1-Decoder steht als für Cloudflare geeigneter Wasm-/PyEmscripten-Build zur Verfügung;
3. ein eigener JavaScript-/Wasm-GRIB1-Punktdecoder wurde gegen reale KNMI-P4a-Referenzdaten und ecCodes-Ergebnisse verifiziert und hält Worker-CPU-/RAM-Grenzen ein;
4. der Nutzer gibt einen kostenpflichtigen Container-/Hostingpfad nach transparenter Kostenangabe ausdrücklich frei.

Bis dahin bleiben Cache, Worker-Rolling-Manifest und externer Decoderquellstand vollständig erhalten und fail-soft. Es wird **kein** API-Schlüssel in Frontend/Repository eingebettet, keine kostenpflichtige Ressource angelegt und kein zweiter KNMI-Listing-/TAR-Indexpfad eingeführt.

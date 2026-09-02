# MID v0.9.77.23 – KNMI HARMONIE EPS Wasm-/Free-Runtime-Machbarkeit

Stand: 2026-09-02

## Ziel

Dieser Nachweis präzisiert Abschnitt 4/4 der KNMI-HARMONIE-AROME-Cy43-P4a-Integration. Er erlaubt **keine Aktivierung**, sondern definiert den nächsten kostenneutralen Prototyppfad. Cache, Rolling-Manifest und der Python/ecCodes-Referenzdecoder bleiben die fachliche Referenz.

## Kandidat A – `@meri-imperiumi/eccodes-wasm`

Der neu verfügbare Apache-2.0-Build kompiliert ECMWF ecCodes nach WebAssembly und unterstützt laut Projekt GRIB1/GRIB2. Damit ist erstmals ein fachlich passender Wasm-Ausgangspunkt vorhanden.

Die veröffentlichte Distribution wird dennoch **nicht direkt** in den MID-Worker aufgenommen:

- Paket-Engine Node >=24, während MID derzeit reproduzierbar Node 22 verwendet.
- High-Level-Wrapper ist CommonJS und nutzt Node-`require`, `path`, `fs` und NODEFS-Fallbacks.
- Das veröffentlichte Buildskript erzeugt standardmäßig wasm64, bindet `-lnodefs.js` ein und startet mit 64 MB Wasm-Speicher bei bis zu 512 MB Wachstum.
- Der Wrapper exportiert allgemeine Schlüssel-/Arrayzugriffe, aber keinen dem Python-Referenzpfad entsprechenden `codes_grib_find_nearest`-Aufruf. Ein Vollgitter-Decoding nur für einen Punkt wäre für MID fachlich und ressourcenseitig nicht akzeptabel.
- Cloudflare Workers Free begrenzt den komprimierten Worker auf 3 MB, den Isolate-Speicher einschließlich Wasm auf 128 MB und HTTP-CPU auf 10 ms.
- Cloudflare erlaubt zur Laufzeit kein `WebAssembly.compile` und kein `WebAssembly.instantiate(ArrayBuffer)`; ein Wasm-Modul muss als vorcompiliertes Worker-Modul gebündelt werden. Ein großes Wasm-Binary kann deshalb nicht einfach als Static Asset nachgeladen und dynamisch kompiliert werden.

### Zulässiger Prototyp

Nur ein **eigener reproduzierbarer Build** darf weiter untersucht werden, der mindestens:

1. wasm32 statt wasm64 nutzt,
2. NODEFS/Node-spezifische Laufzeitpfade entfernt und ausschließlich MEMFS/in-memory arbeitet,
3. einen schmalen C/JS-Export für GRIB1-Metadaten + nächstgelegenen Punkt bereitstellt,
4. keine Vollgitterarrays nach JavaScript kopiert,
5. Initialspeicher deutlich unterhalb des 128-MB-Isolatebudgets hält,
6. resultierendes gzip-Bundle und Worker-Startup gegen das Free-Limit misst,
7. gegen reale P4a-Nachrichten und den Python/ecCodes-Referenzdecoder numerisch verifiziert wird.

Ohne diese Nachweise darf der Wasm-Kandidat keine Produktionsdependency werden.

## Kandidat B – asynchroner Cloudflare-Queue-Consumer

Cloudflare Queues ist im Workers-Free-Plan verfügbar. Der Free-Plan umfasst 10.000 Queue-Operationen/Tag; Queue-Consumer können laut Plattformlimit mit bis zu 5 Minuten CPU laufen. Das eröffnet einen kostenneutralen **asynchronen** Pfad, falls der fokussierte Wasm-Decoder zwar das 10-ms-HTTP-Limit überschreitet, aber innerhalb von RAM-/Bundlegrenzen bleibt.

Verbindlicher Entwurf:

1. Der bestehende HTTP-Worker bleibt schnell und fail-soft.
2. Bei fehlendem numerischen KNMI-Punktcache wird höchstens ein deduplizierter Decode-Auftrag erzeugt.
3. Der Queue-Auftrag enthält nur die bereits vom Worker erzeugte Manifest-/Punktinformation; er darf kein zweites KNMI-Listing oder TAR-Indexing einführen.
4. Der Consumer dekodiert asynchron und schreibt ausschließlich numerische Punktresultate in einen getrennten Cachepräfix des bestehenden KV-Vertrags.
5. Signed URLs dürfen weder als persistenter Queue-Datensatz über ihre erforderliche Kurzlebigkeit hinaus noch im KV landen. Vor einer echten Umsetzung muss deshalb geprüft werden, ob die URL-Lebensdauer mit Queue-Latenz/Retry sicher vereinbar ist; andernfalls muss der Consumer über einen kurzlebigen Worker-Refetch-Vertrag neue URLs beziehen, ohne den TAR-Index neu aufzubauen.
6. Ein erster Nutzerrequest darf niemals auf das Queue-Ergebnis blockieren; der bestehende Ensemble-Fallback bleibt aktiv. Ein späterer Refresh kann den numerischen Cache verwenden.
7. Queue-Operationen müssen budgetiert und dedupliziert werden. Es wird **keine Queue angelegt**, bevor Bundle/RAM/Decoderkorrektheit lokal bzw. in einer isolierten Testumgebung nachgewiesen sind.

## Nicht geeigneter aktueller Ersatz

`@mattnucc/gribberish` besitzt inzwischen GRIB1-Strukturen im Rust-Kern, die veröffentlichte JavaScript-/WASI-Schnittstelle ist jedoch als GRIB2-Reader dokumentiert. Sie ist daher derzeit kein gleichwertig validierter P4a-Ersatz und wird nicht in die Produktionsabhängigkeiten aufgenommen.

## Entscheidung

Abschnitt 4/4 bleibt offen, ist aber **nicht mehr ausschließlich an einen kostenpflichtigen Container gebunden**. Der bevorzugte nächste Forschungsweg ist:

**fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Prototyp → Bundle/RAM/CPU-Benchmark → bei >10 ms optional Free-Queue-Consumer → reale P4a/ecCodes-Gegenprüfung → erst dann Infrastrukturaktivierung.**

Bis dahin: keine neue Dependency, keine Queue, keine neue Cloudflare-Ressource, kein kostenpflichtiger Plan und keine Änderung des produktiven Workerpfads.

## Externe Referenzen

- ecCodes-Wasm: https://github.com/meri-imperiumi/eccodes-wasm
- Cloudflare Workers Limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare WebAssembly/Web-Standards: https://developers.cloudflare.com/workers/runtime-apis/webassembly/ und https://developers.cloudflare.com/workers/runtime-apis/web-standards/
- Cloudflare Queues Pricing/Limits: https://developers.cloudflare.com/queues/platform/pricing/ und https://developers.cloudflare.com/queues/platform/limits/

## Quellprototyp v0.9.77.24

Der bevorzugte Pfad ist nun konkret unter `tools/knmi_eps_wasm_prototype/` vorbereitet. Er pinnt ecCodes 2.48.1, baut wasm32 ohne NODEFS, nutzt die eingebetteten ecCodes-Definitionen über `ENABLE_MEMFS=ON` und exportiert nur eine speicherbasierte GRIB1-Nearest-Point-ABI. Die Source-Vorbereitung ändert weder den produktiven Worker noch das Aktivierungsgate. Ein echter Emscripten-Build, Bundle-/RAM-/CPU-Benchmark und die numerische P4a-Gegenprüfung bleiben erforderlich, bevor eine Queue oder andere Infrastruktur überhaupt in Betracht kommt.

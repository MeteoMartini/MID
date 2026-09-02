# MID v0.9.77.24 – KNMI HARMONIE EPS Wasm32/MEMFS/Nearest-Point-Prototyp

Stand: 2026-09-02

## Status

Abschnitt 4/4 wird kostenneutral fortgeführt, ist aber **noch nicht abgeschlossen**. Dieser Stand erstellt ausschließlich den reproduzierbaren Quellprototyp. Keine Queue, kein neues Cloudflare-Binding, kein Workers-Paid-Plan und keine Wasm-Produktionsdependency werden aktiviert.

## Reproduzierbarer Upstream-Bezug

Der Prototyp orientiert sich an `meri-imperiumi/eccodes-wasm` Commit `759ca8e5c9b55883afff8cea5f9fe4d333e5b970`; dessen `ECCODES_VERSION` ist `2.48.1`. MID übernimmt das Paket nicht als Dependency, sondern pinnt für den Forschungsbuild direkt ECMWF ecCodes `2.48.1`.

## Schmale ABI

`tools/knmi_eps_wasm_prototype/mid_eccodes_point.c` verarbeitet genau **eine bereits getrennte GRIB1-Nachricht aus Speicher**:

1. `codes_handle_new_from_message_copy` – kein Datei-/NODEFS-Pfad,
2. Prüfung von Edition und MID-P4a-Signaturmetadaten,
3. `codes_grib_nearest_new` + `codes_grib_nearest_find`,
4. Rückgabe ausschließlich von Wert, nächstem Rasterpunkt, Entfernung/Index sowie Parameter-/Level-/TRI-/Membermetadaten.

Ein `values[]`-Vollgitter wird **nicht** nach JavaScript kopiert.

Für eine spätere Cloudflare-Modulprüfung stellt `cloudflare_precompiled.mjs` ausschließlich Emscriptens `instantiateWasm`-Hook bereit. Das Wasm muss dabei vom Worker-Bundler bereits als `WebAssembly.Module` importiert worden sein; der Adapter verwendet weder `fetch` noch `WebAssembly.compile` noch `WebAssembly.instantiate(ArrayBuffer)`.

## Wasm32-/Speichervertrag

Der Forschungsbuild verwendet:

- wasm32; bewusst kein `-m64`,
- `ENABLE_MEMFS=ON` für ecCodes-Definitionen,
- kein NODEFS und `FILESYSTEM=0`,
- GRIB an, BUFR/AEC/JPEG/PNG/NetCDF aus,
- Initialspeicher 24 MiB,
- maximal 96 MiB Wasm-Speicher,
- `web,worker` als Emscripten-Umgebung,
- nur `_mid_grib1_nearest`, `_malloc` und `_free` als C-Exports.

Der reduzierte Codec-Satz ist **nur Prototypannahme**. Eine reale P4a-Nachricht muss vor jeder Aktivierung beweisen, dass die tatsächlich verwendete GRIB1-Packingart damit dekodiert wird.

## Bundle-Gate

`report_bundle.py` reserviert höchstens **2,5 MB gzip** für JS+Wasm. Das ist absichtlich strenger als das untersuchte 3-MB-Free-Bundlelimit, damit Platz für Worker-Code und Bindings bleibt. Eine Überschreitung beendet den Prototypbuild fail-closed.

## Numerische Gegenprüfung

Produktionsfähigkeit verlangt eine reale KNMI-P4a-Nachricht und denselben Punkt im bestehenden Python/ecCodes-Referenzdecoder. Verglichen werden mindestens:

- GRIB1-Parameter-/Level-/TRI-Signatur,
- Memberzuordnung,
- nächster Rasterpunkt und Index,
- numerischer Wert,
- Decode-CPU,
- Wasm-/Bundlegröße und Prozess-/Isolate-Speicher.

Bis diese Gegenprüfung existiert, bleibt der bestehende Python/ecCodes-Decoder fachliche Referenz und der produktive MID-Worker unverändert.

## Lokales Gate dieses Releases

Die aktuelle Transportumgebung besitzt **kein `emcc`/`emcmake`** und keinen direkten GitHub-Netzzugriff im Buildcontainer. Der echte Wasm-Build und P4a-Benchmark können deshalb hier nicht wahrheitsgemäß als ausgeführt bezeichnet werden. Bash-/Python-/JavaScript-Quellen und die Vertragsregression werden lokal geprüft; der Build bleibt der nächste externe Prototypschritt.

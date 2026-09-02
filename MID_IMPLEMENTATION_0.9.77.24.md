# MID v0.9.77.24 – KNMI EPS Wasm32-Punktprototyp

- Abschnitt 4/4 kostenneutral bis zum reproduzierbaren Quellprototyp fortgeführt.
- Neue Forschungsquelle `tools/knmi_eps_wasm_prototype/` mit wasm32, ecCodes-MEMFS, direkter In-Memory-GRIB1-Nachricht und nativer Nearest-Point-API.
- Keine Vollgitterübergabe an JavaScript; schmale C-ABI liefert nur den nächsten Punkt und benötigte GRIB1-Metadaten.
- ecCodes 2.48.1 und geprüfter Upstream-Referenzcommit festgehalten.
- 24/96 MiB Wasm-Speichergrenzen und 2,5-MB-gzip-Prototypbudget fail-closed definiert.
- Precompiled-Wasm-Moduladapter für eine spätere Cloudflare-Modulprüfung vorbereitet; keine dynamische Wasm-Kompilierung aus Bytes.
- Kein npm-Paket, keine Queue, kein Cloudflare-Binding, kein Paid-Plan und keine Worker-Fachänderung.
- Reale P4a-Build-/Benchmark-/Python-Gegenprüfung bleibt der nächste Abschnitt-4-Schritt, da in der Transportumgebung Emscripten und direkter Build-Netzzugriff fehlen.

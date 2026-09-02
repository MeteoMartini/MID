# MID KNMI HARMONIE EPS – ecCodes Wasm32 point prototype

Research-only source for section 4/4. It does **not** change the production Worker: **keine Queue**, **keine Cloudflare**-Ressource/Binding und keine npm-Dependency werden angelegt.

## Contract

- ecCodes `2.48.1`, aligned with the inspected upstream `meri-imperiumi/eccodes-wasm` reference at commit `759ca8e5c9b55883afff8cea5f9fe4d333e5b970`.
- wasm32 only; no `-m64`.
- ecCodes definitions compiled with `ENABLE_MEMFS=ON`.
- no NODEFS, no host filesystem fallback, no full `values[]` transfer into JavaScript.
- one already-split GRIB1 message enters memory and is decoded through `codes_handle_new_from_message_copy`.
- `cloudflare_precompiled.mjs` uses Emscripten’s `instantiateWasm` hook with an already imported `WebAssembly.Module`; it never fetches or compiles Wasm bytes dynamically.
- nearest point uses native `codes_grib_nearest_new` + `codes_grib_nearest_find` and returns only value, grid point, distance/index and the MID GRIB1 signature/member metadata.
- initial Wasm memory 24 MiB, maximum 96 MiB; reserved prototype bundle budget 2.5 MB gzip so the production Worker still has headroom under a 3 MB Free limit.
- AEC/JPEG/PNG/NetCDF/BUFR/tools/tests are excluded from this first P4a-only size prototype. A real P4a sample must prove that its packing is decodable before this exclusion can become production policy.

## Build

Requires `emcc`, `emcmake`, CMake, git and network access to fetch the pinned ECMWF ecCodes source. Run:

```sh
./build_wasm32.sh
```

`report_bundle.py` fails closed if the compiled JS+Wasm gzip size exceeds 2.5 MB.

## Benchmark / numerical gate

After a successful build, provide a real KNMI P4a GRIB1 member message or TAR member:

```sh
node benchmark.mjs ./build/mid_eccodes.js ./sample.grib1 52.1 5.1
```

The same message/point must then be decoded with `tools/knmi_eps_decoder/` (Python/ecCodes reference). Production eligibility requires matching parameter signature/member and numerical nearest-point values within an explicitly documented tolerance, plus measured bundle/RAM/CPU limits. Until that evidence exists, this directory is source preparation only.

# MID v0.9.77.24 – Testnachweis

## Neuer Zieltest

`scripts/test-knmi-eps-wasm32-prototype-097724.mjs` schützt:

- In-Memory-GRIB1 über `codes_handle_new_from_message_copy`,
- native `codes_grib_nearest_new` / `codes_grib_nearest_find`-Punktabfrage,
- kein Vollgitter-`values[]` nach JavaScript,
- wasm32 ohne `-m64`,
- ecCodes `ENABLE_MEMFS=ON`, kein NODEFS, `FILESYSTEM=0`,
- 24 MiB Initial- und 96 MiB Maximal-Wasm-Speicher,
- 2,5-MB-gzip-Prototypbudget,
- ecCodes 2.48.1 und den geprüften Upstream-Referenzcommit,
- keine neue npm-Wasm-Dependency,
- keine Queue-/Worker-Aktivierung,
- Cloudflare-Precompiled-Wasm-Adapter über `instantiateWasm` + `WebAssembly.Module`, ohne dynamisches `WebAssembly.compile`/Fetch-Bytecode.

Der JS-Splitter wurde zusätzlich mit einer minimalen synthetischen GRIB1-Hülle und der GRIB2-Ablehnung geprüft. Bash-/JavaScript-/Python-Syntax des Prototyps ist grün. Die C-ABI wurde zusätzlich mit einem minimalen ecCodes-Headerstub via `cc -std=c11 -Wall -Wextra -Werror -fsyntax-only` syntaktisch geprüft.

## Angrenzende Zielregressionen

Bestanden haben außerdem unter anderem:

- `test-knmi-eps-wasm-feasibility-097723.mjs`
- `test-knmi-eps-point-decoder-097722.mjs`
- `test-knmi-eps-worker-binding-097719.mjs`
- `test-knmi-eps-productive-cache-097718.mjs`
- `test-worker-kv-operations-budget-09631.mjs`
- `test-worker-auto-deploy-09693.mjs`
- `test-weather-profile-skybar-pills-097723.mjs`
- `test-weather-profile-story-axis-09750.mjs`
- `test-weather-profile-mobile-compact-097612.mjs`
- `test-appwide-parameter-colors-09779.mjs`
- `test-versioning.mjs`
- `test-aggregate-version-contract-09613.mjs`
- `test-cross-platform-ios-shell-09670.mjs`
- Python-Referenzdecoder-Selftest
- Worker-/Service-Worker-Syntax.

## Vollständiges portables Regressionstor

Automatisch erkannt: **637** Regressionstests.

- in der Transportumgebung ausführbar: **532**
- bestanden: **532/532**
- ausschließlich toolchaingebunden: **105**
  - 86 benötigen das im Transport-ZIP nicht installierte `typescript-strada`,
  - 17 benötigen die projektlokale TypeScript-CLI/TS7 (einschließlich `--ignoreConfig`),
  - 2 benötigen `esbuild`.

Es bleibt **kein zusätzlicher/unklassifizierter fachlicher Regressionsfehler**.

## Laufzeitgrenze des Wasm-Prototyps

`emcc`/`emcmake` sind in dieser Transportumgebung nicht installiert. Der Buildcontainer besitzt außerdem keinen direkten GitHub-Netzzugriff. Deshalb wurden Wasm-Binary, gzip-Größe, CPU/RAM und reale P4a-Numerik hier **nicht** als ausgeführt oder bestanden behauptet. Das ist das nächste externe Prototypgate.

## Worker

Der generierte v0.9.77.24-Worker ist nach Normalisierung von `WORKER_VERSION` fachlich bytegleich zu v0.9.77.23 (identischer normalisierter SHA-256 `65872a1db28640e2bfb8e52126de2a6237ce40a0fc5789bb9898305868c28229`). Somit keine Worker-Fachänderung.

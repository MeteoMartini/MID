#!/usr/bin/env bash
set -euo pipefail

# Research-only reproducible build. It does not deploy or modify MID Worker bindings.
ECCODES_VERSION="${ECCODES_VERSION:-2.48.1}"
ECCODES_WASM_REFERENCE_COMMIT="759ca8e5c9b55883afff8cea5f9fe4d333e5b970"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${MID_WASM_WORKDIR:-$ROOT/.work}"
OUT="${MID_WASM_OUTDIR:-$ROOT/build}"
SOURCE="$WORK/eccodes-$ECCODES_VERSION"
BUILD="$WORK/build"
INSTALL="$WORK/install"

for command in git cmake emcc emcmake; do command -v "$command" >/dev/null || { echo "missing required tool: $command" >&2; exit 2; }; done
mkdir -p "$WORK" "$OUT"

if [ ! -d "$SOURCE/.git" ]; then
  git clone --depth 1 --branch "$ECCODES_VERSION" https://github.com/ecmwf/eccodes.git "$SOURCE"
fi
actual="$(git -C "$SOURCE" describe --tags --exact-match 2>/dev/null || true)"
[ "$actual" = "$ECCODES_VERSION" ] || { echo "ecCodes source is not pinned to $ECCODES_VERSION" >&2; exit 3; }

rm -rf "$BUILD" "$INSTALL"
mkdir -p "$BUILD" "$INSTALL"

# wasm32 is the Emscripten default: deliberately no -m64. Definitions are compiled
# into ecCodes MEMFS; NODEFS and host filesystem access are not linked.
emcmake cmake -S "$SOURCE" -B "$BUILD" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="$INSTALL" \
  -DENABLE_TESTS=OFF -DENABLE_EXAMPLES=OFF -DENABLE_FORTRAN=OFF -DENABLE_PYTHON=OFF \
  -DENABLE_BUILD_TOOLS=OFF -DENABLE_PRODUCT_GRIB=ON -DENABLE_PRODUCT_BUFR=OFF \
  -DENABLE_GEOGRAPHY=ON -DENABLE_MEMFS=ON -DENABLE_AEC=OFF -DENABLE_JPG=OFF \
  -DENABLE_PNG=OFF -DENABLE_NETCDF=OFF -DBUILD_SHARED_LIBS=OFF \
  -DECCODES_HAVE_FMEMOPEN=ON -DDISABLE_OS_CHECK=ON -DIEEE_LE=1
cmake --build "$BUILD" --target eccodes --parallel "${MID_WASM_JOBS:-2}"
cmake --install "$BUILD"

LIBS=("$INSTALL/lib/libeccodes.a" "$INSTALL/lib/libeccodes_memfs.a")
for lib in "${LIBS[@]}"; do [ -f "$lib" ] || { echo "missing static library: $lib" >&2; exit 4; }; done

EXPORTED="['_mid_grib1_nearest','_malloc','_free']"
RUNTIME="['HEAPU8','HEAP32','HEAPF64']"
emcc "$ROOT/mid_eccodes_point.c" \
  -I"$INSTALL/include" \
  -Wl,--whole-archive "${LIBS[@]}" -Wl,--no-whole-archive \
  -O3 -flto \
  -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT='web,worker' \
  -s "EXPORTED_FUNCTIONS=$EXPORTED" -s "EXPORTED_RUNTIME_METHODS=$RUNTIME" \
  -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=25165824 -s MAXIMUM_MEMORY=100663296 \
  -s STACK_SIZE=524288 -s FILESYSTEM=0 -s MALLOC=emmalloc \
  -o "$OUT/mid_eccodes.js"

cp "$ROOT/adapter.mjs" "$OUT/adapter.mjs"
python3 "$ROOT/report_bundle.py" "$OUT"
printf 'reference ecCodes-Wasm commit: %s\n' "$ECCODES_WASM_REFERENCE_COMMIT"

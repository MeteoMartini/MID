#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check 02_map_settings_iso/apply-combined-visual.mjs
node --check 02_map_settings_iso/apply-pseudo-only.mjs
node --check 02_map_settings_iso/apply-cloud-iso-fix.mjs
node --check 03_synop_symbols/synopWiring.mjs
tsc --noEmit --target ES2022 --module ES2022 --lib ES2022,DOM --strict --noUnusedLocals --noUnusedParameters --skipLibCheck 01_verified_cache/src/verifiedMapFrameCache.ts 03_synop_symbols/synopModelPlot.ts
node --test \
  01_verified_cache/tests/verified-cache.spec.mjs \
  02_map_settings_iso/test-cloud-iso-fix.mjs \
  02_map_settings_iso/test-pseudo-only.mjs \
  03_synop_symbols/test-synop-model-plot.mjs \
  03_synop_symbols/test-synop-wiring.mjs

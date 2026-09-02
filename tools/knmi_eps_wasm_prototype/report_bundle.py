#!/usr/bin/env python3
from __future__ import annotations
import gzip, hashlib, json, sys
from pathlib import Path

root=Path(sys.argv[1]).resolve()
wasm=root/'mid_eccodes.wasm'
js=root/'mid_eccodes.js'
if not wasm.is_file() or not js.is_file(): raise SystemExit('Wasm build output incomplete')
raw=wasm.read_bytes()+js.read_bytes()
gz=gzip.compress(raw,compresslevel=9)
report={
 'schema':'mid.knmi.harmonie-eps.wasm-bundle-report.v1',
 'wasmBytes':wasm.stat().st_size,
 'jsBytes':js.stat().st_size,
 'combinedBytes':len(raw),
 'combinedGzipBytes':len(gz),
 'prototypeGzipBudgetBytes':2_500_000,
 'withinPrototypeGzipBudget':len(gz)<=2_500_000,
 'wasmSha256':hashlib.sha256(wasm.read_bytes()).hexdigest(),
}
(root/'bundle-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if not report['withinPrototypeGzipBudget']:
 raise SystemExit('Prototype exceeds reserved 2.5 MB gzip budget')

#!/usr/bin/env python3
from __future__ import annotations
import json,tempfile,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[2]; SCRIPT=ROOT/'tools/ruc/check_ruc_health.py'
spec=importlib.util.spec_from_file_location('mid_ruc_health_check',SCRIPT); mod=importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(mod)
assert mod.health_url('https://mid.example/worker?x=1&mode=old')=='https://mid.example/worker?x=1&mode=ruc-health'
with tempfile.TemporaryDirectory() as td:
 p=Path(td)/'latest.json';p.write_text(json.dumps({'schema':'mid.dwd.ruc.grid.v2','run':'2026082822'}))
 assert mod.expected_run(str(p))=='2026082822'
 good={'configured':True,'ready':True,'fresh':True,'schemaValid':True,'backend':'r2','run':'2026082822','timeCount':15,'pointCount':542040,'epsMemberCount':20,'nativeEpsMembers':True,'objectsPresent':{'lookup':True,'deterministic':True,'epsSummary':True,'epsMembers':True}}
 mod.check(good,'2026082822')
 try:mod.check({**good,'fresh':False},'2026082822');raise AssertionError('stale payload accepted')
 except RuntimeError:pass
 try:mod.check({**good,'run':'older'},'2026082822');raise AssertionError('wrong run accepted')
 except RuntimeError:pass
print('RUC deployed health-check contract OK')

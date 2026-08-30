#!/usr/bin/env python3
from __future__ import annotations
import json,tempfile,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[2]; SCRIPT=ROOT/'tools/ruc/check_ruc_health.py'
spec=importlib.util.spec_from_file_location('mid_ruc_health_check',SCRIPT); mod=importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(mod)
assert mod.health_url('https://mid.example/worker?x=1&mode=old')=='https://mid.example/worker?x=1&mode=ruc-health'
assert 'mid_ruc_expected=2026082822' in mod.probe_url('https://mid.example/worker?mode=ruc-health','2026082822',3)
assert 'mid_ruc_probe=3' in mod.probe_url('https://mid.example/worker?mode=ruc-health','2026082822',3)
with tempfile.TemporaryDirectory() as td:
 p=Path(td)/'latest.json';p.write_text(json.dumps({'schema':'mid.dwd.ruc.grid.v2','run':'2026082822'}))
 assert mod.expected_run(str(p))=='2026082822'
 good={'configured':True,'ready':True,'fresh':True,'schemaValid':True,'backend':'r2','run':'2026082822','timeCount':15,'pointCount':542040,'epsMemberCount':20,'nativeEpsMembers':True,'objectsPresent':{'lookup':True,'deterministic':True,'epsSummary':True,'epsMembers':True}}
 mod.check(good,'2026082822')
 try:mod.check({**good,'fresh':False},'2026082822');raise AssertionError('stale payload accepted')
 except RuntimeError:pass
 try:mod.check({**good,'run':'older'},'2026082822');raise AssertionError('wrong run accepted')
 except RuntimeError:pass

# GitHub Pages may expose the previous latest.json for a short CDN propagation window.
# Two stale responses must be retried, but never accepted; the exact expected run must win.
class Handler(BaseHTTPRequestHandler):
 count=0
 def log_message(self,*args):pass
 def do_GET(self):
  Handler.count+=1
  from urllib.parse import urlsplit,parse_qs
  query=parse_qs(urlsplit(self.path).query)
  assert query.get('mode')==['ruc-health']
  assert query.get('mid_ruc_expected')==['2026082822']
  if Handler.count<3:
   payload={**good,'ready':False,'fresh':False,'run':'2026082818','reason':'RUC-Lauf nicht frisch'}
  else:
   payload=good
  body=json.dumps(payload).encode()
  self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 payload,attempt=mod.probe_until_ready(mod.health_url(f'http://127.0.0.1:{server.server_port}/'), '2026082822', attempts=3, retry_delay=0, max_retry_delay=0)
 assert attempt==3 and payload['run']=='2026082822'
finally:
 server.shutdown();server.server_close();thread.join(timeout=2)

# Exhausted convergence budget remains fail-closed.
def always_stale(url,timeout):return {**good,'ready':False,'fresh':False,'run':'2026082818','reason':'RUC-Lauf nicht frisch'}
try:
 mod.probe_until_ready('https://mid.example/?mode=ruc-health','2026082822',attempts=2,retry_delay=0,max_retry_delay=0,fetcher=always_stale,sleeper=lambda _:None)
 raise AssertionError('persistent stale RUC health accepted')
except RuntimeError as error:
 assert 'did not converge after 2 attempts' in str(error)

print('RUC deployed health-check convergence contract OK')

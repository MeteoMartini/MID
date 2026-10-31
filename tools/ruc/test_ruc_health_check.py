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

# GitHub Pages may need >7 probes to move its public latest.json after
# a successful deployment. The additional *bounded* wait must never accept the
# old run, and a permanently stale run must still fail the release gate.
expected_pages_run = '2026-10-14T06:00'
old_pages_run = '2026-10-14T05:00'
pages_requests = []
def pages_late(url, timeout):
 from urllib.parse import parse_qs, urlsplit
 q = parse_qs(urlsplit(url).query)
 pages_requests.append(q)
 run = old_pages_run if len(pages_requests) < 9 else expected_pages_run
 return {'schema': 'mid.dwd.ruc.grid.v2', 'storageProfile': 'pages-free-v1', 'run': run}
assert mod.MAX_PAGES_PROBE_ATTEMPTS == 12
assert mod.probe_pages('https://mid.example/ruc/', expected_pages_run, attempts=12,
                       fetcher=pages_late, sleeper=lambda _: None) == 9
assert len(pages_requests) == 9
assert [row['mid_ruc_probe'][0] for row in pages_requests] == [str(i) for i in range(1, 10)]
assert all(row['mid_ruc_expected'] == [expected_pages_run] for row in pages_requests)

def pages_stale(url, timeout):
 return {'schema': 'mid.dwd.ruc.grid.v2', 'storageProfile': 'pages-free-v1', 'run': old_pages_run}
for attempts in (1, 7, 12):
 try:
  mod.probe_pages('https://mid.example/ruc/', expected_pages_run, attempts=attempts,
                  fetcher=pages_stale, sleeper=lambda _: None)
  raise AssertionError('stale public Pages pointer was accepted')
 except RuntimeError as error:
  assert f'after {attempts} attempts' in str(error)
def pages_wrong_profile(url, timeout):
 return {'schema': 'mid.dwd.ruc.grid.v2', 'storageProfile': 'unexpected', 'run': expected_pages_run}
try:
 mod.probe_pages('https://mid.example/ruc/', expected_pages_run, attempts=1,
                 fetcher=pages_wrong_profile, sleeper=lambda _: None)
 raise AssertionError('wrong Pages storage profile was accepted')
except RuntimeError:
 pass

# Base readiness must never be confused with successful optional codec adoption.
meta={'run':good['run'],'pages':{'losslessTransport':{'mode':'dual-read-pilot','rawRetained':True,'addedBytes':224323}}}
pilot={'advertised':True,'readEnabled':True,'verified':True,'rawRetained':True,'transport':'byteplanes-gzip','chunkIndex':132}
evidence=mod.codec_evidence({**good,'codecPilot':pilot},meta)
assert evidence['verified'] is True and evidence['addedBytes']==224323
assert evidence['run']==good['run'] and evidence['chunkIndex']==132
assert mod.codec_evidence({**good,'run':'older','codecPilot':pilot},meta)['verified'] is False
for patch in ({'verified':False,'transport':'raw','reason':'wire-sha'},
              {'readEnabled':False},{'advertised':False},{'rawRetained':False},
              {'transport':'raw'},{'verified':'true'}):
 payload={**good,'codecPilot':{**pilot,**patch}}
 mod.check(payload,good['run']) # Raw service remains ready and rollback works.
 assert mod.codec_evidence(payload,meta)['verified'] is False
for absent in (None,False,{},'unexpected'):
 assert mod.codec_evidence({**good,'codecPilot':absent},meta)['verified'] is False
assert mod.codec_evidence({**good,'codecPilot':pilot},{'run':good['run']})['verified'] is False
assert mod.codec_evidence({**good,'codecPilot':pilot},{'pages':{'losslessTransport':{'mode':'dual-read-pilot','rawRetained':False}}})['verified'] is False

print('RUC deployed health-check convergence and explicit codec evidence contract OK')

# Full replacement must require both the new metadata and decoded Worker health.
full_meta={'schema':'mid.dwd.ruc.grid.v2','run':good['run'],'storageProfile':'pages-lossless-v1',
 'migration':{'schema':'mid.ruc.migration-active.v1','productionEnabled':True},
 'pages':{'profile':'pages-lossless-v1','losslessTransport':{'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False}}}
assert mod.active_profile_valid(full_meta)
full_worker={**good,'backend':'pages','storageProfile':'pages-lossless-v1',
             'nativeEpsMembers':False,'fullCodec':{'advertised':True,'verified':True,'rawRetained':False}}
assert mod.full_codec_evidence(full_worker,full_meta)['verified'] is True
for bad in ({'verified':False},{'rawRetained':True},{'advertised':False}):
 assert mod.full_codec_evidence({**full_worker,'fullCodec':{**full_worker['fullCodec'],**bad}},full_meta)['verified'] is False
candidate=dict(full_meta);candidate['migration']={'schema':'mid.ruc.migration-candidate.v1','productionEnabled':False}
assert not mod.active_profile_valid(candidate)
assert not mod.full_codec_evidence(full_worker,candidate)['verified']
assert mod.probe_pages('https://mid.example/ruc/',good['run'],attempts=1,
 fetcher=lambda url,timeout:full_meta,sleeper=lambda _:None,expected_profile='pages-lossless-v1')==1
try:
 mod.probe_pages('https://mid.example/ruc/',good['run'],attempts=1,
  fetcher=lambda url,timeout:candidate,sleeper=lambda _:None,expected_profile='pages-lossless-v1')
 raise AssertionError('inactive candidate was accepted by public Pages gate')
except RuntimeError:pass


# SHA-sealed 27 h Pages -> Worker strict dimension, UTC and grid parity.
from datetime import datetime, timedelta
import copy
MODEL_RUN = '2026-10-31T03:00'
_base = datetime.strptime(MODEL_RUN, '%Y-%m-%dT%H:%M')
_axis = [(_base + timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(28)]
sealed = {
 'schema':'mid.dwd.ruc.grid.v2', 'run':MODEL_RUN, 'storageProfile':'pages-free-v1',
 'times':_axis, 'pointCount':542040, 'grid':{'nativePointCount':542040,'nx':300,'ny':300},
 'deterministic':{'times':_axis}, 'epsSummary':{'times':_axis},
 'eps':{'times':_axis,'memberCount':20,'available':False}
}
contract=mod.verified_snapshot_contract(sealed)
assert contract['timeCount']==28 and contract['epsMemberCount']==20 and contract['pointCount']==542040
worker={**good,'run':MODEL_RUN,'timeCount':28,'pointCount':542040,'epsMemberCount':20}
mod.check(worker,MODEL_RUN,expected_contract=contract)
for name,invalid in (('timeCount',27),('timeCount',29),('timeCount','28'),('timeCount',True),
                     ('pointCount',542039),('pointCount',0),('pointCount','542040'),
                     ('epsMemberCount',19),('epsMemberCount',21),('epsMemberCount','20')):
 try:
  mod.check({**worker,name:invalid},MODEL_RUN,expected_contract=contract)
  raise AssertionError(f'worker {name} invalid value {invalid!r} passed')
 except RuntimeError as error:
  assert name in str(error)
try:
 mod.check(worker,'2026-10-31T04:00',expected_contract=contract)
 raise AssertionError('foreign local run accepted')
except RuntimeError:pass

def bad_snapshot(change):
 damaged=copy.deepcopy(sealed);change(damaged)
 try:
  mod.verified_snapshot_contract(damaged)
  raise AssertionError('bad source snapshot accepted')
 except RuntimeError:pass
for change in (
 lambda m:m['times'].pop(),
 lambda m:m['times'].append('2026-11-01T07:00'),
 lambda m:m['times'].__setitem__(19,m['times'][18]),
 lambda m:m['times'].__setitem__(19,'2026-10-31T22:30'),
 lambda m:m['deterministic']['times'].__setitem__(1,'2026-10-31T03:00'),
 lambda m:m['epsSummary']['times'].pop(),
 lambda m:m['eps']['times'].pop(),
 lambda m:m['eps'].__setitem__('memberCount',19),
 lambda m:m['eps'].__setitem__('memberCount',True),
 lambda m:m.__setitem__('pointCount','542040'),
 lambda m:m.__setitem__('pointCount',0),
 lambda m:m['grid'].__setitem__('nativePointCount',1),
 lambda m:m.__setitem__('grid',None),
 lambda m:m.__setitem__('run','2026-10-31T03:01'),
 lambda m:m.__setitem__('run','not-a-date'),
):
 bad_snapshot(change)

# Public Pages must match the *same sealed* geometry/axes, not merely its run.
assert mod.probe_pages('https://mid.example/ruc/',MODEL_RUN,attempts=1,
 fetcher=lambda url,timeout:sealed,sleeper=lambda _:None,
 expected_profile='pages-free-v1',expected_contract=contract)==1
for mutate in (
 lambda m:m['eps'].__setitem__('memberCount',19),
 lambda m:m['times'].__setitem__(7,'2026-10-31T09:00'),
 lambda m:m.__setitem__('pointCount',542039),
 lambda m:m['grid'].__setitem__('nativePointCount',542039),
):
 damaged=copy.deepcopy(sealed);mutate(damaged)
 try:
  mod.probe_pages('https://mid.example/ruc/',MODEL_RUN,attempts=1,
   fetcher=lambda url,timeout:damaged,sleeper=lambda _:None,
   expected_profile='pages-free-v1',expected_contract=contract)
  raise AssertionError('public Pages wrong dimensions passed')
 except RuntimeError as error:
  assert 'did not converge' in str(error)

# Bounded exact Worker retry: a truncated EPS count cannot pass until it heals.
responses=iter([{**worker,'epsMemberCount':19},worker])
seen=[]
payload,attempt=mod.probe_until_ready('https://mid.example/?mode=ruc-health',MODEL_RUN,
 attempts=2,retry_delay=0,max_retry_delay=0,fetcher=lambda url,timeout:next(responses),
 sleeper=lambda delay:seen.append(delay),expected_contract=contract)
assert attempt==2 and payload['epsMemberCount']==20 and len(seen)==1
try:
 mod.probe_until_ready('https://mid.example/?mode=ruc-health',MODEL_RUN,
  attempts=2,retry_delay=0,max_retry_delay=0,fetcher=lambda url,timeout:{**worker,'timeCount':27},
  sleeper=lambda _:None,expected_contract=contract)
 raise AssertionError('truncated worker temporal axis passed')
except RuntimeError as error:
 assert 'did not converge' in str(error)
print('RUC sealed manifest dimensions and public Pages/Worker end-to-end parity verified')

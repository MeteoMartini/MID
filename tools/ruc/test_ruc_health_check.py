#!/usr/bin/env python3
from __future__ import annotations
import contextlib,io,json,subprocess,sys,tempfile,threading,unittest,urllib.error
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import importlib.util
from email.message import Message
from unittest import mock
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
assert mod.MAX_PAGES_PROBE_ATTEMPTS == 18
assert mod.probe_pages('https://mid.example/ruc/', expected_pages_run, attempts=12,
                       fetcher=pages_late, sleeper=lambda _: None) == 9
assert len(pages_requests) == 9
assert [row['mid_ruc_probe'][0] for row in pages_requests] == [str(i) for i in range(1, 10)]
assert all(row['mid_ruc_expected'] == [expected_pages_run] for row in pages_requests)

def pages_stale(url, timeout):
 return {'schema': 'mid.dwd.ruc.grid.v2', 'storageProfile': 'pages-free-v1', 'run': old_pages_run}
for attempts in (1, 7, 12, 18):
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

# The historical 14 h raw Pages rollback is a separate signed/checksummed
# emergency fallback, never an exemption available to normal 27 h publication.
legacy=copy.deepcopy(sealed)
for key in ('times',):
 legacy[key]=legacy[key][:15]
for key in ('deterministic','epsSummary','eps'):
 legacy[key]['times']=legacy[key]['times'][:15]
legacy['pages']={'profile':'pages-free-v1','nativeEpsMembers':False}
try:
 mod.verified_snapshot_contract(legacy)
 raise AssertionError('14 h emergency profile accepted by regular 27 h publish')
except RuntimeError:pass
legacy_contract=mod.verified_snapshot_contract(legacy,allow_legacy_rollback=True)
assert legacy_contract['timeCount']==15
legacy_worker={**worker,'timeCount':15}
mod.check(legacy_worker,MODEL_RUN,expected_contract=legacy_contract)
# No normal publisher can silently reclassify a 14 h raw snapshot as 27 h.
try:
 mod.probe_pages('https://mid.example/ruc/',MODEL_RUN,attempts=1,
  fetcher=lambda url,timeout:legacy,sleeper=lambda _:None,expected_profile='pages-free-v1',
  expected_contract=legacy_contract)
 raise AssertionError('legacy horizon accepted without explicit emergency flag')
except RuntimeError:pass
assert mod.probe_pages('https://mid.example/ruc/',MODEL_RUN,attempts=1,
 fetcher=lambda url,timeout:legacy,sleeper=lambda _:None,expected_profile='pages-free-v1',
 expected_contract=legacy_contract,allow_legacy_rollback=True)==1
for mutation in (
 lambda m:m['times'].pop(),
 lambda m:m['eps']['times'].pop(),
 lambda m:m['eps'].__setitem__('memberCount',19),
 lambda m:m['grid'].__setitem__('nativePointCount',5),
 lambda m:m.__setitem__('storageProfile','pages-lossless-v1'),
 lambda m:m['pages'].__setitem__('nativeEpsMembers',True),
):
 damaged=copy.deepcopy(legacy);mutation(damaged)
 try:
  mod.verified_snapshot_contract(damaged,allow_legacy_rollback=True)
  raise AssertionError('corrupt emergency rollback passed')
 except RuntimeError:pass
try:
 mod.check({**legacy_worker,'timeCount':14},MODEL_RUN,expected_contract=legacy_contract)
 raise AssertionError('shorter emergency worker health accepted')
except RuntimeError:pass
print('RUC distinct 27h production and validated 14h emergency raw rollback contracts OK')


class SafeDiagnosticsTests(unittest.TestCase):
 def test_diagnostic_classes_remain_runtime_errors(self):
  for error_type in (mod.PagesConvergenceError,mod.SnapshotContractError,
                     mod.WorkerHTTPError,mod.WorkerTransportError,
                     mod.WorkerPayloadError,mod.WorkerAdoptionError,
                     mod.CodecDefectError):
   with self.subTest(error_type=error_type):
    self.assertTrue(issubclass(error_type,RuntimeError))

 def test_http_status_and_metadata_are_bound_to_each_probe(self):
  secret='private-token-fragment'
  headers=Message()
  headers['Age']='41'
  headers['CF-Cache-Status']='HIT'
  headers['Authorization']=secret
  headers['Set-Cookie']='session='+secret
  responses=iter([
   urllib.error.HTTPError('https://host.invalid/health?token='+secret,503,
                          'private response text',headers,io.BytesIO(secret.encode())),
   mod.ProbeResponse(good,200,{'Content-Type':'application/json'}),
  ])
  def next_response(*_):
   response=next(responses)
   if isinstance(response,BaseException):
    raise response
   return response
  journal=mod.ProbeJournal()
  payload,attempt=mod.probe_until_ready(
   'https://host.invalid/health?access_token='+secret,'2026082822',attempts=2,
   retry_delay=0,max_retry_delay=0,fetcher=next_response,
   sleeper=lambda _:None,journal=journal)
  self.assertEqual(attempt,2)
  rows=journal.as_dict()['records']
  self.assertEqual([row['httpStatus'] for row in rows],[503,200])
  self.assertEqual(rows[0]['metadata'],{'ageSeconds':41,'cacheStatus':'hit'})
  self.assertEqual(rows[1]['metadata'],{'contentType':'json'})
  encoded=json.dumps(journal.as_dict())
  for private in (secret,'access_token','Authorization','Set-Cookie','private response text'):
   self.assertNotIn(private,encoded)

 def test_http_json_and_payload_failures_have_closed_codes(self):
  headers=Message()
  headers['Age']='99'
  http_error=urllib.error.HTTPError('https://host.invalid/?secret=value',503,
                                    'private',headers,io.BytesIO(b'secret body'))
  journal=mod.ProbeJournal()
  with self.assertRaises(mod.WorkerHTTPError) as caught:
   mod.probe_until_ready('https://host.invalid/','2026082822',attempts=1,
                         fetcher=lambda *_:(_ for _ in ()).throw(http_error),
                         journal=journal)
  self.assertEqual(caught.exception.code,'worker_http_error')
  self.assertEqual(journal.records[0]['httpStatus'],503)
  self.assertNotIn('secret',json.dumps(journal.as_dict()))
  fake_headers=Message()
  fake_headers['CF-Cache-Status']='MISS'
  class Response:
   status=200
   headers=fake_headers
   def __enter__(self):return self
   def __exit__(self,*_):return False
   def read(self):return b'{bad json'
  with mock.patch.object(mod.urllib.request,'urlopen',return_value=Response()):
   with self.assertRaises(mod.WorkerPayloadError) as invalid_json:
    mod.probe_until_ready('https://host.invalid/','2026082822',attempts=1)
  self.assertEqual(invalid_json.exception.code,'invalid_json')
  with self.assertRaises(mod.WorkerPayloadError) as unusable:
   mod.probe_until_ready('https://host.invalid/','2026082822',attempts=1,
                         fetcher=lambda *_:['not','an','object'])
  self.assertEqual(unusable.exception.code,'payload_not_object')

 def test_real_http_non_object_json_is_payload_failure_for_pages_and_worker(self):
  class Response:
   status=200
   def __init__(self,body):
    self.body=body
    self.headers=Message()
    self.headers['Content-Type']='application/json'
    self.headers['Age']='17'
    self.headers['CF-Cache-Status']='MISS'
   def __enter__(self):return self
   def __exit__(self,*_):return False
   def read(self):return self.body

  for payload in ([],None,'private-token-fragment'):
   with self.subTest(payload_type=type(payload).__name__):
    body=json.dumps(payload).encode('utf-8')
    journal=mod.ProbeJournal()
    with mock.patch.object(mod.urllib.request,'urlopen',
                           return_value=Response(body)):
     with self.assertRaises(mod.WorkerPayloadError) as worker_error:
      mod.probe_until_ready(
       'https://host.invalid/health?token=private-token-fragment',
       '2026082822',attempts=1,journal=journal)
    self.assertEqual(worker_error.exception.code,'payload_not_object')
    worker_record=journal.as_dict()['records'][0]
    self.assertEqual(worker_record['httpStatus'],200)
    self.assertEqual(worker_record['diagnosticCode'],'payload_not_object')
    self.assertEqual(worker_record['metadata'],
                     {'ageSeconds':17,'cacheStatus':'miss','contentType':'json'})

    pages_journal=mod.ProbeJournal()
    with mock.patch.object(mod.urllib.request,'urlopen',
                           return_value=Response(body)):
     with self.assertRaises(mod.PagesConvergenceError) as pages_error:
      mod.probe_pages(
       'https://host.invalid/ruc/','2026-11-07T18:00',attempts=1,
       journal=pages_journal)
    self.assertEqual(pages_error.exception.attempts,1)
    pages_record=pages_journal.as_dict()['records'][0]
    self.assertEqual(pages_record['httpStatus'],200)
    self.assertEqual(pages_record['diagnosticCode'],'payload_not_object')
    self.assertEqual(pages_record['metadata'],
                     {'ageSeconds':17,'cacheStatus':'miss','contentType':'json'})

    with tempfile.TemporaryDirectory() as directory:
     metadata=Path(directory)/'latest.json'
     metadata.write_text(json.dumps(sealed),encoding='utf-8')
     for pages_mode in (False,True):
      stdout=io.StringIO()
      stderr=io.StringIO()
      with mock.patch.object(mod.urllib.request,'urlopen',
                             return_value=Response(body)):
       with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):
        args=['--url','https://host.invalid/health?token=private-token-fragment',
              '--meta',str(metadata),'--attempts','1']
        if pages_mode:
         args.extend(['--pages-base','https://host.invalid/ruc/','--pages-attempts','1'])
        exit_code=mod.main(args)
      self.assertEqual(exit_code,2)
      self.assertIn('MID RUC probe journal:',stderr.getvalue())
      self.assertIn('httpStatus',stderr.getvalue())
      self.assertNotIn('private-token-fragment',stderr.getvalue())
      self.assertNotIn('token=',stderr.getvalue())
      self.assertNotIn(json.dumps(payload),stderr.getvalue())

 def test_transport_and_unready_worker_are_not_codec_defects(self):
  with self.assertRaises(mod.WorkerTransportError) as transport:
   mod.probe_until_ready('https://host.invalid/','2026082822',attempts=1,
                         fetcher=lambda *_:(_ for _ in ()).throw(
                          urllib.error.URLError('secret transport detail')))
  self.assertEqual(transport.exception.code,'probe_transport_failed')
  with self.assertRaises(mod.WorkerAdoptionError) as unready:
   mod.probe_until_ready('https://host.invalid/','2026082822',attempts=1,
                         fetcher=lambda *_:{**good,'ready':False})
  self.assertEqual(unready.exception.code,'worker_readiness_failed')
  self.assertNotIsInstance(unready.exception,mod.CodecDefectError)

 def test_journal_is_utc_safe_and_bounded(self):
  journal=mod.ProbeJournal()
  for attempt in range(1,80):
   journal.record(attempt=attempt,phase='worker_adoption',
                  run='2026-11-07T18:00',status=200,
                  metadata={'Age':'120','CF-Cache-Status':'HIT',
                            'Authorization':'secret','X-Debug':'secret'})
  result=journal.as_dict()
  self.assertEqual(len(result['records']),64)
  self.assertEqual(result['deploymentId'],'unavailable')
  self.assertRegex(result['records'][0]['utc'],r'Z$')
  self.assertNotIn('secret',json.dumps(result))
  self.assertEqual(result['records'][0]['metadata'],
                   {'ageSeconds':120,'cacheStatus':'hit'})


 def test_combined_health_deadline_bounds_both_retry_phases(self):
  class FakeClock:
   def __init__(self):self.now=0.0
   def read(self):return self.now
   def sleep(self,seconds):self.now+=seconds
  for phase in ('pages','worker'):
   with self.subTest(phase=phase):
    clock=FakeClock()
    journal=mod.ProbeJournal()
    responses=[]
    def fetch(url,timeout):
     responses.append(timeout)
     if phase=='pages':
      return {'schema':'mid.dwd.ruc.grid.v2',
              'storageProfile':'pages-free-v1','run':'2026-11-07T17:00'}
     return {**good,'ready':False}
    with self.assertRaises(mod.RucHealthError) as caught:
     if phase=='pages':
      mod.probe_pages('https://host.invalid/ruc/','2026-11-07T18:00',
                      attempts=18,fetcher=fetch,sleeper=clock.sleep,
                      deadline=17.0,clock=clock.read,journal=journal)
     else:
      mod.probe_until_ready('https://host.invalid/','2026082822',
                            attempts=7,fetcher=fetch,sleeper=clock.sleep,
                            deadline=17.0,clock=clock.read,journal=journal)
    self.assertEqual(caught.exception.code,'health_budget_exhausted')
    self.assertLessEqual(clock.now,17.0)
    self.assertEqual(len(responses),2)
    self.assertEqual(journal.records[-1]['diagnosticCode'],
                     'health_budget_exhausted')
    self.assertLessEqual(len(journal.records),3)

 def test_cli_shares_health_deadline_between_pages_and_worker(self):
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(sealed),encoding='utf-8')
   with (mock.patch.object(mod.time,'monotonic',return_value=1000.0),
         mock.patch.object(mod,'probe_pages',return_value=1) as pages,
         mock.patch.object(mod,'probe_until_ready',
                           return_value=({**worker,'run':MODEL_RUN},1)) as adopted,
         contextlib.redirect_stdout(io.StringIO())):
    result=mod.main(['--url','https://host.invalid/',
                     '--pages-base','https://host.invalid/ruc/',
                     '--meta',str(metadata)])
   self.assertEqual(result,0)
   self.assertEqual(pages.call_args.kwargs['deadline'],1600.0)
   self.assertEqual(adopted.call_args.kwargs['deadline'],1600.0)
   self.assertEqual(mod.MAX_HEALTH_BUDGET_SECONDS,600)

 def test_probe_budgets_remain_bounded_at_eighteen_and_seven(self):
  self.assertEqual(mod.MAX_PAGES_PROBE_ATTEMPTS,18)
  self.assertEqual(mod.MAX_WORKER_PROBE_ATTEMPTS,7)
  self.assertEqual(mod.MAX_PROBE_JOURNAL_RECORDS,64)
  with self.assertRaises(mod.PagesConvergenceError) as pages:
   mod.probe_pages(
    'https://host.invalid/ruc/','2026-11-07T18:00',attempts=99,
    fetcher=lambda *_:{'schema':'mid.dwd.ruc.grid.v2',
                       'storageProfile':'pages-free-v1','run':'stale'},
    sleeper=lambda _:None)
  self.assertEqual(pages.exception.attempts,18)
  with self.assertRaises(mod.WorkerAdoptionError) as worker:
   mod.probe_until_ready(
    'https://host.invalid/','2026082822',attempts=99,
    fetcher=lambda *_:{**good,'ready':False},sleeper=lambda _:None)
  self.assertEqual(worker.exception.attempts,7)

 def test_full_pages_recovers_at_thirteenth_probe_only_on_exact_run(self):
  # Synthetic timing replay of the public 16Z/19Z 2026-11-10 late-pointer
  # incidents: historic twelve-probe limit must not be mistaken for a codec
  # failure. The new bound remains finite and cannot accept a stale pointer.
  expected='2026-11-10T19:00'
  prior='2026-11-10T18:00'
  fresh=copy.deepcopy(full_meta)
  fresh['run']=expected
  stale=copy.deepcopy(fresh)
  stale['run']=prior
  journal=mod.ProbeJournal()
  calls=[]
  def delayed(url,timeout):
   calls.append(url)
   return mod.ProbeResponse(copy.deepcopy(stale if len(calls)<=12 else fresh),
                            200,{'ageSeconds':0,'cacheStatus':'dynamic',
                                 'contentType':'json'})
  self.assertEqual(mod.probe_pages(
   'https://host.invalid/ruc/',expected,attempts=18,
   expected_profile='pages-lossless-v1',
   fetcher=delayed,sleeper=lambda _:None,journal=journal),13)
  self.assertEqual(len(calls),13)
  self.assertEqual(len(journal.records),13)
  self.assertEqual([r['diagnosticCode'] for r in journal.records[:12]],
                   ['pages_run_mismatch']*12)
  self.assertEqual(journal.records[-1]['observedRun'],expected)
  self.assertEqual(journal.records[-1]['observedStorageProfile'],
                   'pages-lossless-v1')
  self.assertEqual(journal.records[-1]['phase'],'pages_pointer')

 def test_observed_04z_twelve_stale_pages_is_not_codec_defect(self):
  # 08.11.2026 public Pages incident, *offline synthetic replay* based on
  # authenticated GitHub Actions log #42449728271. The cache headers in this
  # fixture are NOT claimed as actual recorded production response headers.
  from urllib.parse import urlsplit,parse_qs
  expected='2026-11-08T04:00'
  prior='2026-11-08T03:00'
  metadata=copy.deepcopy(full_meta)
  metadata['run']=prior
  self.assertTrue(mod.active_profile_valid(metadata))
  journal=mod.ProbeJournal()
  urls=[]
  def stale(url,timeout):
   urls.append(parse_qs(urlsplit(url).query))
   return mod.ProbeResponse(copy.deepcopy(metadata),200,
                            {'ageSeconds':42,'cacheStatus':'hit',
                             'contentType':'json'})
  with self.assertRaises(mod.PagesConvergenceError) as caught:
   mod.probe_pages('https://host.invalid/ruc/?token=private-token-fragment',
                   expected,attempts=12,
                   expected_profile='pages-lossless-v1',
                   fetcher=stale,sleeper=lambda _:None,journal=journal)
  error=caught.exception
  self.assertEqual(error.code,'pages_convergence_timeout')
  self.assertEqual(error.attempts,12)
  self.assertNotIsInstance(error,mod.CodecDefectError)
  self.assertEqual(len(urls),12)
  self.assertEqual([q.get('mid_ruc_probe') for q in urls],
                   [[str(i)] for i in range(1,13)])
  self.assertTrue(all(q.get('mid_ruc_expected')==[expected] for q in urls))
  rows=journal.as_dict()['records']
  self.assertEqual(len(rows),12)
  self.assertEqual({r['diagnosticCode'] for r in rows},
                   {'pages_run_mismatch'})
  self.assertEqual({r['phase'] for r in rows},{'pages_pointer'})
  self.assertEqual({r['httpStatus'] for r in rows},{200})
  self.assertEqual({r['run'] for r in rows},{expected})
  self.assertEqual({r['observedRun'] for r in rows},{prior})
  self.assertEqual({r['observedStorageProfile'] for r in rows},{'pages-lossless-v1'})
  self.assertEqual(rows[0]['metadata'],
                   {'ageSeconds':42,'cacheStatus':'hit','contentType':'json'})
  dump=json.dumps(journal.as_dict())
  for secret in ('private-token-fragment','token=','Authorization'):
   self.assertNotIn(secret,dump)

 def test_pages_04z_must_converge_on_exact_run_and_active_profile(self):
  expected='2026-11-08T04:00'
  prior='2026-11-08T03:00'
  fresh=copy.deepcopy(full_meta)
  fresh['run']=expected
  stale={**fresh,'run':prior}
  calls=[]
  def delayed(url,timeout):
   calls.append(url)
   return fresh if len(calls)==9 else stale
  journal=mod.ProbeJournal()
  self.assertEqual(mod.probe_pages('https://host.invalid/ruc/',expected,
   attempts=12,expected_profile='pages-lossless-v1',
   fetcher=delayed,sleeper=lambda _:None,journal=journal),9)
  self.assertEqual(len(calls),9)
  self.assertEqual([r['diagnosticCode'] for r in journal.records[:8]],
                   ['pages_run_mismatch']*8)
  self.assertEqual([r['observedRun'] for r in journal.records],
                   [prior]*8+[expected])
  self.assertEqual([r['observedStorageProfile'] for r in journal.records],
                   ['pages-lossless-v1']*9)
  self.assertEqual(journal.records[8]['httpStatus'],None)
  # Correct run with an emergency/raw profile is not a 27h full-codec pass.
  raw={**fresh,'storageProfile':'pages-free-v1',
       'pages':{'profile':'pages-free-v1','nativeEpsMembers':False}}
  newer={**fresh,'run':'2026-11-08T05:00'}
  for payload,reason in ((raw,'pages_profile_mismatch'),
                         (newer,'pages_run_mismatch')):
   with self.subTest(reason=reason):
    journal=mod.ProbeJournal()
    with self.assertRaises(mod.PagesConvergenceError) as failed:
     mod.probe_pages('https://host.invalid/ruc/',expected,
      attempts=1,expected_profile='pages-lossless-v1',
      fetcher=lambda url,timeout:payload,
      sleeper=lambda _:None,journal=journal)
    self.assertEqual(failed.exception.code,'pages_convergence_timeout')
    self.assertEqual(journal.records[0]['diagnosticCode'],reason)
    self.assertNotIsInstance(failed.exception,mod.CodecDefectError)

 def test_public_pointer_observed_provenance_is_strictly_sanitized(self):
  expected='2026-11-09T14:00'
  previous='2026-11-09T13:00'
  leak='secret-token-marker-DO-NOT-LOG'
  tests=(
   ({'schema':'mid.dwd.ruc.grid.v2',
     'storageProfile':'pages-free-v1','run':previous},
    'pages-free-v1',previous,'pages_profile_mismatch'),
   ({'schema':'mid.dwd.ruc.grid.v2',
     'storageProfile':leak,'run':leak},
    'unrecognized','unrecognized','pages_profile_mismatch'),
   ({'schema':'mid.dwd.ruc.grid.v2',
     'storageProfile':'pages-lossless-v1','run':'2026-99-99T99:99'},
    'pages-lossless-v1','unrecognized','pages_profile_mismatch'),
  )
  for payload,profile,run,reason in tests:
   with self.subTest(observed_profile=profile):
    journal=mod.ProbeJournal()
    with self.assertRaises(mod.PagesConvergenceError) as caught:
     mod.probe_pages(
      'https://host.invalid/ruc/?token='+leak,expected,attempts=1,
      expected_profile='pages-lossless-v1',
      fetcher=lambda *_:mod.ProbeResponse(payload,200,{'Content-Type':'application/json'}),
      sleeper=lambda _:None,journal=journal)
    self.assertEqual(caught.exception.code,'pages_convergence_timeout')
    self.assertEqual(len(journal.records),1)
    row=journal.records[0]
    self.assertEqual(row['run'],expected)
    self.assertEqual(row['observedRun'],run)
    self.assertEqual(row['observedStorageProfile'],profile)
    self.assertEqual(row['diagnosticCode'],reason)
    self.assertNotIn(leak,json.dumps(journal.as_dict()))
    self.assertNotIn('token=',json.dumps(journal.as_dict()))

 def test_cli_classifies_failures_and_preserves_exit_two(self):
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(sealed),encoding='utf-8')
   stdout=io.StringIO()
   stderr=io.StringIO()
   with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):
    with mock.patch.object(
      mod,'probe_until_ready',
       side_effect=mod.WorkerHTTPError('private body and URL')
    ):
     result=mod.main(['--url','https://host.invalid/?token=secret',
                      '--meta',str(metadata),'--attempts','1'])
   self.assertEqual(result,2)
   self.assertIn('worker_http_error',stderr.getvalue())
   self.assertNotIn('private body',stderr.getvalue())
   self.assertNotIn('token=secret',stderr.getvalue())
   self.assertNotIn('secret',stderr.getvalue())

 def test_cli_process_exits_two_for_transport_failure(self):
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(sealed),encoding='utf-8')
   result=subprocess.run(
    [sys.executable,str(SCRIPT),'--url','http://127.0.0.1:1/?token=secret',
     '--meta',str(metadata),'--attempts','1'],
    text=True,capture_output=True,timeout=5,check=False)
  self.assertEqual(result.returncode,2)
  self.assertIn('probe_transport_failed',result.stderr)
  self.assertNotIn('token=secret',result.stderr)
  self.assertNotIn('secret',result.stderr)

 def test_full_codec_nonverification_is_not_invented_as_a_codec_defect(self):
  active=copy.deepcopy(sealed)
  active.update({'storageProfile':'pages-lossless-v1',
                 'migration':{'schema':'mid.ruc.migration-active.v1',
                              'productionEnabled':True},
                 'pages':{'profile':'pages-lossless-v1',
                          'losslessTransport':{
                           'profile':'mid.ruc.compressed-pages.v1',
                           'mode':'replacement','rawRetained':False}}})
  worker={**good,'run':MODEL_RUN,'timeCount':28,'pointCount':542040,
          'epsMemberCount':20,'backend':'pages','nativeEpsMembers':False,
          'storageProfile':'pages-lossless-v1',
          'fullCodec':{'advertised':True,'verified':False,'rawRetained':False}}
  self.assertFalse(mod.full_codec_evidence(worker,active)['verified'])
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(active),encoding='utf-8')
   stderr=io.StringIO()
   with contextlib.redirect_stderr(stderr),mock.patch.object(
    mod,'probe_pages',return_value=1
   ),mock.patch.object(
    mod,'probe_until_ready',return_value=(worker,1)
   ):
    result=mod.main(['--url','https://host.invalid/',
                     '--pages-base','https://host.invalid/ruc/',
                     '--meta',str(metadata)])
   self.assertEqual(result,2)
   self.assertIn('codec_evidence_unclassified',stderr.getvalue())
   self.assertNotIn('codec_defect_proven',stderr.getvalue())




 def test_same_run_pages_manifest_must_match_sealed_object_inventory(self):
  # Same UTC run, grid, EPS20 and full time axis must NOT mask changed
  # compressed Pages SHA/object metadata or invalid typed JSON values.
  expected=copy.deepcopy(sealed)
  expected['pages']={'objects':[{'key':'runs/demo/object',
                                 'sha256':'a'*64,'bytes':123}]}
  contract=mod.verified_snapshot_contract(expected)
  base_args=('https://host.invalid/ruc/',MODEL_RUN)
  self.assertEqual(mod.probe_pages(
   *base_args,attempts=1,expected_profile='pages-free-v1',
   expected_contract=contract,expected_manifest=expected,
   fetcher=lambda *_:copy.deepcopy(expected),sleeper=lambda _:None),1)
  for corrupt in ('digest','bytes_type','missing_object','extra_object','nan'):
   public=copy.deepcopy(expected)
   if corrupt=='digest':
    public['pages']['objects'][0]['sha256']='b'*64
   elif corrupt=='bytes_type':
    public['pages']['objects'][0]['bytes']=123.0
   elif corrupt=='missing_object':
    public['pages']['objects']=[]
   elif corrupt=='extra_object':
    public['pages']['objects'].append({'key':'runs/demo/extra',
                                       'sha256':'c'*64,'bytes':0})
   else:
    public['pages']['objects'][0]['bytes']=float('nan')
   with self.subTest(corrupt=corrupt):
    journal=mod.ProbeJournal()
    with self.assertRaises(mod.SnapshotContractError) as caught:
     mod.probe_pages(
      *base_args,attempts=1,expected_profile='pages-free-v1',
      expected_contract=contract,expected_manifest=expected,
      fetcher=lambda *_, public=public:public,
      sleeper=lambda _:None,journal=journal)
    self.assertEqual(caught.exception.code,
                     'snapshot_pages_manifest_mismatch')
    self.assertEqual(journal.records[0]['diagnosticCode'],
                     'snapshot_pages_manifest_mismatch')
    self.assertEqual(journal.records[0]['observedRun'],MODEL_RUN)

 def test_full_codec_never_passes_without_independent_pages_pointer_proof(self):
  # A successful Worker alone cannot prove the active full-codec run is
  # publicly visible. A missing Pages endpoint must fail before Worker I/O.
  active=copy.deepcopy(sealed)
  active.update({'storageProfile':'pages-lossless-v1',
                 'migration':{'schema':'mid.ruc.migration-active.v1',
                              'productionEnabled':True},
                 'pages':{'profile':'pages-lossless-v1',
                          'losslessTransport':{
                           'profile':'mid.ruc.compressed-pages.v1',
                           'mode':'replacement','rawRetained':False}}})
  self.assertTrue(mod.active_profile_valid(active))
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(active),encoding='utf-8')
   output=Path(directory)/'github-output'
   stderr=io.StringIO()
   with (mock.patch.dict(mod.os.environ,{'GITHUB_OUTPUT':str(output)}),
         contextlib.redirect_stderr(stderr),
         mock.patch.object(mod,'probe_until_ready',return_value=(
          {'ready':True,'fullCodec':{'verified':True}},1)) as worker_probe,
         mock.patch.object(mod,'probe_pages') as pages_probe):
    result=mod.main(['--url','https://host.invalid/',
                     '--meta',str(metadata)])
   self.assertEqual(result,2)
   self.assertIn('snapshot_pages_proof_missing',stderr.getvalue())
   worker_probe.assert_not_called()
   pages_probe.assert_not_called()
   self.assertEqual(output.read_text(encoding='utf-8').splitlines(),[
    'health_failure_code=snapshot_pages_proof_missing',
    'rollback_admitted=false'])

 def test_raw_rollback_admission_is_bound_to_proven_post_pages_codec_defect(self):
  # Synthetic replay of the 16Z failure class; not an actual codec proof.
  active=copy.deepcopy(sealed)
  active['storageProfile']='pages-lossless-v1'
  active['migration']={'schema':'mid.ruc.migration-active.v1','productionEnabled':True}
  active['pages']={'profile':'pages-lossless-v1','losslessTransport':{
   'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False}}
  self.assertTrue(mod.active_profile_valid(active))
  with tempfile.TemporaryDirectory() as directory:
   metadata=Path(directory)/'latest.json'
   metadata.write_text(json.dumps(active),encoding='utf-8')
   output=Path(directory)/'github-output'
   argv=['--url','https://host.invalid/','--pages-base',
         'https://host.invalid/ruc/','--meta',str(metadata)]
   for failed,pages_ok,expected in (
    (mod.PagesConvergenceError('16Z not visible; old 15Z only',
       code='pages_convergence_timeout',attempts=12),False,'false'),
    (mod.WorkerAdoptionError('not ready',
       code='codec_evidence_unclassified'),True,'false'),
    (mod.WorkerAdoptionError('spoofed defect',
       code='codec_defect_proven'),True,'false'),
    (mod.CodecDefectError('independently proved codec defect',
       code='codec_defect_proven'),False,'false'),
    (mod.CodecDefectError('independently proved codec defect',
       code='codec_defect_proven'),True,'true'),
   ):
    with self.subTest(code=failed.code,pages_verified=pages_ok):
     output.write_text('',encoding='utf-8')
     with mock.patch.dict(mod.os.environ,{'GITHUB_OUTPUT':str(output)}),\
          contextlib.redirect_stderr(io.StringIO()),\
          mock.patch.object(mod,'probe_pages',
            side_effect=None if pages_ok else failed,
            return_value=1),\
          mock.patch.object(mod,'probe_until_ready',side_effect=failed):
      self.assertEqual(mod.main(argv),2)
     lines=output.read_text(encoding='utf-8').splitlines()
     self.assertEqual(lines,['health_failure_code='+failed.code,
                             'rollback_admitted='+expected])
     self.assertNotIn('old 15Z',output.read_text(encoding='utf-8'))
   output.write_text('',encoding='utf-8')
   with mock.patch.dict(mod.os.environ,{'GITHUB_OUTPUT':str(output)}),\
        contextlib.redirect_stderr(io.StringIO()),\
        mock.patch.object(mod,'probe_until_ready',
          side_effect=mod.CodecDefectError('fake proof')):
    self.assertEqual(mod.main(['--url','https://host.invalid/',
                               '--meta',str(metadata)]),2)
   self.assertIn('rollback_admitted=false',output.read_text(encoding='utf-8'))


if __name__=='__main__':
 unittest.main()

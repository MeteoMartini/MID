#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import tempfile
import contextlib
import io
import threading
import time
from pathlib import Path

path=Path(__file__).with_name('check_ruc_schedule_guard.py')
spec=importlib.util.spec_from_file_location('guard',path);guard=importlib.util.module_from_spec(spec);assert spec.loader;spec.loader.exec_module(guard)
NOW=dt.datetime(2026,8,30,3,0,tzinfo=dt.timezone.utc)

def meta(run='2026-08-30T02:00'):
    return {'schema':guard.SCHEMA,'run':run,'storageProfile':guard.STORAGE_PROFILE,'pages':{'objects':[{'key':f'runs/{run}/x.bin'}]}}

should,reason,dwd,published=guard.decide('2026-08-30T02:00',meta(),now=NOW)
assert should is False and dwd==published=='2026-08-30T02:00' and 'aktuell:' in reason

should,reason,_,_=guard.decide('2026-08-30T02:00',meta('2026-08-30T01:00'),now=NOW)
assert should is True and 'Catch-up erforderlich' in reason

should,reason,_,_=guard.decide('2026-08-30T02:00',meta('2026-08-30T02:00'),now=dt.datetime(2026,8,30,7,1,tzinfo=dt.timezone.utc),max_age_minutes=240)
assert should is True and 'Sicherheits-Rebuild' in reason

bad=meta();bad['storageProfile']='wrong'
should,reason,_,_=guard.decide('2026-08-30T02:00',bad,now=NOW)
assert should is True and 'Metadatenvertrag' in reason

should,reason,_,_=guard.decide(None,meta(),now=NOW)
assert should is True and 'fail-open' in reason

runs=['2026-08-30T00:00/','2026-08-30T01:00/','README']
listing=''.join(f'<a href="{row}">{row}</a>' for row in runs)
assert guard.parse_run_links(listing)=={'2026-08-30T00:00','2026-08-30T01:00'}

required=set(guard.REQUIRED)
def fake_fetch(url):
    if '/r/' not in url:raise AssertionError(url)
    return listing
assert guard.newest_common_run(fake_fetch)=='2026-08-30T01:00'

report=guard.freshness_report('2026-08-30T02:00',meta('2026-08-30T01:00'),True,'catch-up',now=NOW)
assert report['publishedRunAgeMinutes']==120 and report['upstreamRunAgeMinutes']==60
assert report['availabilityLagMinutes']==60 and report['pagesMetaValid'] is True
assert report['observedAt']=='2026-08-30T03:00:00Z'
equal=guard.freshness_report('2026-08-30T02:00',meta(),False,'current',now=NOW)
assert equal['availabilityLagMinutes']==0 and equal['shouldRun'] is False
unknown=guard.freshness_report(None,meta(),True,'discovery unavailable',now=NOW)
assert unknown['availabilityLagMinutes'] is None and unknown['upstreamRunAgeMinutes'] is None
assert unknown['publishedRunAgeMinutes']==60
invalid=guard.freshness_report('2026-08-30T02:00',bad,True,'invalid',now=NOW)
assert invalid['publishedRunAgeMinutes'] is None and invalid['availabilityLagMinutes'] is None
for stamp in ('invalid','2026-02-30T02:00'):
    assert guard.freshness_report(stamp,meta(),True,'invalid',now=NOW)['availabilityLagMinutes'] is None
# Negative values expose future timestamps / an upstream listing regression;
# diagnostic code must not silently turn them into a healthy zero-lag sample.
future=guard.freshness_report('2026-08-30T02:00',meta('2026-08-30T04:00'),True,'future',now=NOW)
assert future['publishedRunAgeMinutes']==-60 and future['availabilityLagMinutes']==-120
offset=NOW.astimezone(dt.timezone(dt.timedelta(hours=2)))
assert guard.freshness_report('2026-08-30T02:00',meta(),False,'current',now=offset)==equal
with tempfile.TemporaryDirectory() as directory:
    summary=Path(directory)/'summary.md';output=Path(directory)/'outputs'
    with contextlib.redirect_stdout(io.StringIO()) as stream:guard.report_freshness(report,str(summary))
    assert json.loads(stream.getvalue().split('RUC freshness metrics: ',1)[1])==report
    assert json.loads(summary.read_text().split('```json\n',1)[1].split('\n```',1)[0])==report
    guard.write_github_outputs(str(output),[('freshness_metrics',json.dumps(report))])
    assert json.loads(output.read_text().split('=',1)[1])==report

print('RUC schedule guard unit contract OK')

# A fully signed active-compression manifest may suppress a redundant run.
# A merely flagged profile, truncated accounting, duplicate inventory key or bad
# SHA must instead trigger the existing fail-open rebuild (not silent freshness).
active=meta();active['storageProfile']=guard.FULL_STORAGE_PROFILE
active['pages'].update({
 'profile':guard.FULL_STORAGE_PROFILE,
 'losslessTransport':{'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False},
 'budgetBytes':900_000_000,'publishedBytes':24,
 'objects':[{'key':'runs/2026-08-30T0200/deterministic/0000.bin','bytes':24,'sha256':'a'*64}]
})
active['deterministic']={'dtype':'int16-le','compressedPages':{'schema':'mid.ruc.compressed-pages.v1','records':2,'recordBytes':12,
 'parts':[{'firstRecord':0,'recordCount':2,'key':'runs/2026-08-30T0200/deterministic/0000.bin',
           'manifest':{'encodedSha256':'a'*64}}]}}
active['epsSummary']={'dtype':'int16-le','compressedPages':{'schema':'mid.ruc.compressed-pages.v1','records':1,'recordBytes':12,
 'parts':[{'firstRecord':0,'recordCount':1,'key':'runs/2026-08-30T0200/deterministic/0000.bin',
           'manifest':{'encodedSha256':'a'*64}}]}}
active['rapid']={}
active['migration']={'schema':'mid.ruc.migration-active.v1','productionEnabled':True,
 'proof':{'sourceManifestSha256':'b'*64,'candidateManifestSha256':'c'*64,
          'fullyDecodedParts':2,'recordComparisons':2}}
assert guard.valid_pages_meta(active)
assert guard.decide('2026-08-30T02:00',active,now=NOW)[0] is False
candidate=json.loads(json.dumps(active));candidate['migration']['productionEnabled']=False
assert not guard.valid_pages_meta(candidate)
assert guard.decide('2026-08-30T02:00',candidate,now=NOW)[0] is True

def reject_invalid_active(change):
 damaged=json.loads(json.dumps(active))
 change(damaged)
 assert guard.valid_pages_meta(damaged) is False
 should,reason,_,_=guard.decide('2026-08-30T02:00',damaged,now=NOW)
 assert should is True and 'Metadatenvertrag' in reason
 report=guard.freshness_report('2026-08-30T02:00',damaged,should,reason,now=NOW)
 assert report['pagesMetaValid'] is False and report['publishedRunAgeMinutes'] is None

reject_invalid_active(lambda d:d['pages'].update({'publishedBytes':25}))
reject_invalid_active(lambda d:d['pages'].update({'budgetBytes':900_000_001}))
reject_invalid_active(lambda d:d['pages']['objects'].append(d['pages']['objects'][0].copy()))
reject_invalid_active(lambda d:d['pages']['objects'][0].update({'sha256':'not-a-sha'}))
reject_invalid_active(lambda d:d['pages']['objects'][0].update({'bytes':0}))
reject_invalid_active(lambda d:d['pages']['objects'][0].update({'key':'runs/../escape'}))
reject_invalid_active(lambda d:d['pages']['objects'][0].update({'key':'runs/\\\\host/evil'}))
reject_invalid_active(lambda d:d['migration'].pop('proof'))
reject_invalid_active(lambda d:d['migration']['proof'].update({'fullyDecodedParts':0}))
reject_invalid_active(lambda d:d['migration']['proof'].update({'sourceManifestSha256':'x'*64}))
reject_invalid_active(lambda d:d['pages'].update({'losslessTransport':{'mode':'replacement','rawRetained':True}}))
reject_invalid_active(lambda d:d['pages'].update({'objects':[None]}))
reject_invalid_active(lambda d:d['deterministic']['compressedPages']['parts'][0].update({'recordCount':1}))
reject_invalid_active(lambda d:d['deterministic']['compressedPages']['parts'][0].update({'firstRecord':1}))
reject_invalid_active(lambda d:d['deterministic']['compressedPages']['parts'][0].update({'key':'runs/not-in-inventory.bin'}))
reject_invalid_active(lambda d:d['deterministic']['compressedPages']['parts'][0]['manifest'].update({'encodedSha256':'no'}))
reject_invalid_active(lambda d:d['deterministic']['compressedPages'].update({'records':3}))
reject_invalid_active(lambda d:d['migration']['proof'].update({'recordComparisons':1}))
assert guard.valid_pages_meta([]) is False
assert guard.valid_pages_meta({'schema':guard.SCHEMA,'storageProfile':guard.FULL_STORAGE_PROFILE}) is False
print('RUC active compressed inventory guard rejects malformed manifests; raw-profile compatibility preserved.')


# Real DWD EPS v1 member path: .../r/RUN/e/NN/s/PTxxxH00M.grib2 .
# Directory checks are only negative readiness evidence; not GRIB admission.
def index_fixture(holes=None,missing_member=None,unfamiliar=False,timeout=False,subhourly=False):
    holes=holes or {}
    def fetch(url):
        if url.endswith('/e/'):
            return ''.join(f'<a href="{i:02d}/">{i:02d}/</a>' for i in range(1,21)
                           if i!=missing_member)
        import re
        member=re.search(r'/e/(\d{2})/s/$',url)
        assert member,'wrong EPS directory'
        n=int(member.group(1))
        if timeout and n==1:raise TimeoutError('index unavailable')
        parts=[f'<a href="PT{h:03d}H00M.grib2">PT{h:03d}H00M.grib2</a>'
               for h in range(28) if h not in holes.get(n,set())]
        if subhourly:
            parts += [f'<a href="PT{h:03d}H{m:02d}M.grib2">PT{h:03d}H{m:02d}M.grib2</a>'
                      for h in range(27) for m in range(5,60,5)]
        if unfamiliar and n==2:parts.append('<a href="unexpected.grib2">x</a>')
        return ''.join(parts)
    return fetch

NEW='2026-08-30T03:00'
assert guard.advertised_eps_listing_complete(NEW,index_fixture()) is True
# Real DWD 20Z example: 325 names = 28 hourly + 297 five-minute.
assert guard.advertised_eps_listing_complete(NEW,index_fixture(subhourly=True)) is True
# The live DWD 20Z/21Z trials proved serial 21-GET indexing cannot meet
# the fixed 14-s budget; four bounded concurrent reads must actually overlap.
lock=threading.Lock()
active_calls=[0]
peak_calls=[0]
def latency_index(url):
    if url.endswith('/e/'):
        return index_fixture(subhourly=True)(url)
    with lock:
        active_calls[0]+=1
        peak_calls[0]=max(peak_calls[0],active_calls[0])
    try:
        time.sleep(0.08)
        return index_fixture(subhourly=True)(url)
    finally:
        with lock:active_calls[0]-=1
start_parallel=time.monotonic()
assert guard.advertised_eps_listing_complete(NEW,latency_index) is True
assert 2<=peak_calls[0]<=4, 'bounded member GETs must overlap'
assert time.monotonic()-start_parallel<1.15, 'sequential 20x GET regression'

assert guard.advertised_eps_listing_complete(NEW,index_fixture(holes={1:{13}},subhourly=True)) is False
assert guard.advertised_eps_listing_complete(NEW,index_fixture({1:{13,27}})) is False
assert guard.advertised_eps_listing_complete(NEW,index_fixture(missing_member=20)) is False
assert guard.advertised_eps_listing_complete(NEW,index_fixture(unfamiliar=True)) is None
assert guard.advertised_eps_listing_complete(NEW,index_fixture(holes={1:{13}},unfamiliar=True)) is None
assert guard.advertised_eps_listing_complete(NEW,index_fixture(timeout=True)) is None
def stalled_index(_url):
    time.sleep(1.0)
    return ''
start=time.monotonic()
assert guard.advertised_eps_listing_complete(NEW,stalled_index,budget_seconds=0.03) is None
assert time.monotonic()-start<0.7, 'wall-clock alarm must interrupt stalled I/O'
assert guard.advertised_eps_listing_complete('bad',index_fixture()) is None
assert guard.advertised_eps_listing_complete(NEW,lambda _: '<a href="new-format/">new-format</a>') is None
healthy=json.loads(json.dumps(active))
clock=dt.datetime(2026,8,30,3,41,tzinfo=dt.timezone.utc)
assert guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',healthy,False,now=clock)
assert not guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',meta('2026-08-30T02:00'),False,now=clock)  # raw emergency rollback must rebuild
for unknown in (True,None,0,'False'):
    assert not guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',healthy,unknown,now=clock)
assert not guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',healthy,False,
                                         now=clock+dt.timedelta(hours=5))
assert not guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',bad,False,now=clock)
assert not guard.may_defer_incomplete_eps('2026-08-30T01:00','2026-08-30T02:00',healthy,False,now=clock)
assert not guard.may_defer_incomplete_eps(NEW,'2026-08-30T02:00',healthy,False,
                                         now=dt.datetime(2026,8,30,1,0,tzinfo=dt.timezone.utc))
print('RUC EPS advertised-incomplete 20x28 directory guard: fail-open negatives and healthy-only wait PASS')

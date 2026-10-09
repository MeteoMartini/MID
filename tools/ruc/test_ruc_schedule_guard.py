#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import tempfile
import contextlib
import io
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

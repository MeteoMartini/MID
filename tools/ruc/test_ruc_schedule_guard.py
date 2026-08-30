#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt
import importlib.util
import json
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

print('RUC schedule guard unit contract OK')

#!/usr/bin/env python3
"""Cheap RUC scheduler/freshness preflight for best-effort GitHub schedules.

The scheduled workflow can be delayed or skipped by GitHub.  This guard runs
before ecCodes/pip installation and decides whether the expensive RUC build is
needed:
- discover the newest DWD run advertised by every required deterministic field
  and RUC-EPS TOT_PREC,
- compare it with the currently published Pages ``latest.json``,
- skip only when the exact same run is structurally valid and still within the
  runtime freshness contract,
- fail open to processing on every network/parse/contract uncertainty.

The build itself remains authoritative: ``fetch_and_build_ruc.py`` still tries
newest-to-older candidates and only publishes a fully decoded candidate.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import html.parser
import json
import os
import re
import time
import urllib.parse
import urllib.request
from typing import Callable, Iterable

UA='MID-weather-dashboard/RUC-schedule-guard'
DET_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p'
EPS_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p'
FORECAST_REQUIRED=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')
GRID_REQUIRED=('CLAT','CLON')
REQUIRED=FORECAST_REQUIRED+GRID_REQUIRED
RUN_RE=re.compile(r'^20\d\d-\d\d-\d\dT\d\d:\d\d/$')
SCHEMA='mid.dwd.ruc.grid.v2'
STORAGE_PROFILE='pages-free-v1'
DEFAULT_MAX_AGE_MINUTES=240

class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__();self.href=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=='a':
            value=dict(attrs).get('href')
            if value:self.href.append(html.unescape(value))

def fetch_text(url:str,timeout:float=12)->str:
    req=urllib.request.Request(url,headers={'Accept':'text/html,application/json;q=0.9,*/*;q=0.5','Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':UA})
    with urllib.request.urlopen(req,timeout=timeout) as response:
        return response.read().decode('utf-8')

def parse_run_links(source:str)->set[str]:
    parser=Links();parser.feed(source);out=set()
    for href in parser.href:
        decoded=urllib.parse.unquote(href)
        if RUN_RE.match(decoded):out.add(decoded[:-1])
    return out

def discover_runs(base:str,param:str,fetch:Callable[[str],str]=fetch_text)->set[str]:
    return parse_run_links(fetch(f'{base}/{param}/r/'))

def newest_common_run(fetch:Callable[[str],str]=fetch_text)->str|None:
    common:set[str]|None=None
    for param in REQUIRED:
        values=discover_runs(DET_BASE,param,fetch)
        common=values if common is None else common&values
        if not common:return None
    common=(common or set())&discover_runs(EPS_BASE,'TOT_PREC',fetch)
    return max(common) if common else None

def published_meta(base_url:str,fetch:Callable[[str],str]=fetch_text)->dict:
    base=base_url.rstrip('/')+'/'
    url=urllib.parse.urljoin(base,'latest.json')
    separator='&' if '?' in url else '?'
    source=fetch(f'{url}{separator}mid_ruc_guard={int(time.time())}')
    value=json.loads(source)
    if not isinstance(value,dict):raise ValueError('published latest.json is not an object')
    return value

def run_time(run:str)->dt.datetime:
    value=dt.datetime.strptime(run,'%Y-%m-%dT%H:%M')
    return value.replace(tzinfo=dt.timezone.utc)

def valid_pages_meta(meta:dict)->bool:
    objects=((meta.get('pages') or {}).get('objects') or []) if isinstance(meta.get('pages'),dict) else []
    return (
        meta.get('schema')==SCHEMA
        and meta.get('storageProfile')==STORAGE_PROFILE
        and isinstance(meta.get('run'),str)
        and bool(RUN_RE.match(meta['run']+'/'))
        and isinstance(objects,list)
        and len(objects)>0
    )

def decide(latest_dwd_run:str|None,meta:dict|None,*,now:dt.datetime|None=None,max_age_minutes:int=DEFAULT_MAX_AGE_MINUTES)->tuple[bool,str,str,str]:
    """Return (should_run, reason, dwd_run, published_run)."""
    published_run=str((meta or {}).get('run') or '')
    dwd_run=str(latest_dwd_run or '')
    if not dwd_run:return True,'DWD-Lauf konnte nicht sicher bestimmt werden; fail-open build',dwd_run,published_run
    if not meta or not valid_pages_meta(meta):return True,'veröffentlichter Pages-RUC fehlt oder verletzt den Metadatenvertrag',dwd_run,published_run
    if published_run!=dwd_run:return True,f'Catch-up erforderlich: DWD {dwd_run} != Pages {published_run}',dwd_run,published_run
    reference=now or dt.datetime.now(dt.timezone.utc)
    if reference.tzinfo is None:reference=reference.replace(tzinfo=dt.timezone.utc)
    try:age_minutes=max(0.0,(reference.astimezone(dt.timezone.utc)-run_time(published_run)).total_seconds()/60)
    except (TypeError,ValueError):return True,'veröffentlichter RUC-Laufzeitstempel ist ungültig',dwd_run,published_run
    if age_minutes>max(1,max_age_minutes):return True,f'RUC-Lauf ist {age_minutes:.0f} min alt (> {max_age_minutes} min); Sicherheits-Rebuild',dwd_run,published_run
    return False,f'aktuell: DWD/Pages exakt {dwd_run}, Laufalter {age_minutes:.0f} min',dwd_run,published_run

def write_github_outputs(path:str|None,rows:Iterable[tuple[str,str]])->None:
    if not path:return
    with open(path,'a',encoding='utf-8') as handle:
        for key,value in rows:
            clean=str(value).replace('\r',' ').replace('\n',' ')
            handle.write(f'{key}={clean}\n')

def main()->int:
    parser=argparse.ArgumentParser()
    parser.add_argument('--pages-base',default=os.getenv('MID_RUC_PAGES_BASE_URL','https://midwx.app/ruc/'))
    parser.add_argument('--max-age-minutes',type=int,default=int(os.getenv('MID_RUC_MAX_AGE_MINUTES',str(DEFAULT_MAX_AGE_MINUTES))))
    parser.add_argument('--github-output',default=os.getenv('GITHUB_OUTPUT'))
    args=parser.parse_args()
    dwd='';meta=None;error=''
    try:dwd=newest_common_run() or ''
    except Exception as exc:error=f'DWD discovery failed: {type(exc).__name__}: {exc}'
    if not error:
        try:meta=published_meta(args.pages_base)
        except Exception as exc:error=f'Pages latest failed: {type(exc).__name__}: {exc}'
    if error:
        should_run=True;reason=f'{error}; fail-open build';published=str((meta or {}).get('run') or '')
    else:
        should_run,reason,dwd,published=decide(dwd,meta,max_age_minutes=args.max_age_minutes)
    print(f'RUC schedule guard: should_run={str(should_run).lower()} · {reason}')
    if dwd:print(f'Newest common DWD run: {dwd}')
    if published:print(f'Published Pages run: {published}')
    write_github_outputs(args.github_output,[
        ('should_run','true' if should_run else 'false'),
        ('reason',reason),
        ('dwd_run',dwd),
        ('published_run',published),
    ])
    return 0

if __name__=='__main__':raise SystemExit(main())

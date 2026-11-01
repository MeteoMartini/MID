#!/usr/bin/env python3
"""Fail-closed, EPS-independent DWD RUC 0..6h directory candidate selector.

Directory inventory is only a *lower-trust preflight*. Actual admission happens
in ruc_fast_lane_producer.build after ecCodes checks every native header/value.
Nothing in this module publishes or changes a live pointer.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
import json

HOURLY_FIELDS = ('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M',
                 'VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')
NATIVE_GRID = ('CLAT','CLON')
RAPID15 = ('CAPE_ML','CIN_ML')
RAPID5 = 'TOT_PREC'


def canonical_run(value):
    if not isinstance(value,str):
        raise ValueError('run must be a UTC text')
    try:
        instant = datetime.strptime(value,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    except (ValueError,TypeError) as error:
        raise ValueError('noncanonical UTC run') from error
    if instant.strftime('%Y-%m-%dT%H:%M') != value or instant.minute != 0:
        raise ValueError('noncanonical UTC hourly run')
    return instant


def select_run_from_inventory(run_sets, native_inventory, *,
                              now=None, max_age_hours=6, max_examined=4):
    """Choose the newest *advertised-complete* deterministic run, never using EPS.

    The result has no release authority; full downloaded GRIB verification is
    still mandatory. `run_sets(code)` enumerates DWD run names and
    `native_inventory(code,run,cadence)` returns exact native lead MINUTES.
    """
    if type(max_age_hours) is not int or not 1 <= max_age_hours <= 12:
        raise ValueError('invalid maximum run age')
    if type(max_examined) is not int or not 1 <= max_examined <= 6:
        raise ValueError('invalid candidate bound')
    now = now or datetime.now(timezone.utc)
    if not isinstance(now,datetime) or now.tzinfo is None:
        raise ValueError('aware UTC clock required')
    now = now.astimezone(timezone.utc)
    available = None
    for code in (*HOURLY_FIELDS,*NATIVE_GRID):
        rows = set(run_sets(code))
        validated = {stamp for stamp in rows if isinstance(stamp,str)
                     and _is_canonical(stamp)}
        available = validated if available is None else available & validated
        if not available:
            return None
    candidates = sorted(available,reverse=True)
    hourly = set(range(0,361,60))
    five = set(range(0,361,5))
    fifteen = set(range(0,361,15))
    for run in candidates[:max_examined]:
        age = now - canonical_run(run)
        if not timedelta(0) <= age <= timedelta(hours=max_age_hours):
            continue
        try:
            def complete(code,cadence,expected):
                leads=list(native_inventory(code,run,cadence))
                return len(leads)==len(expected) and set(leads)==expected
            if any(not complete(code,'hourly',hourly) for code in HOURLY_FIELDS):
                continue
            if any(not native_inventory(code,run,'grid') for code in NATIVE_GRID):
                continue
            if not complete(RAPID5,'rapid-precip',five):
                continue
            if any(not complete(code,'rapid15',fifteen) for code in RAPID15):
                continue
        except (OSError,ValueError,RuntimeError):
            # A DWD index not yet complete is never an accepted GRIB.
            continue
        return run
    return None


def _is_canonical(value):
    try:
        canonical_run(value)
        return True
    except ValueError:
        return False


def discover(now=None):
    from fetch_and_build_ruc import (
        DET_BASE, crawl_files, forecast_lead_minutes, runs, session,
        select_requested_files,
    )
    # No EPS directory is consulted. Model-run selection is not data
    # admission; downloaded field values may still fail subsequently.
    with session() as http:
        def list_runs(code):
            return runs(http,DET_BASE,code)

        def inventory(code,run,cadence):
            urls = crawl_files(http,f'{DET_BASE}/{code}/r/{run}/')
            if cadence=='grid':
                return [0] if urls else []
            files = select_requested_files(urls,6,mode=cadence)
            lead = [forecast_lead_minutes(url) for url in files]
            if any(value is None for value in lead) or len(lead)!=len(set(lead)):
                return []
            return lead
        return select_run_from_inventory(list_runs,inventory,now=now)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--github-output',default='')
    args=parser.parse_args()
    chosen=discover()
    # Absence is a real observation, never zero and never a permitted release.
    if args.github_output:
        with open(args.github_output,'a',encoding='utf-8') as stream:
            stream.write('ready='+('true' if chosen else 'false')+'\n')
            if chosen:stream.write('run='+chosen+'\n')
    print(json.dumps({'directoryCandidateRun':chosen,
        'gribAdmitted':False,'publicationAuthorized':False,
        'epsRequired':False,'evidence':'directory-listed, native-GRIB-not-yet-verified'},
        allow_nan=False,sort_keys=True))


if __name__=='__main__':
    main()

#!/usr/bin/env python3
"""Read-only P1 original DWD 0–27h/EPS20 bitmap and value qualification.

A completed requested GRIB scope proves its original values at one observed
instant, NOT a 168h original publication series, first publication timestamp,
P2 fast-lane eligibility, production release, or measured client freshness.
No original raw values, individual grid cells, or credential material are
uploaded to GitHub as an artifact.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

import numpy as np
import requests

from dwd_availability_observer import assert_dwd_url, valid_run
from scientific_grib_contract_probe import targets, inspect
from build_ruc_bundle import read_messages, normalize, normalize_coordinate

NATIVE_POINTS = 542040
MAX_FILE_BYTES = 40_000_000
LEAD = re.compile(r'/s/PT(\d{3})H(\d{2})M\.grib2$')


def describe_values(values, *, expected_points=NATIVE_POINTS):
    """Do not count masked native NoData as dry zero or smooth real extremes."""
    arr = np.asarray(values)
    if arr.ndim != 1 or expected_points != NATIVE_POINTS or len(arr) != expected_points:
        raise ValueError('original DWD native grid mismatch')
    if np.isinf(arr).any():
        raise ValueError('infinite original DWD GRIB value')
    finite = np.isfinite(arr)
    if not finite.any():
        raise ValueError('entire original DWD GRIB field missing')
    known = arr[finite]
    return {
        'pointCount': NATIVE_POINTS,
        'finiteCount': int(np.count_nonzero(finite)),
        'missingCount': int(np.count_nonzero(~finite)),
        'trueZeroCount': int(np.count_nonzero(known == 0)),
        'minimumOriginal': float(known.min()),
        'maximumOriginal': float(known.max()),
        'missingAsZero': False,
        'extremesSmoothed': False,
    }


def assert_requested_lead(row, bounds):
    url = row.get('url')
    match = LEAD.search(url) if isinstance(url, str) else None
    if not match or not isinstance(bounds, dict) or type(bounds.get('lead_seconds')) is not int:
        raise ValueError('unverified original DWD GRIB lead')
    requested = 3600 * int(match.group(1)) + 60 * int(match.group(2))
    if bounds['lead_seconds'] != requested:
        raise ValueError('GRIB validity differs from requested source file lead')
    return requested


def safe_fetch(row):
    url = row['url']
    assert_dwd_url(url)
    before = datetime.now(timezone.utc).isoformat()
    with requests.get(url, stream=True, timeout=(15, 60)) as response:
        response.raise_for_status()
        assert_dwd_url(response.url)
        length = response.headers.get('Content-Length')
        if length is not None and (not length.isdecimal() or int(length) > MAX_FILE_BYTES):
            raise ValueError('DWD original GRIB object over read-only byte budget')
        chunks, size = [], 0
        for chunk in response.iter_content(chunk_size=1_048_576):
            size += len(chunk)
            if size > MAX_FILE_BYTES:
                raise ValueError('DWD original GRIB exceeds bounded memory')
            chunks.append(chunk)
    payload = b''.join(chunks)
    if not payload:
        raise ValueError('empty DWD original GRIB')
    after = datetime.now(timezone.utc).isoformat()
    return row, payload, before, after


def examine(row, payload, before, after, run, *, decoder=read_messages, header=inspect):
    raw_header = header(row, payload, run)
    lead = assert_requested_lead(row, raw_header)
    member = row['member']
    logical_field = row['logicalField']
    suffix = '.grib2.bz2' if payload.startswith(b'BZh') else '.grib2'
    with tempfile.TemporaryDirectory(prefix='mid-ruc-original-p1-') as folder:
        path = Path(folder) / ('original' + suffix)
        path.write_bytes(payload)
        decoded = list(decoder(path, ensemble=member is not None, expected_run=run,
                               expected_parameter=logical_field))
    if len(decoded) != 1:
        raise ValueError('expected exactly one original DWD GRIB message')
    valid, actual_member, values, units = decoded[0]
    if member is not None and actual_member != member:
        raise ValueError('original EPS member ID differs from DWD request')
    expected_valid = run + timedelta(seconds=lead)
    if valid != expected_valid:
        raise ValueError('original GRIB valid time/source run mismatch')
    normalized = (normalize_coordinate(logical_field, values, units)
                  if logical_field in ('CLAT', 'CLON') else normalize(logical_field, values, units))
    stats = describe_values(normalized)
    return {
        'sha256OriginalDownload': hashlib.sha256(payload).hexdigest(),
        'originalDownloadBytes': len(payload),
        'requestedLeadSeconds': lead,
        'sourceParameter': row['parameter'],
        'logicalField': logical_field,
        'memberId': member,
        'forecastReferenceUtc': run.isoformat(),
        'validTimeUtc': valid.isoformat(),
        'firstObservedRequestUtc': before,
        'responseCompleteObservedUtc': after,
        'firstDwdPublicationInstantVerified': False,
        'actualOriginalSection6BitmapAppliedByProductionDecoder': True,
        'originalValuesVerified': True,
        'originalUnits': units,
        **stats,
    }


def probe(run_text, *, hours, rapid_hours=6, members=20, workers=3, getter=safe_fetch):
    if not valid_run(run_text):
        raise ValueError('invalid DWD UTC model initialization')
    if hours not in (6, 14, 27) or rapid_hours not in (0, 6) or members != 20 or not 1 <= workers <= 4:
        raise ValueError('native requested P1 scope outside bounded contract')
    run = datetime.strptime(run_text, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if run > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise ValueError('future DWD model run cannot be authenticated')
    requested = targets(run_text, hours=hours, rapid_hours=rapid_hours, members=members)
    if len({r['url'] for r in requested}) != len(requested):
        raise ValueError('duplicate original DWD requested GRIB URLs')
    expected_member_leads = {(member, lead) for member in range(1, 21)
                             for lead in range(hours + 1)}
    completed, eps_pairs = [], set()
    iterator = iter(requested)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        pending = set()
        for _ in range(workers):
            row = next(iterator, None)
            if row is not None:
                pending.add(pool.submit(getter, row))
        while pending:
            done, pending = wait(pending, return_when=FIRST_COMPLETED)
            for future in done:
                row, data, before, after = future.result()
                audit = examine(row, data, before, after, run)
                if audit['memberId'] is not None:
                    key = (audit['memberId'], audit['requestedLeadSeconds'] // 3600)
                    if key in eps_pairs:
                        raise ValueError('duplicate original EPS member/forecast lead')
                    eps_pairs.add(key)
                completed.append(audit)
                nxt = next(iterator, None)
                if nxt is not None:
                    pending.add(pool.submit(getter, nxt))
    if len(completed) != len(requested) or eps_pairs != expected_member_leads:
        raise ValueError('original DWD GRIB/EPS20 coverage incomplete')
    return {
        'schema': 'mid.ruc.p1-original-native-grib-values.v1',
        'runUtc': run_text,
        'observedAtUtc': datetime.now(timezone.utc).isoformat(),
        'hours': hours, 'rapidHours': rapid_hours,
        'epsMembers': members, 'nativePoints': NATIVE_POINTS,
        'originalFilesVerified': len(completed),
        'everyRequestedOriginalValueAndBitmapVerified': True,
        'everyRequestedEps20MemberAndLeadVerified': True,
        'full27hOriginalScopeVerified': hours == 27 and rapid_hours == 6,
        'full168hObserved': False,
        'firstDwdPublicationInstantVerified': False,
        'sourcePublicationLatencyP95Authorized': False,
        'clientAdoptionVerified': False,
        'productionSloAuthorized': False,
        'publicationAuthorized': False,
        'records': sorted(completed, key=lambda v:(v['logicalField'], v['validTimeUtc'], v['memberId'] or 0)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--hours', type=int, choices=(6,14,27), default=6)
    parser.add_argument('--rapid-hours', type=int, choices=(0,6), default=6)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or not args.output.parent.is_dir() or args.output.is_symlink():
        parser.error('report output must be an unused ordinary path inside an existing directory')
    report = probe(args.run, hours=args.hours, rapid_hours=args.rapid_hours)
    with args.output.open('x', encoding='utf-8') as dest:
        json.dump(report, dest, sort_keys=True, indent=2, allow_nan=False)
        dest.write('\n')
    print(json.dumps({'runUtc':report['runUtc'],'originalFilesVerified':report['originalFilesVerified'],
                      'full27hOriginalScopeVerified':report['full27hOriginalScopeVerified'],
                      'firstDwdPublicationInstantVerified':False,
                      'productionSloAuthorized':False}, sort_keys=True))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Bounded, read-only DWD RUC *real* GRIB2 field sampler for issue #541.

One object only: an actual downloaded header/bitmap/numeric-value witness,
not a proof that 0–6h/14h, EPS20, or an entire model run is complete.
Observed-at is a polling upper bound, not DWD's first publication instant.
No worker, cache, Pages or RUC pointer changes. No permanent GRIB bytes.
"""
from __future__ import annotations

import argparse
import bz2
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import tempfile
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen

from dwd_availability_observer import (DET, LEAD, GRIB, assert_dwd_url,
                                        discovered_runs, fetch_index)
from ruc_freshness_shadow_gate import model_time

MAX_WIRE_BYTES = 16_000_000
MAX_DECODED_BYTES = 80_000_000
MAX_INDEX_DIRS = 40
CHUNK = 1 << 20
FIELD = 'T_2M'


def choose_source(run, *, field=FIELD, lead_minutes=0, indexer=fetch_index):
    model_time(run)
    if field != FIELD or type(lead_minutes) is not int or lead_minutes not in (0, 60):
        raise ValueError('bounded pilot permits only T_2M lead 0/60')
    root = f'{DET}{field}/r/{run}/'
    assert_dwd_url(root)
    queue, visited, matches = [root], set(), []
    while queue:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        if len(visited) > MAX_INDEX_DIRS:
            raise ValueError('DWD directory discovery exceeded hard bound')
        for href in indexer(url):
            if href.startswith(('?', '#', '//')) or href in ('.', '..', './', '../'):
                continue
            candidate = urljoin(url, href)
            assert_dwd_url(candidate)
            if not candidate.startswith(root):
                continue
            if href.endswith('/'):
                queue.append(candidate)
                continue
            path = unquote(urlsplit(candidate).path)
            if not GRIB.search(path):
                continue
            match = LEAD.search(path)
            if match and int(match['h']) * 60 + int(match['m']) == lead_minutes:
                matches.append(candidate)
    if len(set(matches)) != 1:
        raise ValueError('zero or ambiguous advertised native GRIB source')
    return matches[0]


def fetch_bounded(url, target, *, fetcher=urlopen):
    assert_dwd_url(url)
    if not url.endswith(('.grib2', '.grib2.bz2', '.grb2', '.grb2.bz2')):
        raise ValueError('unsupported DWD GRIB file extension')
    digest, total = hashlib.sha256(), 0
    req = Request(url, headers={'Accept':'application/octet-stream',
                                'User-Agent':'MID-RUC-real-grib-shadow/1'})
    with fetcher(req, timeout=25) as response:
        if response.status != 200 or response.geturl() != url:
            raise RuntimeError('unexpected DWD status or redirect')
        advertised = response.headers.get('Content-Length')
        if advertised and int(advertised) > MAX_WIRE_BYTES:
            raise ValueError('GRIB wire Content-Length exceeds bound')
        with target.open('xb') as file:
            while True:
                block = response.read(min(CHUNK, MAX_WIRE_BYTES - total + 1))
                if not block:
                    break
                total += len(block)
                if total > MAX_WIRE_BYTES:
                    raise ValueError('GRIB wire size exceeds bound')
                digest.update(block)
                file.write(block)
    if total < 100:
        raise ValueError('missing or implausibly short GRIB payload')
    return {'bytes': total, 'sha256': digest.hexdigest()}


def decompress_bounded(source, target):
    """Never feed an unbounded bzip2 bomb to ecCodes."""
    length = 0
    with bz2.open(source, 'rb') as packed, target.open('xb') as output:
        while True:
            chunk = packed.read(min(CHUNK, MAX_DECODED_BYTES - length + 1))
            if not chunk:
                break
            length += len(chunk)
            if length > MAX_DECODED_BYTES:
                raise ValueError('GRIB decoded byte budget exceeded')
            output.write(chunk)
    if length < 100:
        raise ValueError('decoded GRIB is empty')
    return length


def validate_witness(records, *, run, lead_minutes, point_count):
    base = model_time(run)
    expected = base + timedelta(minutes=lead_minutes)
    rows = list(records)
    if len(rows) != 1:
        raise ValueError('expected exactly one DWD GRIB message at selected lead')
    valid, members, npoints, count, low, high, unit = rows[0]
    if valid != expected or members != 0:
        raise ValueError('DWD run/validity/member mismatch')
    if type(npoints) is not int or npoints != point_count:
        raise ValueError('native DWD grid point count changed')
    if type(count) is not int or not 0 < count <= npoints:
        raise ValueError('no valid, decoded DWD values')
    import math
    if not all(type(x) in (float, int) and math.isfinite(x) for x in (low, high)):
        raise ValueError('nonfinite DWD numerical extrema')
    if low > high or unit != 'degC':
        raise ValueError('DWD T_2M values/unit inconsistent')
    # Fahrenheit or Kelvin disguised as Celsius should not silently pass.
    if low < -105 or high > 75:
        raise ValueError('implausible native 2m air temperature')
    return {'validTimeUtc': valid.strftime('%Y-%m-%dT%H:%MZ'),
            'pointCount': npoints, 'finitePointCount': count,
            'missingPointCount': npoints-count, 'minimumC': low, 'maximumC': high}


def actual_witness(path, *, run, lead_minutes):
    # Import native scientific dependencies ONLY in the real-data path.
    import numpy as np
    from build_ruc_bundle import read_messages, normalize, PARAM_MAP
    from grib_metadata import NATIVE_GRID
    base = model_time(run)
    if PARAM_MAP[FIELD] != 'temperature_2m':
        raise ValueError('RUC T_2M source contract changed')
    records = []
    for valid, member, data, units, signature in read_messages(
            path, ensemble=False, expected_run=base, include_signature=True,
            expected_parameter='temperature_2m'):
        values = normalize('temperature_2m', data, units)
        finite = values[np.isfinite(values)]
        records.append((valid, member, len(values), len(finite),
                        float(np.min(finite)) if len(finite) else float('nan'),
                        float(np.max(finite)) if len(finite) else float('nan'),
                        'degC'))
    return validate_witness(records, run=run, lead_minutes=lead_minutes,
                            point_count=NATIVE_GRID[-1])


def sample(run, lead_minutes=0):
    begin = datetime.now(timezone.utc)
    url = choose_source(run, lead_minutes=lead_minutes)
    with tempfile.TemporaryDirectory(prefix='mid-dwd-grib-shadow-') as folder:
        root = Path(folder)
        staged = root / ('source.grib2.bz2' if url.endswith('.bz2') else 'source.grib2')
        source = fetch_bounded(url, staged)
        if url.endswith('.bz2'):
            expanded = root / 'expanded.grib2'
            decoded_bytes = decompress_bounded(staged, expanded)
            data_path = expanded
        else:
            decoded_bytes = source['bytes']
            data_path = staged
        witness = actual_witness(data_path, run=run, lead_minutes=lead_minutes)
    end = datetime.now(timezone.utc)
    return {
        'schema': 'mid.ruc.real-grib-first-field-shadow.v1', 'run': run,
        'sourceField': FIELD, 'leadMinutes': lead_minutes,
        'observedAfterUtc': begin.isoformat().replace('+00:00','Z'),
        'observedBeforeUtc': end.isoformat().replace('+00:00','Z'),
        'sourceUrl': url, 'wire': source, 'decodedBytes': decoded_bytes,
        'witness': witness, 'origin': 'DWD ICON-D2-RUC actual GRIB2/ecCodes',
        'dwdFirstPublishedTimeVerified': False,
        'fullRunVerified': False, 'eps20Verified': False, 'productionAuthorized': False,
        'note': 'one actual GRIB field/time only; time is interval-censored'
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True,
                        help='canonical DWD UTC YYYY-MM-DDTHH:00 or latest')
    parser.add_argument('--lead-minutes', type=int, choices=(0, 60), default=0)
    parser.add_argument('--output', required=True, type=Path)
    a = parser.parse_args()
    if a.output.exists():
        parser.error('do not overwrite an existing sample')
    run = discovered_runs()[0] if a.run == 'latest' else a.run
    model_time(run)
    payload = sample(run, a.lead_minutes)
    a.output.write_text(json.dumps(payload, ensure_ascii=False,
                                   allow_nan=False, indent=2) + '\n', encoding='utf-8')
    print(f'RUC GRIB first-field witness run={run} lead={a.lead_minutes}; '
          'no full-model/production authorization')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

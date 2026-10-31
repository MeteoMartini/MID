#!/usr/bin/env python3
"""Bounded read-only DWD ICON-D2 RUC live GRIB canary.

Four authentic GRIB files, a real ecCodes decode, native WMO/DWD metadata
and bitmap checks. Does NOT prove whole-run completeness or enable a publisher.
Does not infer DWD first-publication timestamps from directory listings.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import tempfile
from urllib.parse import urlsplit

from dwd_availability_observer import assert_dwd_url

PROBES = (
    ('T_2M', 0, 'temperature_2m'),
    ('T_2M', 360, 'temperature_2m'),
    ('TOT_PREC', 5, 'precipitation_acc'),
    ('CAPE_ML', 15, 'cape'),
)
MAX_FILE_BYTES = 35_000_000
MAX_TOTAL_BYTES = 105_000_000
MIN_RUN_AGE_MINUTES = 55
MAX_RUN_AGE_MINUTES = 240


def select_probe_files(files, expected_leads, extractor):
    """Select exactly one authentic filename for each native lead; no duplicates."""
    selected = {}
    for url in files:
        assert_dwd_url(url)
        lead = extractor(url)
        if lead not in expected_leads:
            continue
        if lead in selected:
            raise ValueError(f'duplicate GRIB file for lead {lead}m')
        if not urlsplit(url).path.lower().endswith(('.grib2', '.grib2.bz2')):
            raise ValueError('probe advertised an unexpected file type')
        selected[lead] = url
    if set(selected) != set(expected_leads):
        raise ValueError('sample GRIB file lead is not yet available')
    return selected


def bounded_download(session, url, destination, *, max_bytes=MAX_FILE_BYTES):
    """Reject oversized, partial and cross-origin responses; never follow redirects."""
    assert_dwd_url(url)
    if type(max_bytes) is not int or max_bytes < 4:
        raise ValueError('invalid download bound')
    sha = hashlib.sha256()
    count = 0
    with session.get(url, stream=True, timeout=(12, 65), allow_redirects=False) as response:
        if response.status_code != 200:
            raise RuntimeError(f'DWD GRIB HTTP {response.status_code}')
        header = response.headers.get('Content-Length')
        if header is not None:
            if not header.isdecimal() or int(header) > max_bytes:
                raise ValueError('DWD GRIB content-length exceeds bound')
        with destination.open('xb') as target:
            for chunk in response.iter_content(1 << 20):
                if not chunk:
                    continue
                count += len(chunk)
                if count > max_bytes:
                    raise ValueError('DWD GRIB exceeded the transfer bound')
                target.write(chunk)
                sha.update(chunk)
    if count < 80 or (header is not None and count != int(header)):
        raise ValueError('partial/suspiciously short GRIB download')
    with destination.open('rb') as src:
        magic = src.read(4)
    if magic not in (b'GRIB', b'BZh1', b'BZh2', b'BZh3', b'BZh4', b'BZh5',
                     b'BZh6', b'BZh7', b'BZh8', b'BZh9'):
        raise ValueError('GRIB header/magic missing')
    return {'bytes': count, 'sha256': sha.hexdigest()}


def bitmap_evidence(values, bitmap, point_count):
    """Missing cells do not become zeros; a legitimate dry 0 stays finite."""
    import numpy as np
    arr = np.asarray(values, dtype=np.float64)
    if arr.ndim != 1 or arr.size != point_count:
        raise ValueError('DWD GRIB values are not the native point-length array')
    if bitmap is None:
        valid = np.ones(point_count, dtype=bool)
    else:
        flags = np.asarray(bitmap)
        if flags.ndim != 1 or flags.size != point_count or not np.all((flags == 0) | (flags == 1)):
            raise ValueError('invalid native GRIB bitmap')
        valid = flags == 1
    if not np.any(valid):
        raise ValueError('native GRIB has no physically present cells')
    if not np.all(np.isfinite(arr[valid])):
        raise ValueError('nonfinite native GRIB value in valid bitmap cells')
    return {'nativePoints': int(point_count), 'validPoints': int(valid.sum()),
            'missingPoints': int((~valid).sum()),
            'realZeroPoints': int(np.count_nonzero((arr == 0) & valid))}


def validate_real_grib(path, run, lead_minutes, parameter):
    import numpy as np
    from eccodes import (codes_grib_new_from_file, codes_get, codes_get_array,
                         codes_get_long, codes_release)
    from grib_stream import open_grib_stream
    from grib_metadata import inspect_grib_header, NATIVE_GRID

    expected_run = datetime.strptime(run, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    expected_valid = expected_run + timedelta(minutes=lead_minutes)
    count = 0
    report = None
    with open_grib_stream(Path(path)) as grib:
        while True:
            gid = codes_grib_new_from_file(grib)
            if gid is None:
                break
            try:
                valid, signature = inspect_grib_header(gid, expected_run,
                                                       expected_parameter=parameter)
                if valid != expected_valid:
                    raise ValueError('DWD GRIB validity time / lead mismatch')
                point_count = int(codes_get_long(gid, 'numberOfPoints'))
                if point_count != NATIVE_GRID[-1]:
                    raise ValueError('DWD native point count mismatch')
                values = codes_get_array(gid, 'values', float)
                has_bitmap = int(codes_get_long(gid, 'bitmapPresent'))
                if has_bitmap not in (0, 1):
                    raise ValueError('unexpected native GRIB bitmap flag')
                bitmap = codes_get_array(gid, 'bitmap', int) if has_bitmap else None
                report = bitmap_evidence(values, bitmap, point_count)
                count += 1
                if count != 1:
                    raise ValueError('unexpected multiple GRIB records in native lead file')
            finally:
                codes_release(gid)
    if count != 1:
        raise ValueError('native GRIB contains no usable record')
    return {'validTimeUtc': expected_valid.isoformat().replace('+00:00', 'Z'),
            'nativeGridIdentity': list(NATIVE_GRID), 'headerAndBitmapVerified': True,
            **report}


def select_run(indexer, now):
    from fetch_and_build_ruc import DET_BASE, runs
    fields = ('T_2M', 'TOT_PREC', 'CAPE_ML')
    sets = [set(runs(indexer, DET_BASE, field)) for field in fields]
    for candidate in sorted(set.intersection(*sets), reverse=True):
        try:
            instant = datetime.strptime(candidate, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        age = (now - instant).total_seconds() / 60
        if MIN_RUN_AGE_MINUTES <= age <= MAX_RUN_AGE_MINUTES:
            return candidate
    raise RuntimeError('no sufficiently aged common DWD run advertised; NOT data-complete')


def observe(output):
    from fetch_and_build_ruc import (DET_BASE, session, crawl_files,
                                     forecast_lead_minutes)
    now = datetime.now(timezone.utc)
    s = session()
    try:
        run = select_run(s, now)
        targets = {}
        for field, minute, _ in PROBES:
            targets.setdefault(field, set()).add(minute)
        listings = {}
        for field, requested in targets.items():
            path = f'{DET_BASE}/{field}/r/{run}/'
            listings[field] = select_probe_files(crawl_files(s, path), requested,
                                                 forecast_lead_minutes)
        report = {'schema': 'mid.ruc.grib-live-canary.v1',
                  'observedAtUtc': now.isoformat().replace('+00:00', 'Z'),
                  'run': run, 'product': 'icon-d2-ruc deterministic native',
                  'samples': [], 'entireRunVerified': False,
                  'epsMembersVerified': False, 'appAdoptionVerified': False,
                  'productionDispatchAuthorized': False,
                  'publicationAuthorized': False,
                  'firstDwdPublicationTimeKnown': False}
        used_bytes = 0
        with tempfile.TemporaryDirectory(prefix='mid-ruc-live-canary-') as directory:
            for i, (field, minute, param) in enumerate(PROBES):
                url = listings[field][minute]
                suffix = '.grib2.bz2' if urlsplit(url).path.endswith('.bz2') else '.grib2'
                target = Path(directory) / f'probe-{i}{suffix}'
                checksum = bounded_download(s, url, target)
                used_bytes += checksum['bytes']
                if used_bytes > MAX_TOTAL_BYTES:
                    raise ValueError('total live GRIB canary transfer exceeds bound')
                evidence = validate_real_grib(target, run, minute, param)
                report['samples'].append({'field': field, 'leadMinutes': minute,
                                          'sourceSha256': checksum['sha256'],
                                          'bytes': checksum['bytes'], **evidence})
        target = Path(output)
        if target.exists() or not target.parent.is_dir():
            raise ValueError('new live-canary output must not overwrite an existing file')
        target.write_text(json.dumps(report, ensure_ascii=False, sort_keys=True,
                                     allow_nan=False, separators=(',', ':')) + '\n',
                          encoding='utf-8')
        return report
    finally:
        s.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    report = observe(args.output)
    print(f'RUC live canary: {len(report["samples"])} verified GRIB files for {report["run"]}; '
          'NO whole-run, EPS or publication authority')


if __name__ == '__main__':
    main()

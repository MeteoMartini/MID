#!/usr/bin/env python3
"""Read-only P1 original DWD 0-27h/EPS20 bitmap and value qualification."""
from __future__ import annotations

import argparse
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re
import tempfile

import numpy as np
import requests

from dwd_availability_observer import assert_dwd_url, valid_run
from grib_metadata import step_seconds
from grib_stream import open_grib_stream
from meteo_integrity import validate_accumulation
from scientific_grib_contract_probe import inspect, targets
from build_ruc_bundle import normalize, normalize_coordinate, read_messages

NATIVE_POINTS = 542040
MAX_FILE_BYTES = 40_000_000
LEAD = re.compile(r'/s/PT(\d{3})H(\d{2})M\.grib2$')


def describe_values(values, *, expected_points=NATIVE_POINTS):
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
        'minimumInNormalizedUnit': float(known.min()),
        'maximumInNormalizedUnit': float(known.max()),
        'missingAsZero': False,
        'extremesSmoothed': False,
    }


def bitmap_evidence(values, bitmap_present, bitmap, *, expected_points=NATIVE_POINTS):
    decoded = np.asarray(values)
    if decoded.ndim != 1 or expected_points != NATIVE_POINTS or len(decoded) != expected_points:
        raise ValueError('original DWD decoded grid/value count mismatch')
    if bitmap_present == 0:
        if bitmap is not None:
            raise ValueError('original GRIB has a bitmap although bitmapPresent is zero')
        expected_missing = np.zeros(decoded.shape, dtype=bool)
    elif bitmap_present == 1:
        if bitmap is None:
            raise ValueError('original GRIB declares a missing bitmap')
        bits = np.asarray(bitmap)
        if bits.ndim != 1 or bits.shape != decoded.shape or not np.all((bits == 0) | (bits == 1)):
            raise ValueError('original GRIB bitmap length or bits differ from native grid')
        expected_missing = bits == 0
    else:
        raise ValueError(f'unsupported original GRIB bitmap indicator {bitmap_present}')
    actual_missing = ~np.isfinite(decoded)
    if not np.array_equal(actual_missing, expected_missing):
        raise ValueError('original GRIB decoded missing mask disagrees with Section-6 bitmap')
    return {
        'bitmapPresent': bitmap_present == 1,
        'bitmapLength': NATIVE_POINTS if bitmap_present == 1 else 0,
        'bitmapMissingCount': int(np.count_nonzero(expected_missing)),
        'decodedValueCount': int(decoded.size),
        'decodedMissingCount': int(np.count_nonzero(actual_missing)),
        'missingMaskConsistent': True,
    }


def inspect_original_structure(path):
    from eccodes import codes_get, codes_get_array, codes_get_long, codes_grib_new_from_file, codes_release

    with open_grib_stream(path) as stream:
        gid = codes_grib_new_from_file(stream)
        if gid is None:
            raise ValueError('empty original DWD GRIB')
        try:
            bitmap_present = int(codes_get_long(gid, 'bitmapPresent'))
            bitmap = np.asarray(codes_get_array(gid, 'bitmap')) if bitmap_present == 1 else None
            value_count = int(np.asarray(codes_get_array(gid, 'values')).size)
            data_date = int(codes_get_long(gid, 'dataDate'))
            data_time = int(codes_get_long(gid, 'dataTime'))
            start_step = codes_get(gid, 'startStep')
            end_step = codes_get(gid, 'endStep')
            step_unit = int(codes_get_long(gid, 'stepUnits'))
            step_type = str(codes_get(gid, 'stepType'))
        finally:
            codes_release(gid)
        extra = codes_grib_new_from_file(stream)
        if extra is not None:
            codes_release(extra)
            raise ValueError('expected exactly one original DWD GRIB message')
    reference = datetime.strptime(f'{data_date:08d}{data_time:04d}', '%Y%m%d%H%M').replace(
        tzinfo=timezone.utc
    )
    start_seconds = step_seconds(start_step, step_unit)
    end_seconds = step_seconds(end_step, step_unit)
    return {
        'bitmapPresent': bitmap_present,
        'bitmap': bitmap,
        'valueCount': value_count,
        'forecastReferenceUtc': reference.isoformat(),
        'startStep': str(start_step),
        'endStep': str(end_step),
        'stepUnits': step_unit,
        'startStepSeconds': start_seconds,
        'endStepSeconds': end_seconds,
        'startTimeUtc': (reference + timedelta(seconds=start_seconds)).isoformat(),
        'endTimeUtc': (reference + timedelta(seconds=end_seconds)).isoformat(),
        'stepType': step_type,
    }


def accumulation_key(record):
    if record['logicalField'] != 'precipitation_acc' or record['stepType'] != 'accum':
        return None
    return (
        record['forecastReferenceUtc'],
        record['memberId'],
        record['logicalField'],
        record['originalUnits'],
        record['startTimeUtc'],
        record['startStepSeconds'],
        record['stepUnits'],
        record['stepType'],
    )


def check_accumulation_pair(previous_record, previous_values, current_record, current_values):
    previous_key = accumulation_key(previous_record)
    current_key = accumulation_key(current_record)
    if previous_key is None or current_key is None:
        return False
    if previous_key != current_key:
        raise ValueError('cannot compare precipitation with different run/member/field/unit/start/type')
    if current_record['endStepSeconds'] <= previous_record['endStepSeconds']:
        raise ValueError('precipitation accumulation leads are not strictly increasing')
    validate_accumulation(
        np.stack((previous_values, current_values)),
        f"original TOT_PREC member={current_record['memberId']} "
        f"start={current_record['startTimeUtc']} unit={current_record['originalUnits']}",
    )
    return True


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


def examine(row, payload, before, after, run, *, decoder=read_messages, header=inspect,
            structure_reader=inspect_original_structure):
    raw_header = header(row, payload, run)
    if raw_header.get('sha256') != hashlib.sha256(payload).hexdigest():
        raise ValueError('original DWD header and values input SHA differ')
    lead = assert_requested_lead(row, raw_header)
    member = row['member']
    logical_field = row['logicalField']
    suffix = '.grib2.bz2' if payload.startswith(b'BZh') else '.grib2'
    with tempfile.TemporaryDirectory(prefix='mid-ruc-original-p1-') as folder:
        path = Path(folder) / ('original' + suffix)
        path.write_bytes(payload)
        decoded = list(decoder(path, ensemble=member is not None, expected_run=run,
                               expected_parameter=logical_field))
        structure = structure_reader(path)
    if len(decoded) != 1:
        raise ValueError('expected exactly one original DWD GRIB message')
    valid, actual_member, values, units = decoded[0]
    if member is not None and actual_member != member:
        raise ValueError('original EPS member ID differs from DWD request')
    expected_valid = run + timedelta(seconds=lead)
    if valid != expected_valid or structure['endTimeUtc'] != valid.isoformat():
        raise ValueError('original GRIB valid time/source run mismatch')
    if structure['forecastReferenceUtc'] != run.isoformat():
        raise ValueError('original GRIB initialization differs from requested run')
    if (structure['valueCount'] != NATIVE_POINTS or
            structure['startTimeUtc'] != raw_header['time_bounds'][0] or
            structure['endTimeUtc'] != raw_header['time_bounds'][1] or
            structure['stepType'] != raw_header['processing'] or
            structure['endStepSeconds'] != lead):
        raise ValueError('original GRIB step bounds disagree with validated header contract')
    mask = bitmap_evidence(values, structure['bitmapPresent'], structure['bitmap'])
    normalized = (normalize_coordinate(logical_field, values, units)
                  if logical_field in ('CLAT', 'CLON') else normalize(logical_field, values, units))
    stats = describe_values(normalized)
    if logical_field in ('CLAT', 'CLON'):
        bound = 90 if logical_field == 'CLAT' else 180
        if stats['minimumInNormalizedUnit'] < -bound or stats['maximumInNormalizedUnit'] > bound:
            raise ValueError('original coordinate exceeds physical latitude/longitude limits')
    if logical_field == 'precipitation_acc' and stats['minimumInNormalizedUnit'] < -0.05:
        raise ValueError('original accumulated precipitation is physically negative')
    return {
        'sourceUrl': row['url'],
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
        'originalValuesVerified': True,
        'originalUnits': units,
        'startStep': structure['startStep'],
        'endStep': structure['endStep'],
        'stepUnits': structure['stepUnits'],
        'startStepSeconds': structure['startStepSeconds'],
        'endStepSeconds': structure['endStepSeconds'],
        'startTimeUtc': structure['startTimeUtc'],
        'endTimeUtc': structure['endTimeUtc'],
        'stepType': structure['stepType'],
        **mask,
        **stats,
        '_normalizedValues': normalized,
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
    requested.sort(key=lambda row: (
        row['logicalField'],
        row['member'] or 0,
        3600 * int(LEAD.search(row['url']).group(1)) + 60 * int(LEAD.search(row['url']).group(2)),
    ))
    if len({r['url'] for r in requested}) != len(requested):
        raise ValueError('duplicate original DWD requested GRIB URLs')
    if hours == 27 and rapid_hours == 6 and len(requested) != 1000:
        raise ValueError(f'full original P1 scope expected exactly 1000 files, got {len(requested)}')
    expected_member_leads = {(member, lead) for member in range(1, 21)
                             for lead in range(hours + 1)}
    completed, eps_pairs = [], set()
    next_request = 0
    next_process = 0
    pending = {}
    ready = {}
    last_accumulation = {}
    # Bound all downloaded but not yet processed GRIB payloads, not just workers.
    # A slow first index cannot trigger unbounded downloads of subsequent files.
    def refill(pool):
        nonlocal next_request
        while (next_request < len(requested)
               and len(pending) < workers
               and len(pending) + len(ready) < workers + 1):
            pending[pool.submit(getter, requested[next_request])] = next_request
            next_request += 1

    with ThreadPoolExecutor(max_workers=workers) as pool:
        refill(pool)
        try:
            while pending or ready:
                if not pending and next_process not in ready:
                    raise ValueError('original GRIB processing order lost')
                if pending:
                    done, _ = wait(pending, return_when=FIRST_COMPLETED)
                    for future in done:
                        index = pending.pop(future)
                        ready[index] = future.result()
                    # The completed Future also retains its GRIB payload.
                    # Drop transient references once the result is owned by ready.
                    done.clear()
                    del future
                while next_process in ready:
                    row, data, before, after = ready[next_process]
                    audit = examine(row, data, before, after, run)
                    values = audit.pop('_normalizedValues')
                    key = accumulation_key(audit)
                    if key is not None:
                        prior = last_accumulation.get(key)
                        audit['accumulationCheck'] = {
                            'sameInitializationMemberFieldUnitStartAndType': True,
                            'monotonicityVerified': False,
                            'comparedWithPreviousLead': False,
                        }
                        if prior is not None:
                            previous_record, previous_values = prior
                            audit['accumulationCheck']['monotonicityVerified'] = check_accumulation_pair(
                                previous_record, previous_values, audit, values
                            )
                            audit['accumulationCheck']['comparedWithPreviousLead'] = True
                        last_accumulation[key] = (audit, values)
                    else:
                        audit['accumulationCheck'] = {
                            'sameInitializationMemberFieldUnitStartAndType': False,
                            'monotonicityVerified': False,
                            'comparedWithPreviousLead': False,
                        }
                    if audit['memberId'] is not None:
                        pair = (audit['memberId'], audit['requestedLeadSeconds'] // 3600)
                        if pair in eps_pairs:
                            raise ValueError('duplicate original EPS member/forecast lead')
                        eps_pairs.add(pair)
                    completed.append(audit)
                    del ready[next_process]
                    # Avoid one extra untracked GRIB byte buffer retained by locals.
                    del row, data, before, after
                    next_process += 1
                    refill(pool)

        except BaseException:
            for future in pending:
                future.cancel()
            raise
    if len(completed) != len(requested) or eps_pairs != expected_member_leads:
        raise ValueError('original DWD GRIB/EPS20 coverage incomplete')
    return {
        'schema': 'mid.ruc.p1-original-native-grib-values.v1',
        'runUtc': run_text,
        'observedAtUtc': datetime.now(timezone.utc).isoformat(),
        'hours': hours,
        'rapidHours': rapid_hours,
        'epsMembers': members,
        'nativePoints': NATIVE_POINTS,
        'requestedFiles': len(requested),
        'originalFilesVerified': len(completed),
        'everyRequestedOriginalValueAndBitmapVerified': all(r['missingMaskConsistent'] for r in completed),
        'everyRequestedEps20MemberAndLeadVerified': True,
        'full27hOriginalScopeVerified': hours == 27 and rapid_hours == 6,
        'full168hObserved': False,
        'firstDwdPublicationInstantVerified': False,
        'sourcePublicationLatencyP95Authorized': False,
        'clientAdoptionVerified': False,
        'productionSloAuthorized': False,
        'publicationAuthorized': False,
        'records': sorted(completed, key=lambda v: (v['logicalField'], v['validTimeUtc'], v['memberId'] or 0)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--hours', type=int, choices=(6, 14, 27), default=6)
    parser.add_argument('--rapid-hours', type=int, choices=(0, 6), default=6)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or not args.output.parent.is_dir() or args.output.is_symlink():
        parser.error('report output must be an unused ordinary path inside an existing directory')
    report = probe(args.run, hours=args.hours, rapid_hours=args.rapid_hours)
    with args.output.open('x', encoding='utf-8') as dest:
        json.dump(report, dest, sort_keys=True, indent=2, allow_nan=False)
        dest.write('\n')
    print(json.dumps({
        'runUtc': report['runUtc'],
        'originalFilesVerified': report['originalFilesVerified'],
        'full27hOriginalScopeVerified': report['full27hOriginalScopeVerified'],
        'firstDwdPublicationInstantVerified': False,
        'productionSloAuthorized': False,
    }, sort_keys=True))


if __name__ == '__main__':
    main()

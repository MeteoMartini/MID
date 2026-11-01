#!/usr/bin/env python3
"""Read-only 0..6 / 0..14h FULL native deterministic value qualification.

This is a shadow CHECK, not a short-range producer, EPS approval or publishing
grant. Reuses the exact MID ecCodes bitmap, units, range, cross-field and
cumulative precipitation contracts. No network, Pages, Worker or pointer write.
"""
from __future__ import annotations

import argparse
from datetime import timedelta
import hashlib
import json
from pathlib import Path

from fast_lane_grib_preflight import CORE_FIELDS, _files, _parameter_map
from ruc_freshness_shadow_gate import model_time

MAX_SOURCE_BYTES = 900_000_000


def _hash(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def _reader(path, base, parameter, ensemble=False):
    from build_ruc_bundle import read_messages
    return read_messages(path, ensemble=ensemble, expected_run=base,
                         include_signature=True, expected_parameter=parameter)


def _grid_reader(path, base, parameter):
    return _reader(path, base, parameter)


def qualify(root, run, hours=6, *, reader=_reader, grid_reader=_grid_reader,
            parameters=None, expected_points=None):
    """Validate all *actual* native deterministic arrays; EPS remains independent.

    Injected readers and a tiny native grid are for offline tests only.
    CLI always uses production ecCodes and the pinned DWD native-grid identity.
    """
    import numpy as np
    from build_ruc_bundle import normalize, normalize_coordinate
    from grib_metadata import NATIVE_GRID, assert_same_parameter_signature
    from meteo_integrity import validate_core_fields, validate_accumulation

    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('unsafe/unavailable GRIB staging root')
    if type(hours) is not int or hours not in (6, 14):
        raise ValueError('short lane only admits independently tested +6h/+14h')
    base = model_time(run)
    parameter_map = _parameter_map() if parameters is None else parameters
    if not isinstance(parameter_map, dict) or set(parameter_map) != set(CORE_FIELDS):
        raise ValueError('all twelve canonical DWD fields are mandatory')
    points = NATIVE_GRID[-1] if expected_points is None else expected_points
    if type(points) is not int or not 0 < points <= NATIVE_GRID[-1]:
        raise ValueError('invalid native point count')
    if expected_points is not None and reader is _reader:
        raise ValueError('real ecCodes must use the pinned native grid')
    times = tuple(base + timedelta(hours=lead) for lead in range(hours + 1))
    target = set(times)
    source = {}
    total = 0

    def sealed_files(relative):
        nonlocal total
        files = _files(root, relative)
        if not files:
            raise ValueError('missing required GRIB source group: ' + relative)
        for path in files:
            if path.stat().st_size < 100:
                raise ValueError('empty/suspicious GRIB source: ' + relative)
            name = path.relative_to(root).as_posix()
            if name in source:
                raise ValueError('same GRIB file observed in multiple source groups')
            size = path.stat().st_size
            total += size
            if total > MAX_SOURCE_BYTES:
                raise ValueError('raw GRIB source budget exceeded')
            source[name] = {'sha256': _hash(path), 'bytes': size}
        return files

    def ensure_unchanged(files):
        for path in files:
            record = source[path.relative_to(root).as_posix()]
            if path.stat().st_size != record['bytes'] or _hash(path) != record['sha256']:
                raise ValueError('GRIB source mutated during native decode')

    field_cubes = {}
    for field in CORE_FIELDS:
        key = parameter_map[field]
        files = sealed_files('deterministic/' + field)
        values, signature_ref = {}, None
        for path in files:
            for valid, member, native, units, signature in reader(path, base, key, False):
                signature_ref = assert_same_parameter_signature(key, signature_ref, signature)
                if valid not in target:
                    # Ignore unrequested future hours only after their native
                    # origin, level, grid and time metadata were validated.
                    continue
                if type(member) is not int or member != 0 or valid in values:
                    raise ValueError('mixed ensemble or duplicate valid time: ' + field)
                array = np.asarray(native)
                if array.ndim != 1 or len(array) != points:
                    raise ValueError('wrong native grid point count: ' + field)
                values[valid] = normalize(key, array, units)
        ensure_unchanged(files)
        if set(values) != target:
            raise ValueError(f'{field}: missing {len(target - set(values))} validity slots')
        field_cubes[key] = np.stack([values[valid] for valid in times], axis=0)
    # Coordinates must be native, pinned to the SAME initialization and grid.
    coords = {}
    for axis in ('CLAT', 'CLON'):
        files = sealed_files('grid/' + axis)
        if len(files) != 1:
            raise ValueError('ambiguous coordinate source: ' + axis)
        messages = list(grid_reader(files[0], base, axis))
        ensure_unchanged(files)
        if len(messages) != 1:
            raise ValueError('coordinate GRIB must contain precisely one message')
        valid, member, raw, units, signature = messages[0]
        if valid != base or member != 0:
            raise ValueError('coordinate not from exact native model initialization')
        raw = np.asarray(raw)
        if raw.ndim != 1 or len(raw) != points:
            raise ValueError('coordinate point count drift')
        coords[axis] = normalize_coordinate(axis, raw, units)
        if not np.all(np.isfinite(coords[axis])):
            raise ValueError('coordinate data contains missing native cells')
    if np.any((coords['CLAT'] < -90) | (coords['CLAT'] > 90)) or np.any(
            (coords['CLON'] < -180) | (coords['CLON'] > 180)):
        raise ValueError('invalid native coordinate extents')

    u, v = field_cubes['u10'], field_cubes['v10']
    speed = np.hypot(u, v)
    direction = (180 + np.degrees(np.arctan2(u, v))) % 360
    physical = {**field_cubes,
        'wind_speed_10m': speed, 'wind_direction_10m': direction,
        # This remains a model-native *accumulation*, never a fabricated
        # single-hour interval. No 0h rain interval is created.
        'precipitation': field_cubes['precipitation_acc']}
    coverage = validate_core_fields(physical)
    validate_accumulation(field_cubes['precipitation_acc'], 'RUC 0..' + str(hours) + 'h')
    # Zero precipitation remains a genuine validated zero; missing points
    # propagate through the production native bitmap contract.
    valid_cells = {name: [int(v) for v in np.count_nonzero(np.isfinite(
        field_cubes[name]), axis=1)] for name in parameter_map.values()}
    return {'schema':'mid.ruc.fast-lane-native-values-shadow.v1',
            'run':run, 'hours':hours, 'timeCount':len(times),
            'validTimesUtc':[t.strftime('%Y-%m-%dT%H:%MZ') for t in times],
            'nativePointCount':points,
            'sourceContractGridUuid':NATIVE_GRID[0] if expected_points is None else None,
            'allTwelveDeterministicNativeValuesVerified':True,
            'deterministicBitmapAndPhysicalChecksPassed':True,
            'cumulativePrecipitationValidated':True,
            'gribSourceBytes':total,
            'sources':[{'path':name, **record} for name,record in sorted(source.items())],
            'finitePointsByFieldAndLead':valid_cells,
            'missingCoverage':coverage,
            'eps20Verified':False, 'losslessWirePackingVerified':False,
            'pagesWorkerAppWidgetExportVerified':False, 'productionAuthorized':False,
            'note':'Value shadow is NOT a publisher; independent source authentication, codec and client qualification still required'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--staging',type=Path,required=True)
    p.add_argument('--run',required=True)
    p.add_argument('--hours',type=int,choices=(6,14),default=6)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    if a.output.exists():
        p.error('never overwrite an immutable candidate report')
    # Failure is explicit, never publication authority, a dry zero or false
    # assertion about official DWD availability.
    code=0
    try:
        report=qualify(a.staging,a.run,a.hours)
    except Exception as exc:
        code=2
        report={'schema':'mid.ruc.fast-lane-native-values-shadow.v1',
                'run':a.run,'hours':a.hours,
                'state':'unknown-or-invalid','errorClass':type(exc).__name__,
                'allTwelveDeterministicNativeValuesVerified':False,
                'eps20Verified':False,'productionAuthorized':False}
    a.output.write_text(json.dumps(report,allow_nan=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    print('RUC native value shadow qualification: '+('complete' if code==0 else 'UNKNOWN/INVALID')
          +'; NEVER production authorization')
    return code

if __name__=='__main__':
    raise SystemExit(main())

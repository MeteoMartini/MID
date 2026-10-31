#!/usr/bin/env python3
"""Non-authorizing RUC freshness/fast-lane qualification (no dispatch or writes).

An advertised DWD filename or a self-declared manifest is NEVER a GRIB admission,
an EPS proof, a real publication timestamp, or a production release approval.
"""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path
import json
import math
import re

FIELDS = frozenset('T_2M TD_2M RELHUM_2M PMSL U_10M V_10M VMAX_10M TOT_PREC CLCT CLCL CAPE_ML CIN_ML'.split())
HEX = re.compile(r'^[a-f0-9]{64}$')
RUN = re.compile(r'^20\d{2}-\d{2}-\d{2}T\d{2}:00$')


def model_time(value):
    if not isinstance(value, str) or not RUN.fullmatch(value):
        raise ValueError('noncanonical RUC model UTC initialization')
    try:
        stamp = datetime.strptime(value, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    except ValueError as error:
        raise ValueError('invalid model initialization') from error
    if stamp.strftime('%Y-%m-%dT%H:%M') != value:
        raise ValueError('invalid model timestamp')
    return stamp


def utc(value):
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError('observation must be UTC Z')
    try:
        stamp = datetime.fromisoformat(value[:-1] + '+00:00')
    except ValueError as error:
        raise ValueError('invalid observation time') from error
    if stamp.utcoffset() != timedelta(0):
        raise ValueError('invalid UTC offset')
    return stamp


def first_availability_interval(samples):
    """Negative→positive sample brackets actual first visibility; unknown is never zero."""
    rows = sorted((utc(s['observedAtUtc']), s['available']) for s in samples)
    if len({t for t, _ in rows}) != len(rows) or any(type(v) not in (bool, type(None)) for _, v in rows):
        raise ValueError('duplicate observation or bad availability')
    first = next((i for i, (_, v) in enumerate(rows) if v is True), None)
    if first is None:
        return {'status': 'unknown' if not any(v is False for _, v in rows) else 'not-yet-observed',
                'lowerUtc': None, 'upperUtc': None}
    if any(v is False for _, v in rows[first + 1:]):
        raise ValueError('conflicting availability observations')
    negatives = [t for t, v in rows[:first] if v is False]
    lower = max(negatives) if negatives else None
    encode = lambda t: t.isoformat().replace('+00:00', 'Z') if t else None
    return {'status': 'interval-censored' if lower else 'left-censored',
            'lowerUtc': encode(lower), 'upperUtc': encode(rows[first][0])}


def inspect_fast_metadata(meta):
    """Structural inspection only: never authorizes a shortened production pointer."""
    if not isinstance(meta, dict) or meta.get('schema') != 'mid.ruc.fast-candidate.v1':
        raise ValueError('untrusted candidate schema')
    run = model_time(meta.get('run'))
    hours = meta.get('hours')
    if type(hours) is not int or hours not in (6, 14):
        raise ValueError('fast lane cannot replace 27h pipeline')
    required = [(run + timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(hours + 1)]
    if meta.get('times') != required or type(meta.get('pointCount')) is not int or meta['pointCount'] < 1:
        raise ValueError('invalid fast lane native grid or validity times')
    grid = meta.get('grid')
    if (not isinstance(grid, dict) or type(grid.get('nativePointCount')) is not int or
            grid['nativePointCount'] != meta['pointCount'] or not HEX.fullmatch(str(grid.get('sha256')))):
        raise ValueError('missing native grid identity')
    fields = meta.get('fields')
    if not isinstance(fields, dict) or set(fields) != FIELDS:
        raise ValueError('missing deterministic field')
    for field in fields.values():
        if (not isinstance(field, dict) or field.get('times') != required or
                field.get('nativeGridSha256') != grid['sha256'] or
                not HEX.fullmatch(str(field.get('sha256')))):
            raise ValueError('field grid, hash or time mismatch')
    eps = meta.get('eps')
    if not isinstance(eps, dict) or eps.get('status') not in ('unavailable', 'pending', 'complete-metadata'):
        raise ValueError('ambiguous EPS availability')
    if eps['status'] == 'complete-metadata':
        members = eps.get('memberIdsByTime')
        if not isinstance(members, dict) or set(members) != set(required) or any(
                type(ids) is not list or sorted(ids) != list(range(1, 21)) for ids in members.values()):
            raise ValueError('partial or duplicated EPS members')
    elif eps.get('memberIdsByTime') is not None:
        raise ValueError('incomplete EPS cannot supply member coverage')
    return {'run': meta['run'], 'hours': hours, 'epsMetadataComplete': eps['status'] == 'complete-metadata',
            'actualGribVerified': False, 'publicationAuthorized': False}


def grib_cache_identity(*, run, field, lead_minutes, grid_sha, byte_sha, codec):
    model_time(run)
    if (field not in FIELDS or type(lead_minutes) is not int or not 0 <= lead_minutes <= 1620 or
            not HEX.fullmatch(str(grid_sha)) or not HEX.fullmatch(str(byte_sha)) or
            codec not in ('grib2-v1', 'grib2-bz2-v1')):
        raise ValueError('GRIB cache must bind run/field/lead/grid/bytes/codec')
    return sha256(json.dumps([run, field, lead_minutes, grid_sha, byte_sha, codec],
                             separators=(',', ':')).encode()).hexdigest()


def verify_cached_grib(root, relative, digest):
    if not isinstance(relative, str) or not relative or not HEX.fullmatch(str(digest)):
        raise ValueError('invalid cached GRIB identity')
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError('cache escape')
    base = Path(root).resolve(strict=True)
    path = base
    for part in rel.parts:
        path = path / part
        if path.is_symlink():
            raise ValueError('symlink cache path forbidden')
    if not path.is_file() or not path.resolve().is_relative_to(base):
        raise ValueError('unsafe cache object')
    hasher = sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1 << 20), b''):
            hasher.update(block)
    if hasher.hexdigest() != digest:
        raise ValueError('cached GRIB SHA mismatch')
    return True


def dispatch_shadow(candidate, published_run, in_flight_run, source_sha):
    """No actual trigger or worker access; never recommend production dispatch."""
    if not isinstance(source_sha, str) or not re.fullmatch(r'[a-f0-9]{40}', source_sha):
        raise ValueError('missing verified Stable source SHA')
    if not isinstance(candidate, dict) or candidate.get('sourceSha') != source_sha:
        return {'dispatch': False, 'reason': 'unverified source provenance'}
    try:
        inspect_fast_metadata(candidate)
        future = model_time(candidate['run'])
        published = model_time(published_run)
        in_flight = model_time(in_flight_run) if in_flight_run else None
    except (ValueError, TypeError):
        return {'dispatch': False, 'reason': 'invalid source/time/metadata'}
    if future <= published or (in_flight and future <= in_flight):
        return {'dispatch': False, 'reason': 'duplicate, stale or in-flight run'}
    return {'dispatch': False, 'reason': 'await authentic GRIB admission and SHA-bound single-flight producer',
            'needsIndependentProof': True}


def evaluate_client_freshness(rows):
    """Compute indicative E2E p95; unsigned, missing data NEVER becomes an SLO."""
    lag = []
    runs = set()
    rejected = 0
    for row in rows:
        try:
            run = model_time(row['run'])
            if run in runs:
                raise ValueError('duplicate model run')
            runs.add(run)
            if not all(row.get(key) is True for key in (
                    'gribValidated', 'pagesReadback', 'workerReadback', 'appAdopted')):
                raise ValueError('not fully observed')
            pages, worker, app = (utc(row[key]) for key in ('pagesUtc', 'workerUtc', 'appUtc'))
            if not run <= pages <= worker <= app:
                raise ValueError('invalid model/deploy/client chronology')
            lag.append((app - run).total_seconds() / 60)
        except (ValueError, KeyError, TypeError):
            rejected += 1
    complete = (len(rows) == 168 and len(lag) == 168 and rejected == 0 and
                all((b - a) == timedelta(hours=1) for a, b in zip(sorted(runs), sorted(runs)[1:])))
    p95 = round(sorted(lag)[math.ceil(.95 * len(lag)) - 1], 3) if lag else None
    return {'observed': len(lag), 'unknownOrInvalid': rejected, 'completeSevenDayWindow': complete,
            'indicativeP95Minutes': p95, 'indicativeGoal60mMet': complete and p95 <= 60,
            'productionSloAuthorized': False,
            'reason': 'requires independently authenticated live DWD/EPS/deployment/client evidence'}

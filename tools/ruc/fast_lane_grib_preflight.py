#!/usr/bin/env python3
"""Read-only 0..6/14h RUC GRIB2 header qualification; NEVER a publisher.

Uses the released ecCodes/DWD fixed-surface contracts; distinguishes deterministic
hourly completeness, EPS 20-member coverage and native CLAT/CLON provenance.
No data/bitmap/packing/worker approval is inferred from matching GRIB headers.
All inputs are previously staged DWD objects; no network or production writes.
"""
from __future__ import annotations

import argparse
from datetime import timedelta
import hashlib
import json
from pathlib import Path

from ruc_freshness_shadow_gate import model_time
from grib_metadata import NATIVE_GRID

CORE_FIELDS = ('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M',
               'VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')


def _parameter_map():
    from build_ruc_bundle import PARAM_MAP
    if set(PARAM_MAP) != set(CORE_FIELDS):
        raise ValueError('fast-lane fields drifted from production')
    return PARAM_MAP


def _files(root: Path, relative: str) -> list[Path]:
    base = root.resolve(strict=True)
    folder = root / relative
    if folder.is_symlink() or (folder.exists() and not folder.is_dir()):
        raise ValueError('unsafe GRIB staging folder: ' + relative)
    if not folder.exists():
        return []
    result = []
    for file in folder.rglob('*'):
        if file.is_symlink() or not file.resolve().is_relative_to(base):
            raise ValueError('GRIB staging symlink/escape forbidden')
        if file.is_file() and file.name.endswith(('.grib2','.grib2.bz2','.grb2','.grb2.bz2')):
            result.append(file)
    return sorted(result)


def _sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def real_headers(path, expected_run, expected_parameter, ensemble=False):
    """Stream real DWD GRIB messages with centre/run/grid/level/time checks."""
    from eccodes import codes_get, codes_grib_new_from_file, codes_release
    from grib_stream import open_grib_stream
    from grib_metadata import inspect_grib_header
    with open_grib_stream(path) as stream:
        while True:
            gid = codes_grib_new_from_file(stream)
            if gid is None:
                break
            try:
                valid, signature = inspect_grib_header(gid, expected_run, expected_parameter)
                member = None
                if ensemble:
                    for key in ('perturbationNumber','number'):
                        try:
                            member = int(codes_get(gid, key))
                            break
                        except Exception:
                            pass
                    if member is None:
                        raise ValueError('EPS member missing in actual GRIB header')
                yield valid, member, signature
            finally:
                codes_release(gid)


def evaluate(root, run, hours=6, *, reader=real_headers, parameters=None):
    """Observe independently complete native short horizons. Never authorize publish."""
    base = model_time(run)
    if type(hours) is not int or hours not in (6, 14):
        raise ValueError('only separate 6h/14h diagnostic horizons are permitted')
    root = Path(root)
    if not root.is_dir() or root.is_symlink():
        raise ValueError('invalid GRIB staging root')
    mapping = parameters if parameters is not None else _parameter_map()
    if not isinstance(mapping, dict) or set(mapping) != set(CORE_FIELDS):
        raise ValueError('incorrect complete production field contract')
    targets = {base + timedelta(hours=lead) for lead in range(hours + 1)}
    observed, defects, source_objects = {}, [], []

    def read_group(relative, parameter, ensemble=False):
        found = []
        for file in _files(root, relative):
            if file.stat().st_size == 0:
                raise ValueError('empty GRIB file: ' + relative)
            source_objects.append({'path': str(file.relative_to(root)),
                                   'bytes': file.stat().st_size, 'sha256': _sha(file)})
            for valid, member, signature in reader(file, base, parameter, ensemble):
                if not hasattr(valid, 'tzinfo') or valid.tzinfo is None or valid.utcoffset() != timedelta():
                    raise ValueError('non-UTC GRIB validity timestamp')
                if not isinstance(signature, (tuple, list)) or len(signature) < 2:
                    raise ValueError('unverified GRIB grid/parameter signature')
                if valid in targets:
                    found.append((valid, member))
        return found

    for field in CORE_FIELDS:
        rows = read_group('deterministic/' + field, mapping[field])
        seen = [valid for valid, _ in rows]
        duplicates = len(seen) != len(set(seen))
        tagged = any(member is not None for _, member in rows)
        if duplicates or tagged:
            defects.append('duplicate or ensemble-tagged deterministic record: ' + field)
        missing = sorted(targets - set(seen))
        if missing:
            defects.append(f'{field}: missing {len(missing)} hourly validity slots')
        observed[field] = {'recordCount': len(seen), 'missingCount': len(missing),
                           'headerComplete': not missing and not duplicates and not tagged
                           and len(seen) == len(targets)}
    eps = read_group('eps/TOT_PREC', 'precipitation_acc', True)
    by_valid = {t: set() for t in targets}
    eps_duplicate, eps_invalid = False, False
    for valid, member in eps:
        if type(member) is not int or not 1 <= member <= 20:
            eps_invalid = True
            defects.append('EPS member not in 1..20')
            continue
        if member in by_valid[valid]:
            eps_duplicate = True
        by_valid[valid].add(member)
    if eps_duplicate:
        defects.append('EPS duplicate member at one validity time')
    eps_missing = {t.strftime('%Y-%m-%dT%H:%M'): sorted(set(range(1, 21)) - members)
                   for t, members in by_valid.items() if len(members) != 20}
    if eps_missing:
        defects.append('EPS header/member coverage incomplete')
    grid_complete = True
    for coordinate in ('CLAT', 'CLON'):
        rows = read_group('grid/' + coordinate, coordinate)
        if len(rows) != 1 or rows[0][0] != base:
            grid_complete = False
            defects.append('coordinate missing/mixed analysis timestamp: ' + coordinate)
    det_complete = all(row['headerComplete'] for row in observed.values())
    eps_complete = not eps_invalid and not eps_duplicate and not eps_missing and len(eps) == 20 * len(targets)
    return {'schema': 'mid.ruc.fast-lane-header-preflight.v1', 'run': run, 'hours': hours,
            'requiredPointGrid': {'uuid': NATIVE_GRID[0], 'pointCount': NATIVE_GRID[-1]},
            'deterministicHeadersComplete': det_complete,
            'epsHeadersComplete': eps_complete, 'gridHeadersComplete': grid_complete,
            'deterministic': observed, 'epsMissingMemberIdsByValidUtc': eps_missing,
            'defects': defects, 'sourceObjects': sorted(source_objects, key=lambda o: o['path']),
            'bitmapValuesVerified': False, 'losslessPackingVerified': False,
            'workerPagesAppReadbackVerified': False, 'publicationAuthorized': False,
            'producerAction': 'read-only; independent full native values/bitmap/unit/SHA checks required',
            'note': 'header completeness does not prove real DWD first publication time'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--staging', type=Path, required=True)
    p.add_argument('--run', required=True)
    p.add_argument('--hours', type=int, choices=(6,14), default=6)
    p.add_argument('--output', type=Path, required=True)
    a = p.parse_args()
    if a.output.exists():
        p.error('refuse overwrite of immutable observation report')
    report = evaluate(a.staging, a.run, a.hours)
    a.output.write_text(json.dumps(report, ensure_ascii=False, allow_nan=False, indent=2)+'\n',
                        encoding='utf-8')
    print('RUC real-header preflight: '
          f'deterministic={report["deterministicHeadersComplete"]}, '
          f'eps={report["epsHeadersComplete"]}, grid={report["gridHeadersComplete"]}; '
          'NEVER production authorization')
    return 0 if report['deterministicHeadersComplete'] and report['gridHeadersComplete'] else 2


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Fail-closed, read-only real DWD ICON-D2 GRIB and contour test."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
import requests
from build_model_map_fields import read_field, contours
from build_precipitation_totals import ROOT

LEADS = (1, 3)
MAX_WIRE = 30 * 1024 * 1024
MAX_DECODED = 12 * 1024 * 1024

def verify(output, now=None):
    now = now or datetime.now(timezone.utc)
    base = now.replace(hour=now.hour // 3 * 3, minute=0, second=0, microsecond=0)
    errors = []
    with requests.Session() as session:
        for offset in range(8):
            selected = False
            run = base - timedelta(hours=3 * offset)
            stamp = run.strftime('%Y%m%d%H')
            directory = ROOT + run.strftime('%H') + '/pmsl/'
            try:
                r = session.get(directory, timeout=(8, 25))
                r.raise_for_status()
                names = re.findall(r'href="([^"/]+\.grib2\.bz2)"', r.text)
                chosen = {}
                for lead in LEADS:
                    found = [n for n in names if f'_{stamp}_{lead:03d}_' in n
                             and 'germany_regular-lat-lon_single-level' in n]
                    if len(found) != 1:
                        raise ValueError(f'no unique actual pmsl T+{lead} for {stamp}')
                    chosen[lead] = found[0]
                selected = True
                frames = []
                first_grid = None
                for lead in LEADS:
                    uri = directory + chosen[lead]
                    response = session.get(uri, timeout=(8, 45), stream=True)
                    response.raise_for_status()
                    parts = []
                    length = 0
                    for block in response.iter_content(chunk_size=65536):
                        length += len(block)
                        if length > MAX_WIRE:
                            raise ValueError('compressed GRIB exceeds 30 MiB budget')
                        parts.append(block)
                    raw = b''.join(parts)
                    lats, lons, pa, start = read_field(raw, stamp, lead, 'pmsl')
                    if start != lead:
                        raise ValueError('incorrect instantaneous forecast step')
                    if first_grid is not None and not (np.array_equal(lats, first_grid[0])
                                                       and np.array_equal(lons, first_grid[1])):
                        raise ValueError('grid differs within selected DWD run')
                    first_grid = (lats, lons)
                    value = pa / 100.0
                    if not np.isfinite(value).all():
                        raise ValueError('real source has missing values')
                    lines = contours(value, lats, lons)
                    field = {
                        'schema': 'mid.icon-d2.field.v1',
                        'run': run.isoformat(),
                        'time': (run + timedelta(hours=lead)).isoformat(),
                        'kind': 'pressure', 'unit': 'hPa', 'scale': 0.1,
                        'lats': lats.tolist(), 'lons': lons.tolist(),
                        'values': np.rint(value * 10).astype(np.int32).ravel().tolist(),
                        'isobars': lines
                    }
                    decoded = len(json.dumps(field, separators=(',', ':')).encode())
                    if decoded > MAX_DECODED:
                        raise ValueError(f'actual contour payload {decoded} bytes >12 MiB')
                    frames.append({
                        'leadHours': lead,
                        'validAt': (run + timedelta(hours=lead)).isoformat(),
                        'source': uri, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
                        'compressedBytes': length, 'decodedBytes': decoded,
                        'rows': len(lats), 'cols': len(lons), 'cells': int(value.size),
                        'grid': 'DWD regular_ll, not triangular native',
                        'deltaLat': float(np.median(np.abs(np.diff(lats)))),
                        'deltaLon': float(np.median(np.abs(np.diff(lons)))),
                        'minHpa': float(value.min()), 'maxHpa': float(value.max()),
                        'strideSixMinHpa': float(value[::6, ::6].min()),
                        'strideSixMaxHpa': float(value[::6, ::6].max()),
                        'contourLevels': len(lines),
                        'contourSegments': sum(len(i['paths']) for i in lines)
                    })
                report = {
                    'schema': 'mid.icon-d2.real-contour-canary.v1',
                    'source': 'DWD Open Data real GRIB2',
                    'generatedAt': now.isoformat(),
                    'modelRun': run.isoformat(),
                    'frames': frames,
                    'limitations': 'Tests regular remap only, not triangular native or RUC skill'
                }
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text(json.dumps(report, indent=2) + '\n')
                print(json.dumps(report))
                return
            except (requests.RequestException, OSError, ValueError) as e:
                if selected:
                    raise RuntimeError(f'Fail-closed validation of real DWD run {stamp}') from e
                errors.append(f'{stamp}: {str(e)[:150]}')
    raise RuntimeError('No complete genuine DWD pmsl pair: ' + '; '.join(errors))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', type=Path, required=True)
    verify(ap.parse_args().output)

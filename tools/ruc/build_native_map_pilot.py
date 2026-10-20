#!/usr/bin/env python3
"""Build an ISOLATED, unpublished RUC T2m/PMSL map feasibility artifact.

Uses exactly the preprocessed RUC int16 core and native nearest-cell lookup.
This is *sampled visualization*, not a new DWD GRIB raster or official warning.
It never modifies the RUC source/production manifest, nor any Pages/Worker files.
Only manually inspected pilot output may be used in a future, separately gated release.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import gzip
import hashlib
import json
from pathlib import Path
import re
import tempfile
import shutil
import numpy as np

SCHEMA = 'mid.ruc.native-map-pilot.v1'
GRID_BBOX = (5.5, 47.0, 15.6, 55.2)  # W, S, E, N; Germany preview only
NODATA_U32 = 0xffffffff
NODATA_I16 = -32768
MAX_GRID_ELEMENTS = 800_000
MAX_DECODED_BYTES = 12_000_000
RUN_RE = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:\d\d(?:Z|\+00:00)?$')
FIELDS = {'temperature': ('temperature_2m', '°C'), 'pressure': ('pressure_msl', 'hPa')}


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def valid_run(run: str) -> datetime:
    if not isinstance(run, str) or not RUN_RE.fullmatch(run):
        raise ValueError('RUC model initialization must be an explicit UTC ISO timestamp')
    parsed = datetime.fromisoformat(run.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)  # DWD canonical run convention
    return parsed.astimezone(timezone.utc)


def read_core(root: Path):
    if root.is_symlink():
        raise ValueError('RUC source symlink not allowed')
    meta_bytes = (root / 'latest.json').read_bytes()
    meta = json.loads(meta_bytes)
    if meta.get('schema') != 'mid.dwd.ruc.grid.v2':
        raise ValueError('Unsupported RUC grid schema')
    run = valid_run(meta.get('run'))
    det = meta.get('deterministic') or {}
    lookup_meta = meta.get('lookup') or {}
    grid = meta.get('grid') or {}
    fields = det.get('fields') or []
    times = det.get('times') or []
    points = meta.get('pointCount')
    if not isinstance(points, int) or points < 1 or len(fields) < 2 or len(fields) > 32:
        raise ValueError('Invalid RUC point count or field definition')
    if not isinstance(times, list) or len(times) < 2 or len(times) > 28 or any(
        timestamp != (run + timedelta(hours=lead)).strftime('%Y-%m-%dT%H:%M')
        for lead, timestamp in enumerate(times)
    ):
        raise ValueError('Incomplete or non-hourly RUC validity sequence')
    if any(not isinstance(f, dict) or not isinstance(f.get('name'), str)
           or not isinstance(f.get('unit'), str) or not isinstance(f.get('scale'), (float, int))
           or not np.isfinite(f['scale']) or f['scale'] <= 0
           or not isinstance(f.get('offset', 0), (float, int)) or not np.isfinite(f.get('offset', 0))
           for f in fields):
        raise ValueError('Invalid field units or quantization contract')
    for label, (name, unit) in FIELDS.items():
        matches = [f for f in fields if f['name'] == name]
        if len(matches) != 1 or matches[0]['unit'] != unit:
            raise ValueError(f'Invalid native RUC {label} field or unit')
    required_bytes = points * len(times) * len(fields) * 2
    if det.get('recordBytes') != len(times) * len(fields) * 2 or required_bytes > 2_000_000_000:
        raise ValueError('RUC core record geometry invalid')
    core_path = root / 'deterministic.bin'
    lookup_path = root / 'lookup.bin'
    if any(p.is_symlink() for p in (core_path, lookup_path)):
        raise ValueError('RUC data object symlink not allowed')
    if core_path.stat().st_size != required_bytes:
        raise ValueError('RUC core incomplete/oversized')
    if lookup_meta.get('dtype') != 'uint32-le' or lookup_meta.get('nodata') != NODATA_U32:
        raise ValueError('Unsupported RUC nearest-point index')
    n_x, n_y = grid.get('nx'), grid.get('ny')
    if not all(isinstance(v, int) and v > 1 for v in (n_x, n_y)) or n_x*n_y > 2_000_000:
        raise ValueError('RUC lookup grid dimensions invalid')
    if lookup_path.stat().st_size != n_x * n_y * 4:
        raise ValueError('RUC lookup byte count invalid')
    if any(not isinstance(grid.get(p), (int, float)) or not np.isfinite(grid[p])
           for p in ('lonMin', 'latMin', 'dx', 'dy', 'maxNearestKm')):
        raise ValueError('RUC geographic lookup invalid')
    if not 0 < grid['dx'] <= 0.05 or not 0 < grid['dy'] <= 0.05 or not 0 < grid['maxNearestKm'] <= 5:
        raise ValueError('RUC spatial resolution/nearest radius exceeds pilot budget')
    lookup = np.memmap(lookup_path, dtype='<u4', mode='r', shape=(n_y, n_x))
    if np.any((lookup != NODATA_U32) & (lookup >= points)):
        raise ValueError('Out-of-range RUC nearest-point index')
    cube = np.memmap(core_path, dtype='<i2', mode='r', shape=(points, len(times), len(fields)))
    return meta_bytes, meta, run, fields, times, grid, lookup, cube, core_path, lookup_path


def select_preview(grid: dict, lookup: np.ndarray, bbox=GRID_BBOX):
    west, south, east, north = bbox
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise ValueError('Invalid preview bounds')
    xx = np.arange(lookup.shape[1])
    yy = np.arange(lookup.shape[0])
    lons = grid['lonMin'] + xx * grid['dx']
    lats = grid['latMin'] + yy * grid['dy']
    xs = xx[(lons >= west - 1e-8) & (lons <= east + 1e-8)]
    ys = yy[(lats >= south - 1e-8) & (lats <= north + 1e-8)]
    if len(xs) < 2 or len(ys) < 2 or len(xs)*len(ys) > MAX_GRID_ELEMENTS:
        raise ValueError('Preview coverage missing or above pixel budget')
    ids = np.asarray(lookup[np.ix_(ys, xs)])
    return np.round(lats[ys], 6).tolist(), np.round(lons[xs], 6).tolist(), ids


def extrema(values: np.ndarray, scale: float, offset: float):
    known = values[values != NODATA_I16]
    if not known.size:
        return None
    return [round(float(known.min()) * scale + offset, 8), round(float(known.max()) * scale + offset, 8)]


def build(source: Path, target: Path, bbox=GRID_BBOX) -> dict:
    source = Path(source).resolve(strict=True)
    target = Path(target).resolve()
    if target.exists() or target.is_relative_to(source) or source.is_relative_to(target):
        raise ValueError('Pilot must write to a NEW separate target, never modify RUC source')
    meta_bytes, meta, run, fields, times, grid, lookup, cube, core_path, lookup_path = read_core(source)
    lats, lons, ids = select_preview(grid, lookup, bbox)
    valid_locations = ids != NODATA_U32
    decoded_count = int(valid_locations.sum())
    if not decoded_count:
        raise ValueError('No RUC cells in geographic preview')
    out = {'schema': SCHEMA, 'status': 'unpublished_readonly_pilot', 'productionApproved': False,
           'model': 'DWD ICON-D2-RUC', 'run': run.isoformat(),
           'source': 'DWD Open Data / existing native unstructured RUC core',
           'gridTypeOriginal': 'unstructured_grid',
           'displaySampling': 'nearest-native-point-via-verified-lookup-no-smoothing',
           'maxLookupDistanceKm': grid['maxNearestKm'],
           'packedCoreExtremaMayNotBeRepresentedInPreview': True,
           'packedCoreExtremaMayDifferFromOriginalGrib': True,
           'lats': lats, 'lons': lons, 'nativePointCount': meta['pointCount'],
           'nativePointLookup': {'pixelCount': ids.size, 'insideCoverage': decoded_count,
                                 'maskedOutsideCoverage': int((~valid_locations).sum())},
           'provenance': {'sourceManifestSha256': digest(meta_bytes),
                          'sourceDeterministicSha256': digest(core_path.read_bytes()),
                          'sourceLookupSha256': digest(lookup_path.read_bytes())},
           'products': {}}
    indices = ids[valid_locations].astype(np.intp)
    staging = Path(tempfile.mkdtemp(prefix=target.name + '.partial-', dir=target.parent))
    try:
        for label, (name, unit) in FIELDS.items():
            fi = next(i for i, field in enumerate(fields) if field['name'] == name)
            spec = fields[fi]
            scale, offset = spec['scale'], spec.get('offset', 0)
            refs = []
            for step, time in enumerate(times):
                native = np.asarray(cube[:, step, fi], dtype=np.int16)
                sampled = np.full(ids.shape, NODATA_I16, dtype=np.int16)
                sampled[valid_locations] = native[indices]
                # A preview is not the native field. The two separate extrema
                # record quantized-core extrema that geographic sampling might omit.
                native_range = extrema(native, scale, offset)
                sampled_range = extrema(sampled, scale, offset)
                if not native_range or not sampled_range:
                    raise ValueError(f'No finite native/sample field for {label} at lead {step}')
                values = [None if value == NODATA_I16 else int(value) for value in sampled.flat]
                raw = (json.dumps({'schema': SCHEMA, 'kind': label, 'run': run.isoformat(),
                                   'validTime': (run + timedelta(hours=step)).isoformat(),
                                   'leadHours': step, 'unit': unit, 'scale': scale,
                                   'offset': offset, 'values': values},
                                  separators=(',', ':'), allow_nan=False) + '\n').encode('utf-8')
                if len(raw) > MAX_DECODED_BYTES:
                    raise ValueError('Uncompressed native preview frame exceeds reader bound')
                compressed = gzip.compress(raw, compresslevel=6, mtime=0)
                file = f'{label}-{step:03d}.json.gz'
                (staging / file).write_bytes(compressed)
                refs.append({'leadHours': step, 'validTime': (run+timedelta(hours=step)).isoformat(),
                             'file': file, 'encoding': 'gzip-json', 'bytes': len(compressed),
                             'sha256': digest(compressed), 'decodedBytes': len(raw),
                             'decodedSha256': digest(raw),
                             'packedCoreExtrema': native_range, 'sampledExtrema': sampled_range,
                             'sampledMissingCount': int(np.count_nonzero(sampled == NODATA_I16))})
            out['products'][label] = {'unit': unit, 'scale': scale, 'offset': offset, 'frames': refs}
        (staging / 'index.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n', encoding='utf-8')
        if (source / 'latest.json').read_bytes() != meta_bytes:
            raise ValueError('Source manifest changed while building pilot')
        staging.rename(target)
        return out
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Uncompressed, SHA-verified .ruc-out directory')
    parser.add_argument('target', type=Path, help='NEW, separate pilot output directory')
    arguments = parser.parse_args()
    result = build(arguments.source, arguments.target)
    print(json.dumps({'schema': result['schema'], 'run': result['run'],
                      'status': result['status'],
                      'products': {key: len(value['frames']) for key, value in result['products'].items()}},
                     ensure_ascii=False))

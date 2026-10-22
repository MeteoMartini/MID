#!/usr/bin/env python3
"""Read-only diagnostic: RUC map sidecar coverage vs. SHA-verified full native lookup.

No source or published output is modified. NoData in the lookup is NOT a dry zero.
An omitted source cell does not prove that every meteorological field is present
there; per-parameter native packed values are inspected where available.
"""
from __future__ import annotations
import argparse, gzip, hashlib, io, json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np

NODATA = np.uint32(0xffffffff)
PARAMS = {
    'temperature': 'temperature_2m', 'pressure': 'pressure_msl',
    'wind': 'wind_speed_10m', 'gust': 'wind_gusts_10m',
    'cloud': 'cloud_cover', 'precipitation': 'precipitation',
}
FACTORS = {'temperature': 1., 'pressure': 1., 'wind': 1.852,
           'gust': 1.852, 'cloud': 1., 'precipitation': 1.}
KINDS = frozenset(PARAMS)
SOURCE_MISSING = -32768
MAX_MANIFEST_BYTES = 8_000_000
MAX_FRAME_BYTES = 12_000_000


def checked(source: Path, name: str, descriptor: dict) -> bytes:
    if type(descriptor.get('bytes')) is not int or not 0 < descriptor['bytes'] < 1_000_000_000:
        raise ValueError(f'Invalid byte contract: {name}')
    raw = (source / name).read_bytes()
    if len(raw) != descriptor['bytes'] or hashlib.sha256(raw).hexdigest() != descriptor.get('sha256'):
        raise ValueError(f'SHA/byte drift: {name}')
    return raw


def load_index(path: Path) -> dict:
    if path.stat().st_size > MAX_MANIFEST_BYTES:
        raise ValueError('Oversize map index')
    index = json.loads(path.read_bytes())
    if index.get('schema') not in ('mid.ruc.map-fields.v1', 'mid.ruc.map-candidate.v1'):
        raise ValueError('Unexpected RUC map index schema')
    return index


def utc(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError('Invalid UTC timestamp')
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('Unqualified time in immutable source/index')
    return parsed.astimezone(timezone.utc)


def source_map_values(cube, full_lookup, y_indices, x_indices, hour, field_index,
                      spec, factor, map_scale):
    selected = full_lookup[np.ix_(y_indices, x_indices)]
    valid = selected != NODATA
    picked = cube[np.where(valid, selected, 0).astype(np.intp), hour, field_index]
    known = valid & (picked != SOURCE_MISSING)
    physical = (picked.astype(np.float64) * float(spec['scale']) +
                float(spec.get('offset', 0))) * factor
    expected = np.rint(physical / map_scale)
    if np.any(known & ~np.isfinite(expected)):
        raise ValueError('Unrepresentable source value')
    return known, expected


def inspect(source: Path, maps: Path) -> dict:
    source = source.resolve(strict=True)
    maps = maps.resolve(strict=True)
    if source == maps or source.is_relative_to(maps) or maps.is_relative_to(source):
        raise ValueError('Source and map directory must be disjoint')
    manifest_path = source/'latest.json'
    if manifest_path.stat().st_size > MAX_MANIFEST_BYTES:
        raise ValueError('Oversize source manifest')
    manifest_bytes = manifest_path.read_bytes()
    meta = json.loads(manifest_bytes)
    index = load_index(maps/'index.json')
    if (meta.get('schema') != 'mid.dwd.ruc.grid.v2' or
            utc(index.get('run')) != utc(meta.get('run')) or
            index.get('modelId') not in (None, 'icon-d2-ruc') or
            index.get('sampling') not in (None, 'nearest-native-cell')):
        raise ValueError('Source/index identity drift')
    if index.get('sourceManifestSha256') not in (None, hashlib.sha256(manifest_bytes).hexdigest()):
        raise ValueError('Map index source manifest SHA drift')
    grid = meta.get('lookup', {}).get('grid', meta.get('grid', {}))
    nx, ny = grid.get('nx'), grid.get('ny')
    if any(type(v) is not int or not 2 <= v <= 2000 for v in (nx, ny)):
        raise ValueError('Invalid full source grid dimensions')
    for key in ('lonMin', 'latMin', 'dx', 'dy'):
        if not np.isfinite(grid.get(key, float('nan'))):
            raise ValueError(f'Invalid source grid: {key}')
    if not 0 < grid['dx'] <= 1 or not 0 < grid['dy'] <= 1:
        raise ValueError('Invalid grid spacing')
    objects = meta.get('objects', {})
    lookup_bytes = checked(source, 'lookup.bin', objects.get('lookup.bin', {}))
    if index.get('sourceLookupSha256') not in (None, hashlib.sha256(lookup_bytes).hexdigest()):
        raise ValueError('Map index source lookup SHA drift')
    if len(lookup_bytes) != nx*ny*4:
        raise ValueError('Invalid lookup byte dimensions')
    lookup = np.frombuffer(lookup_bytes, dtype='<u4').reshape(ny, nx)
    points = meta.get('pointCount')
    if type(points) is not int or not 0 < points <= 1_000_000 or np.any((lookup != NODATA) & (lookup >= points)):
        raise ValueError('Invalid native lookup indices')
    lat = grid['latMin'] + np.arange(ny)*grid['dy']
    lon = grid['lonMin'] + np.arange(nx)*grid['dx']
    native = lookup != NODATA
    product_results = []
    dimensions = meta.get('deterministic', {})
    times, specs = dimensions.get('times', []), dimensions.get('fields', [])
    packed = None
    if (isinstance(times, list) and times and isinstance(specs, list) and specs and
            dimensions.get('dtype') == 'int16-le' and dimensions.get('layout') == 'point-time-field'):
        data = checked(source, 'deterministic.bin', objects.get('deterministic.bin', {}))
        if len(data) != points*len(times)*len(specs)*2:
            raise ValueError('Invalid deterministic cube shape')
        packed = np.frombuffer(data, dtype='<i2').reshape(points, len(times), len(specs))
    else:
        raise ValueError('Native deterministic source unavailable: cannot claim field coverage')
    if any(utc(t) != utc(meta['run']) + timedelta(hours=i) for i, t in enumerate(times)):
        raise ValueError('Native source has incomplete hourly validity axis')
    if not isinstance(index.get('products'), dict) or set(index['products']) != KINDS:
        raise ValueError('Expected every published RUC map parameter in domain audit')
    for kind, product in index.get('products', {}).items():
        frames = product.get('frames', [])
        if not isinstance(frames, list) or not frames:
            raise ValueError(f'Missing map frames for {kind}')
        source_field = PARAMS.get(kind)
        spec_indices = [i for i, spec in enumerate(specs) if spec.get('name') == source_field]
        if len(spec_indices) != 1:
            raise ValueError(f'Native source field missing or ambiguous: {kind}')
        spec = specs[spec_indices[0]]
        factor = FACTORS[kind]
        if not isinstance(spec.get('scale'), (int, float)) or not np.isfinite(spec['scale']) or spec['scale'] <= 0 or not np.isfinite(spec.get('offset', 0)):
            raise ValueError('Invalid source quantization')
        seen_hours = set()
        rows = []
        for ref in frames:
            name = ref.get('file', '')
            if not isinstance(name, str) or not name.startswith(kind+'-') or '/' in name or '..' in name:
                raise ValueError('Unexpected map object key')
            raw = checked(maps, name, ref)
            if len(raw) > MAX_FRAME_BYTES or ref.get('encoding') != 'gzip-json':
                raise ValueError('Unexpected compressed frame format/size')
            with gzip.GzipFile(fileobj=io.BytesIO(raw)) as stream:
                decoded = stream.read(MAX_FRAME_BYTES+1)
            if len(decoded) > MAX_FRAME_BYTES or len(decoded) != ref.get('decodedBytes'):
                raise ValueError('Decode size mismatch')
            field = json.loads(decoded)
            ys = np.asarray(field.get('lats', []), dtype=np.float64)
            xs = np.asarray(field.get('lons', []), dtype=np.float64)
            if (len(ys)<2 or len(xs)<2 or not np.isfinite(ys).all() or not np.isfinite(xs).all()
                    or np.any(np.diff(ys)<=0) or np.any(np.diff(xs)<=0)):
                raise ValueError('Invalid published axes')
            if field.get('kind') != kind or utc(field.get('run')) != utc(meta['run']) or \
                    utc(field.get('time')) != utc(ref.get('time')):
                raise ValueError('Map frame identity/validity mismatch')
            hour = ref.get('hour')
            if type(hour) is not int or hour in seen_hours or not 0 <= hour < len(times) or \
                    utc(ref.get('time')) != utc(meta['run']) + timedelta(hours=hour):
                raise ValueError('Map forecast hour/time inconsistency')
            seen_hours.add(hour)
            values = field.get('values')
            if not isinstance(values, list) or len(values) != len(xs)*len(ys):
                raise ValueError('Published raster dimensions mismatch')
            inside = ((lat[:, None] >= ys[0]-1e-5) & (lat[:, None] <= ys[-1]+1e-5)
                      & (lon[None, :] >= xs[0]-1e-5) & (lon[None, :] <= xs[-1]+1e-5))
            y_indices = np.flatnonzero((lat >= ys[0]-1e-5) & (lat <= ys[-1]+1e-5))
            x_indices = np.flatnonzero((lon >= xs[0]-1e-5) & (lon <= xs[-1]+1e-5))
            if (len(y_indices) != len(ys) or len(x_indices) != len(xs) or
                    not np.allclose(lat[y_indices], ys, rtol=0, atol=1e-5) or
                    not np.allclose(lon[x_indices], xs, rtol=0, atol=1e-5)):
                raise ValueError('Map grid does not match source lookup cells')
            map_scale = field.get('scale')
            expected_scale = min(.01, float(spec['scale']) * factor)
            if type(map_scale) not in (int, float) or not np.isclose(map_scale, expected_scale, rtol=0, atol=1e-9):
                raise ValueError('Map field quantization differs from source contract')
            known, expected = source_map_values(packed, lookup, y_indices, x_indices,
                                                hour, spec_indices[0], spec, factor, map_scale)
            observed = np.asarray(values, dtype=object).reshape(len(ys), len(xs))
            observed_known = observed != None  # noqa: E711 - semantic null vs numeric zero
            if np.any(observed_known != known):
                raise ValueError('Missing/source mask mismatch; missing must not become zero')
            if np.any(np.asarray(observed[known], dtype=np.float64) != expected[known]):
                raise ValueError('Map values differ from native quantized source')
            omitted = native & ~inside
            omitted_native_indices = np.unique(lookup[omitted]).astype(np.intp)
            known_outside = None
            known_outside = int(np.count_nonzero(packed[omitted_native_indices, hour, spec_indices[0]] != SOURCE_MISSING))
            rows.append({'hour':hour, 'sourceValueAndMaskRoundtrip':True, 'publishedBounds':[float(xs[0]),float(ys[0]),float(xs[-1]),float(ys[-1])],
                         'omittedNativeLookupCells':int(np.count_nonzero(omitted)),
                         'omittedUniqueNativePoints':int(len(omitted_native_indices)),
                         'omittedKnownParameterNativePoints':known_outside})
        product_results.append({'parameter':kind, 'frames':rows})
    if (source/'latest.json').read_bytes() != manifest_bytes:
        raise ValueError('Source changed during read-only audit')
    return {'schema':'mid.model-domain-audit.v1','sourceRun':meta['run'],
            'sourceLookupBounds':[float(lon[0]),float(lat[0]),float(lon[-1]),float(lat[-1])],
            'sourceLookupCells':int(nx*ny),'nativeLookupCoveredCells':int(np.count_nonzero(native)),
            'products':product_results,
            'allFramesCoverKnownNativeLookup':all(row['omittedNativeLookupCells']==0 for p in product_results for row in p['frames']),
            'allPublishedFrameValuesMatchNativeSource':True}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path, required=True)
    p.add_argument('--maps', type=Path, required=True)
    args = p.parse_args()
    report = inspect(args.source, args.maps)
    print(json.dumps(report, ensure_ascii=False, separators=(',',':')))
    if not report['allFramesCoverKnownNativeLookup']:
        raise SystemExit(2)

if __name__ == '__main__': main()

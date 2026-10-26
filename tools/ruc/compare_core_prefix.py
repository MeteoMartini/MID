"""Compare two raw core builds from the same run, preserving every prefix byte.

Offline qualification only; does not publish or authorize a forecast horizon.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def checked(root, meta, name):
    root = Path(root).resolve(strict=True)
    path = root / name
    if path.is_symlink() or path.resolve(strict=True).parent != root:
        raise ValueError('unsafe object path: ' + name)
    info = meta['objects'][name]
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    if path.stat().st_size != info['bytes'] or digest.hexdigest() != info['sha256']:
        raise ValueError('object integrity: ' + name)
    return path


def compare(short_root, long_root):
    roots = [Path(short_root), Path(long_root)]
    metas = [json.loads((root / 'latest.json').read_text()) for root in roots]
    a, b = metas
    for key in ('schema', 'run', 'pointCount', 'grid', 'lookup', 'sourceGribContract'):
        if a.get(key) != b.get(key):
            raise ValueError('source contract mismatch: ' + key)
    if a['schema'] != 'mid.dwd.ruc.grid.v2' or a['pointCount'] <= 0:
        raise ValueError('unsupported core')
    for root, meta in zip(roots, metas):
        if meta.get('times') != meta['deterministic']['times']:
            raise ValueError('root time axis differs from deterministic axis')
        checked(root, meta, 'lookup.bin')
    if a['objects']['lookup.bin'] != b['objects']['lookup.bin']:
        raise ValueError('lookup changed')
    result = []
    for section, name in (('deterministic', 'deterministic.bin'),
                          ('epsSummary', 'eps-summary.bin'), ('eps', 'eps-members.bin')):
        old, new = a[section], b[section]
        if old.get('dtype')!=('uint16-le' if section=='eps' else 'int16-le') or old.get('layout')!=('point-time-member' if section=='eps' else 'point-time-field'):
            raise ValueError('unsupported record encoding: ' + section)
        n, m = len(old['times']), len(new['times'])
        if n != 15 or m != 28 or new['times'][:n] != old['times']:
            raise ValueError('expected identical +0..14h prefix and +0..27h axis: ' + section)
        from datetime import datetime, timedelta
        run = datetime.fromisoformat(a['run'].replace('Z', '+00:00'))
        for metadata in (old, new):
            if [datetime.fromisoformat(t.replace('Z', '+00:00')) for t in metadata['times']] != [run + timedelta(hours=i) for i in range(len(metadata['times']))]:
                raise ValueError('non-hourly or shifted axis: ' + section)
        contract = lambda item: {k: v for k, v in item.items() if k not in ('key', 'times', 'recordBytes')}
        if contract(old) != contract(new) or old['recordBytes'] * m != new['recordBytes'] * n:
            raise ValueError('encoding contract mismatch: ' + section)
        expected = 2 * (old['memberCount'] if section == 'eps' else len(old['fields']))
        if old['recordBytes'] != n * expected or new['recordBytes'] != m * expected:
            raise ValueError('record size mismatch: ' + section)
        paths = [checked(root, meta, name) for root, meta in zip(roots, metas)]
        for path, metadata in zip(paths, (old, new)):
            if path.stat().st_size != a['pointCount'] * metadata['recordBytes']:
                raise ValueError('object dimensions: ' + section)
        arrays = [np.memmap(path, dtype=np.uint8, mode='r', shape=(a['pointCount'], metadata['recordBytes'])) for path, metadata in zip(paths, (old, new))]
        for start in range(0, a['pointCount'], 4096):
            if not np.array_equal(arrays[0][start:start+4096], arrays[1][start:start+4096, :old['recordBytes']]):
                raise ValueError('prefix bytes changed: ' + section)
        result.append({'section': section, 'points': a['pointCount'], 'prefixTimes': n, 'extendedTimes': m, 'prefixByteIdentical': True})
    return {'schema': 'mid.ruc.core-prefix-proof.v1', 'run': a['run'], 'sections': result, 'productionApproved': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('short_root', type=Path)
    parser.add_argument('long_root', type=Path)
    args = parser.parse_args()
    print(json.dumps(compare(args.short_root, args.long_root), indent=2))

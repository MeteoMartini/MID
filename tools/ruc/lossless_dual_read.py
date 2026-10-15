"""One bounded dual-read pilot; raw objects and scientific coverage stay intact."""
import copy
import hashlib
import json
import os
from lossless_codec_pilot import encode_candidate, decode_candidate

SCHEMA = 'mid.ruc.dual-read.v1'
MAX_PILOT_BYTES = 524288


def add_dual_read_pilot(result, root, budget):
    if os.environ.get('MID_RUC_LOSSLESS_CANARY', '1') == '0':
        return result
    spec = result['deterministic']
    page = spec.get('pages', {})
    if page.get('losslessV1') or result['pages'].get('losslessTransport'):
        raise ValueError('pilot already present')
    count = page.get('chunkCount', 0)
    if not count or spec.get('dtype') != 'int16-le':
        return result
    index = count - 1
    key = page.get('chunkKeys', [])[index] if 'chunkKeys' in page else f"{page['prefix']}/{index:04d}.bin"
    row = next((r for r in result['pages']['objects'] if r['key'] == key), None)
    if not row or not 0 < row['bytes'] <= MAX_PILOT_BYTES:
        return result
    if '..' in key or not key.startswith(page['prefix'].split('/')[0] + '/' + page['prefix'].split('/')[1] + '/'):
        raise ValueError('unsafe raw pilot key')
    raw = (root / key).read_bytes()
    expected = min(page['chunkRecords'], page['records'] - index * page['chunkRecords']) * page['recordBytes']
    if len(raw) != expected or len(raw) != row['bytes'] or hashlib.sha256(raw).hexdigest() != row['sha256']:
        raise ValueError('raw pilot geometry/hash mismatch')
    manifest, wire = encode_candidate(raw, 'byteplanes-gzip')
    if decode_candidate(manifest, wire) != raw:
        raise ValueError('pilot roundtrip mismatch')
    if len(wire) >= len(raw):
        return result
    key = '/'.join(page['prefix'].split('/')[:2]) + '/lossless-v1/' + manifest['encodedSha256'] + '.bin'
    proposed = copy.deepcopy(result)
    proposed['deterministic']['pages']['losslessV1'] = {
        'schema': SCHEMA, 'active': True,
        'chunks': {str(index): {'rawKey': row['key'], 'key': key, 'manifest': manifest}}}
    proposed['pages']['objects'].append({'key': key, 'bytes': len(wire), 'sha256': manifest['encodedSha256']})
    proposed['pages']['publishedBytes'] += len(wire)
    proposed['pages']['losslessTransport'] = {'profile': SCHEMA, 'mode': 'dual-read-pilot', 'rawRetained': True, 'chunkCount': 1, 'addedBytes': len(wire)}
    size = len((json.dumps(proposed, ensure_ascii=False, separators=(',', ':')) + '\n').encode())
    if proposed['pages']['publishedBytes'] + size >= budget:
        return result
    target = root / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(wire)
    return proposed

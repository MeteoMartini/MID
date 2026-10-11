"""Read-only Pages inventory and bounded lossless-compression evidence.

Compression samples are measured, never extrapolated to the full payload.
Duplicate bytes are a manifest-based opportunity, not an implemented saving.
No forecast objects, decoder contracts or storage limits are changed.
"""
import gzip
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path


def audit_storage(meta, root, samples_per_product=3):
    if not 1 <= samples_per_product <= 5:
        raise ValueError('storage audit samples must be 1..5 per product')
    root = Path(root).resolve()
    groups = defaultdict(list)
    seen = set()
    duplicates = 0
    for row in meta['pages']['objects']:
        key = row['key']
        file = (root / key).resolve()
        if not file.is_relative_to(root) or not key.startswith('runs/'):
            raise ValueError('unsafe storage audit object key')
        parts = key.split('/')[2:]
        product = '/'.join(parts[:2]) if parts[0] == 'rapid' else parts[0]
        groups[product].append(row)
        identity = (row['sha256'], row['bytes'])
        if identity in seen:
            duplicates += row['bytes']
        seen.add(identity)
    products = {}
    for product, rows in sorted(groups.items()):
        candidates = sorted((r for r in rows if r['key'].endswith('.bin') and r['bytes'] <= 2_000_000), key=lambda r:r['key'])
        selected = sorted({round(i*(len(candidates)-1)/max(1,samples_per_product-1)) for i in range(samples_per_product)}) if candidates else []
        samples = []
        for index in selected:
            row = candidates[index]
            raw = (root / row['key']).read_bytes()
            if len(raw) != row['bytes'] or hashlib.sha256(raw).hexdigest() != row['sha256']:
                raise ValueError('storage audit sample differs from published manifest')
            # Native map .bin objects already carry gzip-compressed JSON.
            if raw.startswith(b'\x1f\x8b'):
                continue
            compressed = gzip.compress(raw, compresslevel=6, mtime=0)
            if gzip.decompress(compressed) != raw:
                raise ValueError('storage audit lossless roundtrip failed')
            samples.append({'key':row['key'],'sha256':row['sha256'],'rawBytes':len(raw),'gzipBytes':len(compressed)})
        products[product] = {'objectCount':len(rows),'declaredBytes':sum(r['bytes'] for r in rows),'compressionSamples':samples}
    total = sum(p['declaredBytes'] for p in products.values())
    if total != meta['pages']['publishedBytes']:
        raise ValueError('storage audit inventory total differs from publication')
    report = {'schema':'mid.ruc.storage-audit.v1','run':meta['run'],'publishedBytes':total,
              'budgetBytes':meta['pages']['budgetBytes'],'remainingBytes':meta['pages']['budgetBytes']-total,
              'manifestDuplicateBytes':duplicates,'products':products,
              'scope':'exact declared inventory; bounded verified gzip samples; no full-payload savings estimate or publication change'}
    def utc(value):
        parsed = datetime.fromisoformat(value.replace('Z','+00:00'))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
    synoptic = meta.get('synopticFields')
    if synoptic:
        key = synoptic['key']
        file = (root / key).resolve()
        if not file.is_relative_to(root):
            raise ValueError('unsafe synoptic storage audit key')
        payload = json.loads(file.read_text())
        report['cloudWeatherHoursByModel'] = {
            model: [(utc(f['time'])-utc(data['run'])).total_seconds()/3600 for f in data.get('cloudWeatherFrames',[])]
            for model,data in payload['models'].items() if data.get('cloudWeatherFrames')}
    return report

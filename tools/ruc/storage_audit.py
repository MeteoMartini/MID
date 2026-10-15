"""Read-only Pages inventory and bounded lossless-compression evidence.

Compression candidates are measured and roundtripped, never extrapolated.
Production can scan every eligible chunk while keeping sample log detail bounded.
Remaining duplicate bytes are an opportunity; declared deduplicated bytes are measured by the producer.
No forecast objects, decoder contracts or storage limits are changed.
"""
import gzip
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
import numpy as np


def delta_byteplanes(raw):
    """Reversible uint16 delta; all signed/Missing bit patterns survive unchanged."""
    if len(raw) % 2:
        raise ValueError('delta candidate requires complete 16-bit words')
    words = np.frombuffer(raw, dtype='<u2')
    delta = words.copy()
    if words.size > 1:
        delta[1:] = (words[1:].astype(np.uint32)-words[:-1].astype(np.uint32)) & 65535
    wire = delta.tobytes()
    return wire[0::2] + wire[1::2]


def restore_delta_byteplanes(wire):
    if len(wire) % 2:
        raise ValueError('incomplete delta byteplanes')
    raw = bytearray(len(wire))
    half = len(wire)//2
    raw[0::2], raw[1::2] = wire[:half], wire[half:]
    return (np.cumsum(np.frombuffer(raw, dtype='<u2'), dtype=np.uint64) & 65535).astype('<u2').tobytes()


def audit_storage(meta, root, samples_per_product=3, full_compression=False, delta_compression=False):
    if not 1 <= samples_per_product <= 5:
        raise ValueError('storage audit samples must be 1..5 per product')
    root = Path(root).resolve()
    if full_compression:
        # A full inventory claim includes JSON, native gzip maps and objects
        # outside the candidate bound, not only the compression samples.
        from lossless_inventory import verify_inventory
        verify_inventory(meta, root)
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
        candidate_bytes = sum(r['bytes'] for r in rows)
        gzip_candidate = shuffled_candidate = delta_candidate = candidate_bytes
        for index in (range(len(candidates)) if full_compression else selected):
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
            sample = {'key':row['key'],'sha256':row['sha256'],'rawBytes':len(raw),'gzipBytes':len(compressed)}
            # Reversible byte-plane shuffle preserves every int16 bit pattern,
            # including Missing. Measure a candidate; never alter published bytes.
            if product != 'lookup' and len(raw) % 2 == 0:
                shuffled = raw[0::2] + raw[1::2]
                packed = gzip.compress(shuffled, compresslevel=6, mtime=0)
                restored = gzip.decompress(packed)
                half = len(restored)//2
                decoded = bytearray(len(restored))
                decoded[0::2], decoded[1::2] = restored[:half], restored[half:]
                if bytes(decoded) != raw:
                    raise ValueError('storage audit byte-shuffle roundtrip failed')
                sample['shuffledGzipBytes'] = len(packed)
                if delta_compression:
                    delta = gzip.compress(delta_byteplanes(raw), compresslevel=6, mtime=0)
                    if restore_delta_byteplanes(gzip.decompress(delta)) != raw:
                        raise ValueError('storage audit delta byteplane roundtrip failed')
                    sample['deltaByteplanesGzipBytes'] = len(delta)
            if full_compression:
                gzip_candidate -= len(raw) - min(len(raw), len(compressed))
                shuffled_candidate -= len(raw) - min(len(raw), len(compressed), sample.get('shuffledGzipBytes',len(raw)))
                delta_candidate -= len(raw) - min(len(raw), len(compressed), sample.get('shuffledGzipBytes',len(raw)), sample.get('deltaByteplanesGzipBytes',len(raw)))
            if index in selected:
                samples.append(sample)
        products[product] = {'objectCount':len(rows),'declaredBytes':sum(r['bytes'] for r in rows),'compressionSamples':samples}
        if full_compression:
            products[product]['exactCandidateBytes'] = {'gzip':gzip_candidate,'byteplanesGzip':shuffled_candidate,**({'deltaByteplanesGzip':delta_candidate} if delta_compression else {})}

    total = sum(p['declaredBytes'] for p in products.values())
    if total != meta['pages']['publishedBytes']:
        raise ValueError('storage audit inventory total differs from publication')
    report = {'schema':'mid.ruc.storage-audit.v1','run':meta['run'],'publishedBytes':total,
              'budgetBytes':meta['pages']['budgetBytes'],'remainingBytes':meta['pages']['budgetBytes']-total,
              'manifestDuplicateBytes':duplicates,'products':products,
              'scope':'exact declared inventory; bounded verified gzip samples; no full-payload savings estimate or publication change'}
    if full_compression:
        codecs = ('gzip','byteplanesGzip') + (('deltaByteplanesGzip',) if delta_compression else ())
        report['exactCandidateBytes'] = {codec:sum(p['exactCandidateBytes'][codec] for p in products.values()) for codec in codecs}
        report['scope'] = 'full eligible binary inventory verified bytewise; unchanged bytes for other objects; bounded sample detail; candidate sizes are not deployed savings'
    report['deduplicatedBytes'] = meta['pages'].get('deduplicatedBytes',0)
    manifest = root / 'latest.json'
    if manifest.is_file():
        report['manifestBytes'] = manifest.stat().st_size
        report['physicalSnapshotBytes'] = total + report['manifestBytes']
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
        report['synopticHoursByModel'] = {model:[f['hour'] for f in data['frames']] for model,data in payload['models'].items()}
        report['cloudWeatherHoursByModel'] = {
            model: [(utc(f['time'])-utc(data['run'])).total_seconds()/3600 for f in data.get('cloudWeatherFrames',[])]
            for model,data in payload['models'].items() if data.get('cloudWeatherFrames')}
    return report

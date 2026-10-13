"""Bounded, read-only proof-of-concept for future lossless MID RUC chunk transport.

Not imported by the operational encoder/Worker. Never mutate RUC data or the
published mid.dwd.ruc.grid.v2 contract without separate migration gates.
"""
from __future__ import annotations

import gzip
import hashlib
import zlib

from storage_audit import delta_byteplanes, restore_delta_byteplanes

SCHEMA = 'mid.ruc.lossless-candidate.v1'
CODECS = frozenset(('gzip', 'byteplanes-gzip', 'delta-byteplanes-gzip'))
MAX_CHUNK_BYTES = 2_000_000
MAX_WIRE_BYTES = 2_100_000


def _digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _restore_byteplanes(wire: bytes) -> bytes:
    if len(wire) % 2:
        raise ValueError('byteplane input has incomplete int16 words')
    half = len(wire) // 2
    raw = bytearray(len(wire))
    raw[0::2] = wire[:half]
    raw[1::2] = wire[half:]
    return bytes(raw)


def encode_candidate(raw: bytes, codec: str) -> tuple[dict, bytes]:
    if not isinstance(raw, bytes) or not 0 < len(raw) <= MAX_CHUNK_BYTES:
        raise ValueError('candidate requires 1..2,000,000 original bytes')
    if codec not in CODECS:
        raise ValueError('unknown codec')
    if codec != 'gzip' and len(raw) % 2:
        raise ValueError('int16 codec requires complete two-byte records')
    if codec == 'gzip':
        shaped = raw
    elif codec == 'byteplanes-gzip':
        shaped = raw[::2] + raw[1::2]
    else:
        shaped = delta_byteplanes(raw)
    wire = gzip.compress(shaped, compresslevel=6, mtime=0)
    return ({'schema': SCHEMA, 'codec': codec,
             'decodedBytes': len(raw), 'encodedBytes': len(wire),
             'decodedSha256': _digest(raw), 'encodedSha256': _digest(wire)}, wire


def decode_candidate(manifest: dict, wire: bytes) -> bytes:
    if not isinstance(manifest, dict) or set(manifest) != {'schema', 'codec', 'decodedBytes', 'encodedBytes', 'decodedSha256', 'encodedSha256'}:
        raise ValueError('unknown or incomplete candidate manifest')
    if manifest['schema'] != SCHEMA or manifest['codec'] not in CODECS:
        raise ValueError('unrecognized candidate format')
    size = manifest['decodedBytes']
    encoded = manifest['encodedBytes']
    if type(size) is not int or not 0 < size <= MAX_CHUNK_BYTES:
        raise ValueError('decoded size exceeds candidate bound')
    if type(encoded) is not int or not 0 < encoded <= MAX_WIRE_BYTES:
        raise ValueError('encoded size exceeds candidate bound')
    if not isinstance(wire, bytes) or len(wire) != encoded or _digest(wire) != manifest['encodedSha256']:
        raise ValueError('encoded payload length/hash mismatch')
    if manifest['codec'] != 'gzip' and size % 2:
        raise ValueError('int16 candidate not aligned')
    decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
    try:
        shaped = decoder.decompress(wire, size + 1)
    except zlib.error as exc:
        raise ValueError('invalid gzip candidate') from exc
    if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail or len(shaped) != size:
        raise ValueError('truncated, oversized or concatenated candidate')
    if manifest['codec'] == 'gzip':
        raw = shaped
    elif manifest['codec'] == 'byteplanes-gzip':
        raw = _restore_byteplanes(shaped)
    else:
        raw = restore_delta_byteplanes(shaped)
    if len(raw) != size or _digest(raw) != manifest['decodedSha256']:
        raise ValueError('decoded payload length/hash mismatch')
    return raw

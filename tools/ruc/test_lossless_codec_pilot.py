"""Offline, deterministic scientific fidelity and malicious-wire guard tests."""
import gzip
import hashlib
import numpy as np

from lossless_codec_pilot import CODECS, MAX_CHUNK_BYTES, encode_candidate, decode_candidate


def _reject(action):
    try:
        action()
    except ValueError:
        return
    raise AssertionError('invalid candidate unexpectedly accepted')


def verify_candidate_codec():
    # Every possible signed int16 bit pattern, including Missing=-32768,
    # positive/negative/zero/saturation and both byte planes.
    all_patterns = np.arange(65536, dtype='<u2').tobytes()
    for raw in (all_patterns, b'\x00\x00\x00\x80\xff\x7f\xff\xff', b'\x00' * 32):
        for codec in sorted(CODECS):
            manifest, wire = encode_candidate(raw, codec)
            assert decode_candidate(manifest, wire) == raw
            assert wire == encode_candidate(raw, codec)[1], 'gzip wire should be reproducible'
            _reject(lambda: decode_candidate(manifest, wire[:-1]))
            _reject(lambda: decode_candidate(manifest, wire + b'junk'))
            _reject(lambda: decode_candidate({**manifest, 'codec':'unrecognized'}, wire))
            _reject(lambda: decode_candidate({**manifest, 'decodedSha256':'f'*64}, wire))
            _reject(lambda: decode_candidate({**manifest, 'decodedBytes':MAX_CHUNK_BYTES+1}, wire))
            _reject(lambda: decode_candidate({**manifest, 'encodedBytes':True}, wire))
            _reject(lambda: decode_candidate({**manifest, 'schema':'old'}, wire))
            _reject(lambda: decode_candidate({**manifest, 'future':True}, wire))
    _reject(lambda: encode_candidate(b'', 'gzip'))
    _reject(lambda: encode_candidate(b'\x00' * (MAX_CHUNK_BYTES + 1), 'gzip'))
    _reject(lambda: encode_candidate(b'\x01', 'byteplanes-gzip'))
    _reject(lambda: encode_candidate(b'\x01', 'delta-byteplanes-gzip'))
    manifest, wire = encode_candidate(b'\x00' * 100, 'gzip')
    payload = gzip.compress(b'\x00' * 10_000, mtime=0)
    oversized = {**manifest,'encodedBytes':len(payload),'encodedSha256':hashlib.sha256(payload).hexdigest()}
    _reject(lambda: decode_candidate(oversized, payload))
    print('RUC lossless codec pilot: all 65536 int16 patterns, bounded decoder, truncation, corruption and no silent fallback OK')


if __name__ == '__main__':
    verify_candidate_codec()

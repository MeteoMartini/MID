"""Independent offline verification of PRIVATE original IR10.8/GSP preview pairs.

This is a post-render integrity gate only, not a GRIB/ecCodes/source verifier,
production manifest writer, weather-code product, warning, or activation gate.
It reads a previously admitted private 10-pair shadow folder without mutation.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import stat
import struct
import zlib

SCHEMA = 'mid.ir108-gsp.original-native-preview.shadow.v1'
PHASE = {'NoData': 255, 'no_gsp_signal': 0, 'rain_gsp': 1,
         'snow_gsp': 2, 'graupel_gsp': 3, 'mixed_gsp': 4}
MAX_PIXELS = 2_500_000
MAX_ASSET = 14 * 1024 * 1024
MAX_INDEX = 2_000_000
UTC_HOUR = re.compile(r'20\d\d-\d\d-\d\dT\d\d:00:00Z\Z')
UTC_SECOND = re.compile(r'20\d\d-\d\d-\d\dT\d\d:\d\d:00Z\Z')
HEX_SHA = re.compile(r'[a-f0-9]{64}\Z')
PNG_MAGIC = b'\x89PNG\r\n\x1a\n'


class PairIntegrityError(ValueError):
    pass


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise PairIntegrityError(reason)


def utc(value: object, *, hour: bool = False) -> datetime:
    require(isinstance(value, str) and bool((UTC_HOUR if hour else UTC_SECOND).fullmatch(value)),
            'invalid UTC source time')
    try:
        result = datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise PairIntegrityError('invalid UTC source calendar') from exc
    return result


def safe_file(root: Path, name: str, limit: int) -> bytes:
    require(isinstance(name, str) and bool(re.fullmatch(r'[A-Za-z0-9._-]{1,80}', name))
            and name not in {'.', '..'}, 'unsafe asset filename')
    file = root / name
    try:
        info = file.lstat()
        require(stat.S_ISREG(info.st_mode), 'missing or symlinked private asset')
        require(0 < info.st_size <= limit, 'private asset outside byte budget')
        data = file.read_bytes()
        require(len(data) == info.st_size, 'private asset changed during read')
    except (OSError, PermissionError) as exc:
        raise PairIntegrityError('private asset unavailable') from exc
    return data


def bounded_zlib(encoded: bytes, expected: int) -> bytes:
    try:
        decoder = zlib.decompressobj()
        raw = decoder.decompress(encoded, expected + 1)
        require(len(raw) == expected and decoder.eof and not decoder.unused_data
                and not decoder.unconsumed_tail,
                'invalid, truncated, appended or oversized compressed raster')
        tail = decoder.flush()
        require(not tail, 'unexpected zlib trailing raster bytes')
        return raw
    except zlib.error as exc:
        raise PairIntegrityError('corrupt compressed raster') from exc


def png_pixels(encoded: bytes, width: int, height: int) -> bytes:
    require(encoded.startswith(PNG_MAGIC), 'invalid PNG signature')
    cursor = len(PNG_MAGIC)
    chunks: list[tuple[bytes, bytes]] = []
    while cursor < len(encoded):
        require(cursor + 12 <= len(encoded), 'truncated PNG chunk')
        size = struct.unpack_from('>I', encoded, cursor)[0]
        require(size <= MAX_ASSET and cursor + 12 + size <= len(encoded), 'invalid PNG chunk length')
        kind = encoded[cursor + 4:cursor + 8]
        data = encoded[cursor + 8:cursor + 8 + size]
        checksum = struct.unpack_from('>I', encoded, cursor + 8 + size)[0]
        require((zlib.crc32(kind + data) & 0xffffffff) == checksum, 'PNG CRC mismatch')
        require(kind in {b'IHDR', b'IDAT', b'IEND'}, 'unexpected PNG chunk')
        chunks.append((kind, data))
        cursor += size + 12
        if kind == b'IEND':
            break
    require(cursor == len(encoded), 'unexpected PNG trailing bytes')
    require([kind for kind, _ in chunks] == [b'IHDR', b'IDAT', b'IEND'],
            'expected one immutable RGBA8 PNG image')
    header, raster = chunks[0][1], chunks[1][1]
    require(len(header) == 13 and len(chunks[2][1]) == 0, 'incorrect PNG header/trailer')
    require(struct.unpack_from('>II', header) == (width, height)
            and header[8:] == bytes([8, 6, 0, 0, 0]), 'wrong PNG geometry or color format')
    expected = height * (1 + width * 4)
    decoded = bounded_zlib(raster, expected)
    rgba = bytearray()
    stride = 1 + width * 4
    for y in range(height):
        scan = decoded[y * stride:(y + 1) * stride]
        require(scan[0] == 0, 'unexpected PNG filter or row packing')
        rgba.extend(scan[1:])
    return bytes(rgba)


def integrity(root: Path) -> dict:
    require(root.is_dir() and not root.is_symlink(), 'private preview directory unavailable')
    raw = safe_file(root, 'index.json', MAX_INDEX)
    try:
        meta = json.loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise PairIntegrityError('invalid private preview manifest') from exc
    require(isinstance(meta, dict) and meta.get('schema') == SCHEMA,
            'wrong private preview schema')
    for flag in ('isObservation', 'isOfficialWmoWeatherCode',
                 'activationAuthorized', 'productionApproved'):
        require(meta.get(flag) is False, 'private preview must never claim observation or release')
    require(meta.get('model') == 'DWD ICON-D2-RUC'
            and meta.get('sampling') == 'nearest-native-cell'
            and meta.get('nativeCellCount') == 542040,
            'wrong model, native source grid or sampling')
    require(meta.get('phaseLegend') == PHASE and meta.get('phaseNoDataId') == 255
            and meta.get('phaseNoGspSignalId') == 0,
            'missing/zero signal and phase IDs must remain distinguishable')
    require(meta.get('fixedIrBrightnessTemperatureKelvin') == [170.0, 340.0],
            'original IR Kelvin scale is not fixed')
    require(all(isinstance(meta.get(key), str) and HEX_SHA.fullmatch(meta[key])
                for key in ('sourceLookupSha256', 'sourceRucManifestSha256')),
            'missing original source/lookup SHA binding')
    originals = meta.get('originalManifestsSha256')
    require(isinstance(originals, dict) and len(originals) == 2
            and all(isinstance(k, str) and k and isinstance(v, str)
                    and HEX_SHA.fullmatch(v) for k, v in originals.items()),
            'two independently admitted original manifests are required')
    bounds, size = meta.get('bounds'), meta.get('size')
    require(isinstance(size, list) and len(size) == 2
            and all(type(n) is int and 1 <= n <= 2000 for n in size),
            'wrong north-up display grid')
    width, height = size
    pixels = width * height
    require(pixels <= MAX_PIXELS, 'oversized north-up display grid')
    require(isinstance(bounds, list) and len(bounds) == 4
            and all(type(n) in (float, int) and math.isfinite(n) for n in bounds)
            and -180 <= bounds[0] < bounds[2] <= 180
            and -90 <= bounds[1] < bounds[3] <= 90,
            'unsafe georeferenced display bounds')
    run = utc(meta.get('run'), hour=True)
    frames = meta.get('times')
    require(type(frames) is list and len(frames) == 10, 'exactly ten original 15min pairs required')
    start = utc(frames[0].get('validTime')) if isinstance(frames[0], dict) else None
    require(start is not None and timedelta(0) <= start - run
            and start - run + timedelta(minutes=135) <= timedelta(hours=14)
            and int((start - run).total_seconds()) % 900 == 0,
            'shadow preview extends beyond its admitted 14h origin')
    used: set[str] = set()
    for i, frame in enumerate(frames):
        require(isinstance(frame, dict), 'invalid native pair')
        require(utc(frame.get('validTime')) == start + timedelta(minutes=15 * i),
                'native pairs are not strictly consecutive in UTC')
        parts = []
        for key, filename, encoding in (
            ('IR', f'ir108-{i:02d}.png', 'png-rgba8-north-up'),
            ('GSP', f'gsp-phase-{i:02d}.bin', 'zlib-uint8-phase-id-north-up')
        ):
            obj = frame.get(key)
            require(type(obj) is dict and obj.get('file') == filename
                    and obj.get('encoding') == encoding
                    and type(obj.get('bytes')) is int and 0 < obj['bytes'] <= MAX_ASSET
                    and isinstance(obj.get('sha256'), str)
                    and HEX_SHA.fullmatch(obj['sha256']), 'invalid pair asset contract')
            require(filename not in used, 'duplicate pair asset')
            used.add(filename)
            blob = safe_file(root, filename, MAX_ASSET)
            require(len(blob) == obj['bytes']
                    and hashlib.sha256(blob).hexdigest() == obj['sha256'],
                    'private pair source hash/length mismatch')
            parts.append(blob)
        rgba = png_pixels(parts[0], width, height)
        phase = bounded_zlib(parts[1], pixels)
        valid, missing = 0, 0
        observed = Counter()
        for offset, phase_id in enumerate(phase):
            alpha = rgba[4 * offset + 3]
            require(alpha in {0, 255}, 'inconsistent native missing alpha')
            rgb = rgba[4 * offset:4 * offset + 3]
            require(rgb[0] == rgb[1] == rgb[2], 'IR is not grayscale')
            require(phase_id in PHASE.values(), 'uncontracted weather phase ID')
            if alpha == 0:
                missing += 1
                require(phase_id == PHASE['NoData'] and rgb == b'\0\0\0',
                        'missing IR pixel cannot become dry/GSP signal')
            else:
                valid += 1
            observed[phase_id] += 1
        require(valid > 0 and type(frame.get('validIrPixels')) is int
                and type(frame.get('missingIrPixels')) is int
                and valid == frame['validIrPixels']
                and missing == frame['missingIrPixels']
                and valid + missing == pixels, 'IR original NoData count was altered')
        counts = frame.get('phaseCounts')
        require(type(counts) is dict and set(counts) == set(PHASE)
                and all(type(n) is int and n >= 0 for n in counts.values())
                and all(counts[k] == observed[v] for k, v in PHASE.items()),
                'phase inventory does not match actual categorical image')
    # Reject any old or foreign frame not bound by the immutable index.
    require({item.name for item in root.iterdir()} == used | {'index.json'},
            'uncontracted files in the atomic private preview folder')
    return {'schema': 'mid.ir108-gsp.pair-readback.shadow-qa.v1',
            'run': meta['run'], 'frames': len(frames), 'validFrom': frames[0]['validTime'],
            'validTo': frames[-1]['validTime'], 'assetPairs': len(used) // 2,
            'allAssetDigestsChecked': True, 'allPixelMasksChecked': True,
            'activationAuthorized': False, 'releaseAuthorized': False}


def main() -> int:
    parser = argparse.ArgumentParser(description='Read-only private IR10.8/GSP pair integrity gate')
    parser.add_argument('--private-preview', type=Path, required=True)
    args = parser.parse_args()
    try:
        result = integrity(args.private_preview)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (PairIntegrityError, OSError, OverflowError, TypeError, KeyError) as exc:
        print(json.dumps({'schema': 'mid.ir108-gsp.pair-readback.shadow-qa.v1',
                          'status': 'REJECTED', 'activationAuthorized': False,
                          'releaseAuthorized': False, 'reason': str(exc)}, sort_keys=True))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())

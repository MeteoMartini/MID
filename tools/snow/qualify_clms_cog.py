#!/usr/bin/env python3
"""Offline bounded local FSC/GFSC GeoTIFF qualification; never release approval.

Requires locally staged, original-format CDSE GeoTIFF files and an exact public
STAC Feature. Does not access a network, credentials or provider accounts.
No local file can prove authenticated delivery, QAFLAGS semantics or production.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re

from qualify_clms_stac import BANDS, admit_item

MAX_ASSET_BYTES = 512_000_000
MAX_PIXELS = 100_000_000
MAX_BLOCK_PIXELS = 1_048_576
EPSG_UTM = frozenset(range(32625, 32639))
RESERVED_FRACTION = frozenset((205, 210, 255))
RESERVED_QUALITY = frozenset((205, 210, 255))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def read_item(path: Path) -> dict:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 1_500_000:
        raise ValueError('Local STAC Feature JSON absent or too large')
    return json.loads(path.read_bytes())


def qualify(item: dict, kind: str, directory: Path, at: datetime) -> dict:
    """Check local pixel bytes, identity, georeference and NoData without approval."""
    import numpy as np
    import rasterio
    from rasterio.warp import transform_bounds

    source = admit_item(item, kind, at)
    directory = Path(directory)
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError('Local source directory absent or symlinked')
    directory = directory.resolve(strict=True)
    bands = BANDS[kind]
    tile = re.search(r'_T(\d{2})[A-Z]{3}_', source['productId'])
    if not tile:
        raise ValueError('Original Sentinel tile zone absent')
    expected_epsg = 32600 + int(tile.group(1))
    expected = {source['productId'] + '_' + band + '.tif' for band in bands}
    if {p.name for p in directory.iterdir()} != expected:
        raise ValueError('Original CDSE product is missing a band or has extra files')

    base = None
    output = {}
    band_stats = {}
    for band in bands:
        path = directory / (source['productId'] + '_' + band + '.tif')
        if path.is_symlink() or not path.is_file() or not path.resolve(strict=True).is_relative_to(directory):
            raise ValueError('Original TIFF path escapes the authorized local directory')
        size = path.stat().st_size
        if size < 1024 or size > MAX_ASSET_BYTES:
            raise ValueError('Original TIFF asset byte budget invalid')
        file_sha = sha256_file(path)
        with rasterio.open(path, sharing=False) as raster:
            if (raster.driver != 'GTiff' or raster.count != 1 or raster.crs is None
                or raster.profile.get('tiled') is not True):
                raise ValueError('Tiled single-band georeferenced GeoTIFF required')
            epsg = raster.crs.to_epsg()
            if epsg not in EPSG_UTM or epsg != expected_epsg:
                raise ValueError('Original source does not match Sentinel tile WGS84 UTM zone')
            if raster.width <= 0 or raster.height <= 0 or raster.width * raster.height > MAX_PIXELS:
                raise ValueError('Original TIFF dimensions exceed bounded pixel budget')
            affine = raster.transform
            resolution = source['resolutionM']
            if (not math.isclose(affine.a, resolution, abs_tol=0.02)
                or not math.isclose(affine.e, -resolution, abs_tol=0.02)
                or abs(affine.b) > 1e-7 or abs(affine.d) > 1e-7):
                raise ValueError('Original UTM pixel resolution or orientation invalid')
            bounds = transform_bounds(raster.crs, 'EPSG:4326', *raster.bounds, densify_pts=21)
            area = source['bbox']
            if (not all(math.isfinite(v) for v in bounds)
                or bounds[2] <= area[0] or bounds[0] >= area[2]
                or bounds[3] <= area[1] or bounds[1] >= area[3]):
                raise ValueError('Original GeoTIFF does not overlap its STAC bbox')
            geometry = (epsg, raster.width, raster.height, tuple(affine)[:6])
            if base is not None and geometry != base:
                raise ValueError('Original fraction/quality/cloud/age raster geometry drift')
            base = geometry
            dtype = raster.dtypes[0]
            if band in (source['fractionBand'], source['qualityBand']) and dtype != 'uint8':
                raise ValueError('Original fraction/quality pixels must be UINT8')
            if band not in (source['fractionBand'], source['qualityBand']) and dtype not in ('uint8', 'uint16', 'uint32'):
                raise ValueError('Unknown QAFLAGS/CLD/AT integer raster dtype')
            stats = {'pixels': 0, 'masked': 0, 'zeros': 0}
            for _, window in raster.block_windows(1):
                if window.width * window.height > MAX_BLOCK_PIXELS:
                    raise ValueError('Original TIFF block exceeds memory budget')
                values = raster.read(1, window=window, masked=False)
                mask = raster.read_masks(1, window=window)
                stats['pixels'] += values.size
                stats['masked'] += int(np.count_nonzero(mask == 0))
                if band == source['fractionBand']:
                    unexpected = (values > 100) & ~np.isin(values, tuple(RESERVED_FRACTION)) & (mask != 0)
                    if np.any(unexpected):
                        raise ValueError('Unknown fraction code cannot be interpreted as zero')
                    stats['zeros'] += int(np.count_nonzero((values == 0) & (mask != 0)))
                elif band == source['qualityBand']:
                    unexpected = (values > 3) & ~np.isin(values, tuple(RESERVED_QUALITY)) & (mask != 0)
                    if np.any(unexpected):
                        raise ValueError('Unknown original quality code cannot be interpreted')
                # Other QA bands are SHA-verified RAW ONLY, never bit-decoded.
            if stats['pixels'] != raster.width * raster.height:
                raise ValueError('Original raster window coverage incomplete')
            output[band] = {'sha256': file_sha, 'bytes': size, 'dtype': dtype,
                            'maskedPixels': stats['masked'], 'zeroPixels': stats['zeros']}
            band_stats[band] = stats

    valid_zero = valid_fraction = unresolved_quality = 0
    with rasterio.open(directory / (source['productId'] + '_' + source['fractionBand'] + '.tif')) as fraction, \
         rasterio.open(directory / (source['productId'] + '_' + source['qualityBand'] + '.tif')) as quality:
        for _, window in fraction.block_windows(1):
            f = fraction.read(1, window=window)
            q = quality.read(1, window=window)
            fm = fraction.read_masks(1, window=window)
            qm = quality.read_masks(1, window=window)
            candidate = (fm != 0) & (qm != 0) & (f <= 100) & (q <= 3)
            valid_fraction += int(np.count_nonzero(candidate))
            valid_zero += int(np.count_nonzero(candidate & (f == 0)))
            unresolved_quality += int(np.count_nonzero((fm != 0) & (f <= 100) & ~candidate))
    return {
        'schema': 'mid.clms.local-cog-offline-qa.v1',
        'kind': kind, 'productId': source['productId'],
        'collectionId': source['collectionId'], 'datetimeUtc': source['datetimeUtc'],
        'epsg': base[0], 'width': base[1], 'height': base[2],
        'pixelResolutionM': source['resolutionM'],
        'localBandAssetDigests': output,
        'zeroPercentCandidatePixels': valid_zero,
        'fractionWithValidQualityCandidatePixels': valid_fraction,
        'fractionWithUnqualifiedQualityPixels': unresolved_quality,
        'sourceMaskedFractionPixels': band_stats[source['fractionBand']]['masked'],
        'localRasterBytesVerified': True,
        'authenticatedOriginalBytesVerified': False,
        'qaFlagsDecoded': False, 'productionApproved': False,
        'mapConsumersVerified': False, 'authorizedDeliveryVerified': False,
        'status': 'local-COG-pixel-and-geometry-verified-only; original-delivery-and-QA-bits-unverified'
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--item', type=Path, required=True, help='Locally saved official STAC Feature JSON')
    parser.add_argument('--kind', choices=('FSC', 'GFSC'), required=True)
    parser.add_argument('--directory', type=Path, required=True, help='Local TIFF assets; no network')
    args = parser.parse_args()
    print(json.dumps(qualify(read_item(args.item), args.kind, args.directory,
                             datetime.now(timezone.utc)), sort_keys=True))

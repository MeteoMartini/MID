"""Preserve native GRIB2 bitmap validity across the entire DWD ICON-D2-RUC grid.

DWD's limited-area CCSDS products include an explicit GRIB Section-6 bitmap.
ecCodes may materialize masked cells as the numeric missingValue (e.g. 9999).
Never treat that marker as meteorological data or remove grid coordinates:
one grid position remains one wire cell, with NaN -> reserved no-data code.

The bitmap, NOT the numeric value 9999 alone, is the authority for masking.
"""
from __future__ import annotations
import numpy as np
from meteo_integrity import MeteoIntegrityError


def apply_native_bitmap(values: np.ndarray, bitmap_present: int, bitmap: np.ndarray | None,
                        *, parameter: str = 'GRIB field') -> np.ndarray:
    values = np.asarray(values, dtype=np.float32)
    if values.ndim != 1 or values.size == 0:
        raise MeteoIntegrityError(f'{parameter}: invalid decoded GRIB grid shape')
    if bitmap_present == 0:
        if bitmap is not None:
            raise MeteoIntegrityError(f'{parameter}: unexpected bitmap on unmasked GRIB')
        return values
    if bitmap_present != 1:
        # An inherited Section 6 bitmap needs a separately proven preceding
        # message reference; current DWD one-message product contract excludes it.
        raise MeteoIntegrityError(f'{parameter}: unsupported GRIB bitmap indicator {bitmap_present}')
    if bitmap is None:
        raise MeteoIntegrityError(f'{parameter}: bitmap declared but absent')
    bits = np.asarray(bitmap)
    if bits.shape != values.shape or not np.all((bits == 0) | (bits == 1)):
        raise MeteoIntegrityError(f'{parameter}: bitmap length or bit values inconsistent with grid')
    out = values.copy()
    out[bits == 0] = np.nan
    return out


def decode_bitmap_values(gid):
    from eccodes import codes_get_array, codes_get_long
    bitmap_present = int(codes_get_long(gid, 'bitmapPresent'))
    values = np.asarray(codes_get_array(gid, 'values'), dtype=np.float32)
    bits = np.asarray(codes_get_array(gid, 'bitmap')) if bitmap_present == 1 else None
    return apply_native_bitmap(values, bitmap_present, bits)

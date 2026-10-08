"""Fail-closed semantic checks for DWD ICON-D2 RUC ingestion.

These broad checks are MID engineering gates, not additional DWD warning thresholds.
Validate decoded/model-native values before lossy quantization or clipping.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Mapping
import numpy as np


class MeteoIntegrityError(ValueError):
    """GRIB semantic, temporal, or physical inconsistency; never publish this run."""


def validate_grib_origin(data_date: int, data_time: int, expected_run: datetime) -> None:
    expected = expected_run.astimezone(timezone.utc)
    if int(data_date) != int(expected.strftime('%Y%m%d')) or int(data_time) != int(expected.strftime('%H%M')):
        raise MeteoIntegrityError(
            f'GRIB initialization {data_date}/{int(data_time):04d} differs from '
            f'expected RUC run {expected:%Y%m%d/%H%M}'
        )


def validate_accumulation(cube: np.ndarray, label: str, tolerance_mm: float = 0.05) -> None:
    """Accept <=0.05 mm numerical jitter; reject true backward accumulated rainfall."""
    values = np.asarray(cube)
    if values.ndim < 2 or values.shape[0] < 2:
        raise MeteoIntegrityError(f'{label}: cumulative precipitation needs >=2 times and a spatial/member axis')
    finite = np.isfinite(values)
    if not finite.any():
        raise MeteoIntegrityError(f'{label}: no finite accumulated precipitation values')
    if np.any(finite & (values < -tolerance_mm)):
        raise MeteoIntegrityError(f'{label}: negative cumulative precipitation below -{tolerance_mm} mm')
    differences = np.diff(values, axis=0)
    comparable = finite[1:] & finite[:-1]
    backwards = comparable & (differences < -tolerance_mm)
    if np.any(backwards):
        worst = float(np.min(differences[backwards]))
        raise MeteoIntegrityError(f'{label}: cumulative precipitation decreases by {worst:.3f} mm')


def validate_core_fields(fields: Mapping[str, np.ndarray]) -> None:
    """Physical and semantic validity after native unit normalization, before packing."""
    ranges = {
        'temperature_2m': (-93.15, 66.85),  # 180..340 K decoder sanity
        'dew_point_2m': (-93.15, 66.85),
        'relative_humidity_2m': (-0.5, 100.5),
        'cloud_cover': (-0.5, 100.5),
        'cloud_cover_low': (-0.5, 100.5),
        'wind_speed_10m': (-0.01, None),
        'wind_gusts_10m': (-0.01, None),
        'wind_direction_10m': (-0.01, 360.01),
        'precipitation': (-0.05, None),
        'cape': (-1.0, None),
    }
    for name, (lower, upper) in ranges.items():
        if name not in fields:
            raise MeteoIntegrityError(f'{name}: missing required RUC field')
        arr = np.asarray(fields[name])
        finite = np.isfinite(arr)
        if arr.ndim != 2 or not finite.any():
            raise MeteoIntegrityError(f'{name}: invalid shape or no finite model values')
        valid = arr[finite]
        if np.any(valid < lower) or (upper is not None and np.any(valid > upper)):
            raise MeteoIntegrityError(f'{name}: decoded values exceed physical/semantic bounds')
    temperature = np.asarray(fields['temperature_2m'])
    dew = np.asarray(fields['dew_point_2m'])
    if temperature.shape != dew.shape:
        raise MeteoIntegrityError('temperature/dew point: different grid/time dimensions')
    comparable = np.isfinite(temperature) & np.isfinite(dew)
    if np.any(comparable & (dew > temperature + 0.5)):
        raise MeteoIntegrityError('dew point exceeds air temperature by more than 0.5 K')

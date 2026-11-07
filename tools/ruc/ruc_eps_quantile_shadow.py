#!/usr/bin/env python3
"""Read-only NumPy EPS20 quantile shadow for MID RUC P3.

This module is NOT imported by the live RUC producer. It does not change
weather values, NoData, output bytes, publishing or the existing quantile code.
"""
from __future__ import annotations

import numpy as np

QUARTILES = (0.25, 0.50, 0.75)
EXPECTED_EPS_MEMBERS = 20


def shadow_eps20_quartiles(interval: np.ndarray) -> np.ndarray:
    """Calculate H&F type-7 linear 25/50/75% over the 20-member axis.

    The NumPy version currently used for the MID baseline computes these with
    nanquantile(method='linear'). This candidate sorts at most 20 members
    in native NumPy and uses the same symmetric linear interpolation branch.
    Unavailable members remain NaN, never fabricated as dry zero.
    Returns [3, valid_times, native_points] float64; no source mutation.
    """
    arr = np.asarray(interval)
    if arr.ndim != 3 or arr.shape[0] < 1 or arr.shape[1] != EXPECTED_EPS_MEMBERS or arr.shape[2] < 1:
        raise ValueError('Shadow EPS20 requires [time,20,native-points] data')
    if arr.dtype != np.dtype('float64'):
        raise ValueError('Shadow EPS20 requires exact float64 original member values')
    arr = np.asarray(arr)
    valid = np.isfinite(arr)
    counts = np.count_nonzero(valid, axis=1)
    ordered = np.sort(np.where(valid, arr, np.nan), axis=1)
    result = []
    for quantile in QUARTILES:
        position = np.maximum(counts - 1, 0) * quantile
        lower_index = np.floor(position).astype(np.intp)
        upper_index = np.ceil(position).astype(np.intp)
        lower = np.take_along_axis(ordered, lower_index[:, None, :], axis=1)[:, 0, :]
        upper = np.take_along_axis(ordered, upper_index[:, None, :], axis=1)[:, 0, :]
        fraction = position - lower_index
        difference = upper - lower
        interpolated = np.where(fraction >= 0.5,
                                upper - difference * (1.0 - fraction),
                                lower + difference * fraction)
        result.append(np.where(counts > 0, interpolated, np.nan))
    return np.stack(result, axis=0)

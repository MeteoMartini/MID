#!/usr/bin/env python3
"""Candidate-only EPS20 linear quantiles for MID RUC P3 A/B qualification.

Never imported by production RUC decoding or enabled by any workflow.
Use with separately checked SHA-identical native GRIB/EPS20 inputs; the output of
this experimental function does not authorize an optimized RUC build.

Input dimension: [valid_time, ensemble_member, native_grid_point]. Missing
EPS member values are NaN, never physical zero. Nonfinite values are excluded
as in MID's current eps_summary (np.where(np.isfinite(...), ..., np.nan)).
"""
from __future__ import annotations

import numpy as np

QUANTILES = (0.25, 0.5, 0.75)


def candidate_eps_linear_quantiles(values, *, quantiles=QUANTILES):
    """Return [quantile, time, point] with NumPy 2.x 'linear' quantile order.

    A single sorted member axis amortizes the expensive per-point NaN filtering
    of np.nanquantile; shape is bounded by caller (4096-point EPS production
    chunks). All missing slices remain NaN; no unit, clipping or smoothing.
    """
    source = np.asarray(values, dtype=np.float64)
    if source.ndim != 3 or not all(isinstance(s, int) and s > 0 for s in source.shape):
        raise ValueError('expected nonempty [time, member, point] EPS cube')
    if source.shape[1] > 20 or source.shape[2] > 4096 or source.shape[0] > 28:
        raise ValueError('oversized or unexpected EPS shadow chunk')
    if len(quantiles) != 3 or tuple(quantiles) != QUANTILES:
        raise ValueError('only canonical EPS P25/P50/P75 quantiles permitted')

    valid = np.isfinite(source)
    ordered = np.sort(np.where(valid, source, np.nan), axis=1)
    counts = valid.sum(axis=1)  # [time,point]
    available = counts > 0
    result = []
    for q in QUANTILES:
        virtual = np.maximum(counts - 1, 0) * q
        left = np.floor(virtual).astype(np.intp)
        right = np.ceil(virtual).astype(np.intp)
        lo = np.take_along_axis(ordered, left[:, None, :], axis=1)[:, 0, :]
        hi = np.take_along_axis(ordered, right[:, None, :], axis=1)[:, 0, :]
        fraction = virtual - left
        # NumPy 2.x quantile internally uses the numerically stable right-side
        # equivalent when the fractional index is >= 0.5. Avoid a different
        # rounding path near the final 0.01 mm quantization boundaries.
        with np.errstate(invalid='ignore', over='ignore'):
            interpolated = np.where(fraction >= 0.5,
                                    hi - (hi - lo) * (1 - fraction),
                                    lo + (hi - lo) * fraction)
        result.append(np.where(available, interpolated, np.nan))
    return np.stack(result, axis=0)


def reference_eps_linear_quantiles(values):
    """The unchanged, slower MID production reference (for tests/shadow only)."""
    source = np.asarray(values, dtype=np.float64)
    with np.errstate(invalid='ignore'):
        return np.nanquantile(np.where(np.isfinite(source), source, np.nan),
                              QUANTILES, axis=1, method='linear')

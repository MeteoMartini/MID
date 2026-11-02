#!/usr/bin/env python3
"""Read-only, cell-level SHA-inventory companion for DWD ICON-D2 TOT_PREC packing.

Does NOT adjust, clip or authorize precipitation. Every input field must already
have passed independent original-source SHA, WMO, grid and bitmap gates.
"""
from __future__ import annotations

import math
import numpy as np


def packing_quantum(meta):
    """Decoded GRIB2 integer-packing quantum (kg/m² = mm), also for CCSDS."""
    if (not isinstance(meta, dict)
            or meta.get("packingType") not in ("grid_simple", "grid_ccsds")
            or type(meta.get("binaryScaleFactor")) is not int
            or type(meta.get("decimalScaleFactor")) is not int):
        return None
    e, d = meta["binaryScaleFactor"], meta["decimalScaleFactor"]
    if not (-100 <= e <= 100 and -30 <= d <= 30):
        return None
    q = 2.0 ** e * 10.0 ** (-d)
    return q if math.isfinite(q) and 0.0 < q < 10000.0 else None


def assess_original_packing(previous, current, previous_meta, current_meta, *,
                            lead, latitudes=None, longitudes=None):
    """Quantify *possible* precision-caused negative deltas, without repairs.

    For a rounded cumulative value at each native cell, each original real
    cumulative value can lie within +/- half the GRIB decoded quantum. An
    observed negative cumulative difference may therefore be rounding-
    compatible ONLY if its magnitude is at most half the sum of the two
    quantums. This necessary criterion is NOT proof of the true accumulation.
    """
    prev = np.asarray(previous, dtype=np.float64)
    curr = np.asarray(current, dtype=np.float64)
    if prev.ndim != 1 or curr.shape != prev.shape or prev.size < 2:
        raise ValueError("Native original TOT_PREC paired geometry invalid")
    if np.isinf(prev).any() or np.isinf(curr).any():
        raise ValueError("Original TOT_PREC includes Infinity")
    if type(lead) is not int or lead < 1:
        raise ValueError("Original TOT_PREC forecast lead invalid")
    if latitudes is not None and (np.asarray(latitudes).shape != prev.shape
                                   or not np.isfinite(latitudes).all()):
        raise ValueError("Original TOT_PREC latitude geometry drift")
    if longitudes is not None and (np.asarray(longitudes).shape != prev.shape
                                    or not np.isfinite(longitudes).all()):
        raise ValueError("Original TOT_PREC longitude geometry drift")

    valid_prev, valid_curr = np.isfinite(prev), np.isfinite(curr)
    both = valid_prev & valid_curr
    delta = curr - prev
    negative = both & (delta < 0)
    indices = np.flatnonzero(negative)
    qp, qc = packing_quantum(previous_meta), packing_quantum(current_meta)

    def exact(meta, end):
        return (isinstance(meta, dict)
                and meta.get("stepType") == "accum"
                and meta.get("startStep") == 0
                and meta.get("endStep") == end
                and meta.get("bitmapPresent") == 1
                and meta.get("numberOfPoints") == int(prev.size)
                and meta.get("bitsPerValue") == 16
                and meta.get("referenceValue") == 0.0)

    metadata_consistent = (exact(previous_meta, lead - 1)
                           and exact(current_meta, lead)
                           and qp is not None and qc is not None
                           and qc >= qp
                           and previous_meta["packingType"] == current_meta["packingType"]
                           and previous_meta["decimalScaleFactor"] == current_meta["decimalScaleFactor"])
    allowance = (qp + qc) / 2 if metadata_consistent else None
    # Small floating-point tolerance affects only evidence labelling, never data.
    within = ((-delta[indices] <= allowance + 1e-12)
              if allowance is not None else np.zeros(indices.size, dtype=bool))
    examples = []
    for index in indices[:8]:
        item = {"nativeIndex": int(index), "previousMm": float(prev[index]),
                "currentMm": float(curr[index]), "deltaMm": float(delta[index])}
        if latitudes is not None and longitudes is not None:
            item["lat"] = round(float(latitudes[index]), 6)
            item["lon"] = round(float(longitudes[index]), 6)
        examples.append(item)
    return {
        "schema": "mid.d2.tot-prec-quantization-evidence.v1",
        "productionApproved": False,
        "negativeCells": int(indices.size),
        "negativeMinMm": float(delta[indices].min()) if indices.size else None,
        "negativeMaxMm": float(delta[indices].max()) if indices.size else None,
        "nativePoints": int(prev.size),
        "commonValidCells": int(np.count_nonzero(both)),
        "bitmapDisagreementCells": int(np.count_nonzero(valid_prev ^ valid_curr)),
        "previousQuantumMm": qp, "currentQuantumMm": qc,
        "necessaryRoundingAllowanceMm": allowance,
        "wmoPackingMetadataConsistent": bool(metadata_consistent),
        "negativeCellsCompatibleWithPacking": int(np.count_nonzero(within)),
        "negativeCellsNotExplainedByPacking": int(indices.size - np.count_nonzero(within)),
        "allNegativeCellsRoundingCompatible": bool(
            indices.size and metadata_consistent
            and not np.any(valid_prev ^ valid_curr) and np.all(within)),
        "samples": examples,
        "note": "Read-only necessary rounding bound; source physics and actual true 1h accumulation unproven. No masking, clipping or publication."
    }

"""QA-only: bounded EPS20 regional extreme summaries, no production activation.

Same 0–6 / 6–12 / 12–14 h DWD native UTC windows, member thresholds,
missing-data masks and quantiles as the published MID builder.  Production
`rapid_extreme_eps_period_summary` must remain unchanged; full DWD native
output/RSS verification is required before any activation.
"""
from __future__ import annotations
from datetime import datetime, timezone
import numpy as np


def candidate_eps_period_summary(interval, eps_times, run, chunk_points=4096):
    arr = np.asarray(interval, dtype=np.float64)
    if arr.ndim != 3:
        return {}
    if not isinstance(chunk_points, int) or isinstance(chunk_points, bool) or chunk_points < 1:
        raise ValueError('P3 EPS regional chunk_points must be a positive integer')
    base = datetime.fromisoformat(run.replace('Z', '+00:00')).astimezone(timezone.utc)
    leads = [(value - base).total_seconds() / 3600 for value in eps_times]
    periods = [('0-6', 0, 6), ('6-12', 6, 12), ('12-14', 12, 14)]
    one_hour_thresholds = (15., 25., 40., 60.)
    six_hour_thresholds = (20., 35., 60., 90.)
    out = {}
    for pid, start, end in periods:
        indices = [i for i, lead in enumerate(leads)
                   if lead > start + 1e-6 and lead <= end + 1e-6]
        if not indices:
            continue
        contiguous = all(b == a + 1 for a, b in zip(indices, indices[1:]))
        point_count = arr.shape[2]
        # Outputs remain exactly the original float64 dtype; only the temporary
        # member/time workload is bounded to per-point chunks.
        row = {
            'memberCount': np.empty(point_count, dtype=np.float64),
            'wetProbabilityPct': np.empty(point_count, dtype=np.float64),
            'significantProbabilityPct': np.empty(point_count, dtype=np.float64),
            'max1hQ75Mm': np.empty(point_count, dtype=np.float64),
            'totalQ75Mm': np.empty(point_count, dtype=np.float64),
            'rain1hProbabilityPct': np.empty((4, point_count), dtype=np.float64),
            'coverageHours': float(min(end, 14) - start),
        }
        has_six_hour = end - start >= 5.9 and len(indices) >= 6
        if has_six_hour:
            row['rain6hProbabilityPct'] = np.empty((4, point_count), dtype=np.float64)
        for left in range(0, point_count, chunk_points):
            right = min(left + chunk_points, point_count)
            # A slice shares original bytes for contiguous UTC indices.  For
            # gaps use np.take on a point-sliced block: never silently fill an
            # absent DWD hour and never copy the whole native grid.
            point_block = arr[:, :, left:right]
            cube = (point_block[indices[0]:indices[-1] + 1]
                    if contiguous else np.take(point_block, indices, axis=0))
            max1 = np.nanmax(cube, axis=0)
            total = np.sum(cube, axis=0)
            valid = np.isfinite(total)
            max1 = np.where(valid, max1, np.nan)
            count = np.sum(valid, axis=0)
            denominator = np.maximum(count, 1)

            def probability(values, threshold):
                return np.where(count > 0,
                                100 * np.sum(np.isfinite(values) & (values > threshold), axis=0) / denominator,
                                np.nan)

            with np.errstate(invalid='ignore'):
                max1_q75 = np.nanquantile(max1, .75, axis=0)
                total_q75 = np.nanquantile(total, .75, axis=0)
            row['memberCount'][left:right] = count.astype(np.float64)
            row['wetProbabilityPct'][left:right] = probability(total, .2)
            row['significantProbabilityPct'][left:right] = probability(total, 5.)
            row['max1hQ75Mm'][left:right] = max1_q75
            row['totalQ75Mm'][left:right] = total_q75
            row['rain1hProbabilityPct'][:, left:right] = np.stack(
                [probability(max1, t) for t in one_hour_thresholds], axis=0)
            if has_six_hour:
                row['rain6hProbabilityPct'][:, left:right] = np.stack(
                    [probability(total, t) for t in six_hour_thresholds], axis=0)
        out[pid] = row
    return out

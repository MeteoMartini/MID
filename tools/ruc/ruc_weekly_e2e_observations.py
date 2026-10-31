#!/usr/bin/env python3
"""Interpret seven days of *observed* Pages/Worker RUC readbacks, without SLO claims.

Public pointers cannot prove a DWD first-publication timestamp or actual app
adoption. A collection of repeated samples for one run is never counted as
multiple independent model runs. All missing stages remain explicitly unknown.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import json
import math
from pathlib import Path

from ruc_freshness_shadow_gate import model_time, utc


def nearest_rank(values, fraction):
    if not values:
        return None
    if not 0 < fraction <= 1:
        raise ValueError('invalid quantile')
    return round(sorted(values)[math.ceil(fraction * len(values)) - 1], 3)


def summarize(samples, *, min_hours=168):
    if type(min_hours) is not int or min_hours < 168:
        raise ValueError('seven day evidence floor cannot be weakened')
    raw = []
    for sample in samples:
        if not isinstance(sample, dict):
            raise ValueError('observation row is not an object')
        seen = utc(sample['observedAtUtc'])
        if not all(sample.get(k) is True for k in ('pagesValid', 'workerValid', 'sameRun')):
            raw.append((seen, None))
            continue
        run_id = sample.get('pagesRun')
        if run_id != sample.get('workerRun'):
            raise ValueError('published run mismatch inside verified observation')
        run = model_time(run_id)
        if seen < run:
            raise ValueError('observed a future run')
        raw.append((seen, run))
    if len({when for when, _ in raw}) != len(raw):
        raise ValueError('duplicate observation timestamps are ambiguous')
    raw.sort(key=lambda record: record[0])
    first_seen = {}
    for when, run in raw:
        if run is not None:
            first_seen.setdefault(run, when)
    # The observed upper bound includes scheduling, DWD delay, processing,
    # upload and readback. It is NOT an exact publish time or consumer refresh.
    upper_bounds = [(when - run).total_seconds() / 60 for run, when in first_seen.items()]
    runs = sorted(first_seen)
    contiguous = len(runs) >= min_hours and all(
        newer - older == timedelta(hours=1)
        for older, newer in zip(runs, runs[1:])
    )
    total_period = ((raw[-1][0] - raw[0][0]).total_seconds() / 3600) if len(raw) > 1 else 0
    return {
        'schema': 'mid.ruc.weekly-readback-observation.v1',
        'samples': len(raw),
        'invalidOrUnknownSamples': sum(run is None for _, run in raw),
        'independentlyObservedRuns': len(runs),
        'observationSpanHours': round(total_period, 3),
        'completeSevenDayHourlyRuns': bool(contiguous and total_period >= 167),
        'firstObservedRunAgeMinutes': {
            'p50': nearest_rank(upper_bounds, .5),
            'p90': nearest_rank(upper_bounds, .9),
            'p95': nearest_rank(upper_bounds, .95),
        },
        'actualDwdPublicationTimeVerified': False,
        'appAdoptionVerified': False,
        'productionSloAuthorized': False,
        'reason': 'public metadata observations are only upper visibility bounds; no independently authenticated client/adoption evidence',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('reports', nargs='+', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        parser.error('output exists: refuse overwrite')
    samples = [json.loads(p.read_text(encoding='utf-8')) for p in args.reports]
    args.output.write_text(json.dumps(summarize(samples), ensure_ascii=False,
                                      sort_keys=True, allow_nan=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

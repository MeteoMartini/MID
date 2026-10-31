#!/usr/bin/env python3
"""Seven-day upper-bound sampler summary; never infer actual GRIB/EPS publication.

Completeness of the DWD HTML file index is not completeness of model values.
Percentiles use nearest-rank on first positive observation and are labelled as
sampled upper bounds. Missing or failed observations remain missing, not zero.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import math

STAGES = ('firstAdvertisedField', '0-6h', '0-14h', '0-27h', 'epsMembers20')
SCHEMA = 'mid.ruc.dwd-directory-observation.v1'


def utc(value: str) -> datetime:
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError('noncanonical UTC timestamp')
    parsed = datetime.fromisoformat(value[:-1] + '+00:00')
    if parsed.utcoffset() != timedelta():
        raise ValueError('non-UTC timestamp')
    return parsed


def nearest_rank(values: list[float], proportion: float) -> float | None:
    if not values:
        return None
    if not 0 < proportion <= 1 or any(not math.isfinite(x) or x < 0 for x in values):
        raise ValueError('invalid quantile input')
    ordered = sorted(values)
    return round(ordered[max(0, math.ceil(proportion * len(ordered)) - 1)], 3)


def stage_value(row: dict, name: str) -> bool | None:
    if name == 'firstAdvertisedField':
        value = row.get(name)
    elif name == 'epsMembers20':
        eps = row.get('eps', {})
        value = eps.get('membersComplete') if eps.get('headerVerified') is True else None
    else:
        value = row.get('stages', {}).get(name, {}).get('directoryComplete')
    return value if type(value) is bool else None


def summarize(rows: list[dict], *, ending_at: datetime | None = None) -> dict:
    if not rows:
        raise ValueError('no observations')
    now = ending_at or max(utc(row['observedAtUtc']) for row in rows)
    if now.tzinfo is None or now.utcoffset() != timedelta():
        raise ValueError('ending_at must be UTC')
    end_run = now.replace(minute=0, second=0, microsecond=0)
    start_run = end_run - timedelta(hours=167)
    by_run = defaultdict(list)
    for row in rows:
        if row.get('schema') != SCHEMA or not isinstance(row.get('run'), str):
            raise ValueError('untrusted observation schema/run')
        run = datetime.strptime(row['run'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        if run.strftime('%Y-%m-%dT%H:%M') != row['run']:
            raise ValueError('noncanonical run')
        when = utc(row['observedAtUtc'])
        if when < run:
            raise ValueError('observation precedes run')
        if start_run <= run <= end_run and when <= now:
            by_run[run].append((when, row))
    metrics = {}
    for stage in STAGES:
        observed, unseen, unknown = [], [], []
        brackets = 0
        for hour in range(168):
            run = start_run + timedelta(hours=hour)
            snapshots = sorted(by_run.get(run, []), key=lambda item: item[0])
            first_seen = next((i for i, (when, row) in enumerate(snapshots)
                               if stage_value(row, stage) is True), None)
            if first_seen is not None:
                upper = (snapshots[first_seen][0] - run).total_seconds() / 60
                if upper < 0:
                    raise ValueError('negative observation latency')
                observed.append(upper)
                if any(stage_value(row, stage) is False for _, row in snapshots[:first_seen]):
                    brackets += 1
            elif any(stage_value(row, stage) is False for _, row in snapshots):
                unseen.append(run.strftime('%Y-%m-%dT%H:%M'))
            else:
                unknown.append(run.strftime('%Y-%m-%dT%H:%M'))
        metrics[stage] = {
            'observedRunCount': len(observed),
            'observedWithEarlierNegativeSample': brackets,
            'notYetAdvertisedRunCount': len(unseen),
            'unknownOrUnobservedRunCount': len(unknown),
            'firstSeenUpperBoundMinutes': {
                'p50': nearest_rank(observed, .50),
                'p90': nearest_rank(observed, .90),
                'p95': nearest_rank(observed, .95),
            },
            'sevenDayComplete': len(observed) == 168 and len(unknown) == 0,
            'publicationDelayVerified': False,
        }
    return {
        'schema': 'mid.ruc.dwd-directory-summary.v1',
        'windowStartRunUtc': start_run.strftime('%Y-%m-%dT%H:%MZ'),
        'windowEndRunUtc': end_run.strftime('%Y-%m-%dT%H:%MZ'),
        'runSlots': 168,
        'statsMeaning': 'nearest-rank first-sampled directory listing upper bounds, NOT actual publication delays',
        'epsHeaderAndValuesUnverified': True,
        'sloVerified': False,
        'stages': metrics,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', nargs='+', type=Path, help='saved JSONL observation artifacts')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    rows = []
    for file in args.inputs:
        for line in file.read_text(encoding='utf-8').splitlines():
            if line.strip():
                rows.append(json.loads(line))
    report = summarize(rows)
    encoded = json.dumps(report, ensure_ascii=False, allow_nan=False, indent=2) + '\n'
    if args.output:
        if args.output.exists():
            parser.error('will not overwrite existing report')
        args.output.write_text(encoded, encoding='utf-8')
    else:
        print(encoded, end='')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Censored P1 DWD listing and P5 public readback evidence; strictly read-only.

Input samples originate in the existing MID observer and readback. They cannot
authenticate original DWD GRIB/EPS values, DWD publication time, or a real app
client. This module never authorizes fast publication or a 60-minute SLO.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime, timedelta
import json
import math
from pathlib import Path

from dwd_availability_report import SCHEMA as DIRECTORY_SCHEMA, STAGES, stage_value
from ruc_freshness_shadow_gate import model_time, utc

READBACK_SCHEMA = 'mid.ruc.e2e-readback-shadow.v1'
REPORT_SCHEMA = 'mid.ruc.p1p5-observation-censor.v1'
WINDOW_HOURS = 168


def quantile(values: list[float], portion: float) -> float | None:
    if not values:
        return None
    if not (0 < portion <= 1) or any(not math.isfinite(x) for x in values):
        raise ValueError('nonfinite or invalid percentile observations')
    ordered = sorted(values)
    return round(ordered[math.ceil(len(ordered) * portion) - 1], 3)


def percentile_set(values: list[float]) -> dict:
    return {'p50': quantile(values, .5), 'p90': quantile(values, .9),
            'p95': quantile(values, .95)}


def analyze(directory_rows: list[dict], readbacks: list[dict], *,
            ending_at_utc: str, expected_poll_minutes: int = 15) -> dict:
    if type(expected_poll_minutes) is not int or not 1 <= expected_poll_minutes <= 60:
        raise ValueError('expected polling interval must be 1..60 minutes')
    end = utc(ending_at_utc)
    end_run = end.replace(minute=0, second=0, microsecond=0)
    start_run = end_run - timedelta(hours=WINDOW_HOURS - 1)
    directories = defaultdict(list)
    used_directory_keys = set()

    for row in directory_rows:
        if not isinstance(row, dict) or row.get('schema') != DIRECTORY_SCHEMA:
            raise ValueError('untrusted DWD directory observation')
        run = model_time(row.get('run'))
        seen = utc(row.get('observedAtUtc'))
        if seen < run:
            raise ValueError('directory observation predates run')
        key = (run, seen)
        if key in used_directory_keys:
            raise ValueError('duplicate DWD polling event')
        used_directory_keys.add(key)
        if start_run <= run <= end_run and seen <= end:
            directories[run].append((seen, row))

    stages = {}
    first_directory_positive = {}
    for stage in STAGES:
        interval, left, right, unobserved = 0, 0, 0, 0
        unknown_samples, late_poll_gaps = 0, 0
        upper_minutes, lower_minutes, interval_widths = [], [], []
        max_poll_gap = None
        for hour in range(WINDOW_HOURS):
            run = start_run + timedelta(hours=hour)
            samples = sorted(directories.get(run, []), key=lambda pair: pair[0])
            states = [stage_value(row, stage) for _, row in samples]
            unknown_samples += sum(value is None for value in states)
            for (before, _), (after, _) in zip(samples, samples[1:]):
                gap = (after - before).total_seconds() / 60
                max_poll_gap = max(max_poll_gap or 0, gap)
                if gap > 2 * expected_poll_minutes:
                    late_poll_gaps += 1
            first = next((index for index, value in enumerate(states) if value is True), None)
            if first is not None:
                if any(value is False for value in states[first + 1:]):
                    raise ValueError('contradictory DWD availability after first positive')
                seen = samples[first][0]
                first_directory_positive.setdefault(stage, {})[run] = seen
                upper = (seen - run).total_seconds() / 60
                if upper < 0:
                    raise ValueError('negative availability bound')
                upper_minutes.append(upper)
                negatives = [when for (when, _), value in zip(samples[:first], states[:first])
                             if value is False]
                if negatives:
                    lower = (max(negatives) - run).total_seconds() / 60
                    lower_minutes.append(lower)
                    interval_widths.append(upper - lower)
                    interval += 1
                else:
                    left += 1
            elif any(value is False for value in states):
                right += 1
            else:
                unobserved += 1

        positives = len(upper_minutes)
        stages[stage] = {
            'intervalCensoredRunSlots': interval,
            'leftCensoredRunSlots': left,
            'rightCensoredRunSlots': right,
            'unobservedOrUnknownRunSlots': unobserved,
            'unknownPollSamples': unknown_samples,
            'latePollGapsOver2xCadence': late_poll_gaps,
            'maxWithinRunPollGapMinutes': round(max_poll_gap, 3)
            if max_poll_gap is not None else None,
            'firstSeenUpperBoundMinutes': percentile_set(upper_minutes),
            'lastNegativeLowerBoundMinutes': percentile_set(lower_minutes),
            'intervalBracketWidthMinutes': percentile_set(interval_widths),
            'advertisedInAll168Runs': positives == WINDOW_HOURS,
            'nativeGribAndEpsValuesVerified': False,
            'actualPublicationTimeVerified': False,
        }

    first_readback = {}
    seen_readback_times = set()
    invalid_readbacks = 0
    for row in readbacks:
        if not isinstance(row, dict) or row.get('schema') != READBACK_SCHEMA:
            raise ValueError('untrusted Pages/Worker readback')
        seen = utc(row.get('observedAtUtc'))
        if seen in seen_readback_times:
            raise ValueError('duplicate public readback poll timestamp')
        seen_readback_times.add(seen)
        if seen > end:
            continue
        if not all(row.get(k) is True for k in ('pagesValid', 'workerValid', 'sameRun')):
            invalid_readbacks += 1
            continue
        if row.get('pagesRun') != row.get('workerRun'):
            raise ValueError('contradictory verified public run')
        run = model_time(row.get('pagesRun'))
        if run > seen:
            raise ValueError('public readback precedes model initialization')
        if start_run <= run <= end_run:
            first_readback[run] = min(seen, first_readback.get(run, seen))

    ages = [(seen - run).total_seconds() / 60 for run, seen in first_readback.items()]
    visible_run_count = len(first_readback)
    # Both observations are sampled upper bounds, not actual upstream-to-MID
    # latency. Signed differences are valid when polls have different cadence.
    pairs = [(first_readback[run] - seen).total_seconds() / 60
             for run, seen in first_directory_positive.get('0-6h', {}).items()
             if run in first_readback]
    return {
        'schema': REPORT_SCHEMA,
        'windowStartRunUtc': start_run.isoformat().replace('+00:00', 'Z'),
        'windowEndRunUtc': end_run.isoformat().replace('+00:00', 'Z'),
        'windowRunSlots': WINDOW_HOURS,
        'pollCadenceMinutesExpectedNotGuaranteed': expected_poll_minutes,
        'directory': stages,
        'publicPagesWorker': {
            'firstReadbackRunSlots': visible_run_count,
            'unobservedRunSlots': WINDOW_HOURS - visible_run_count,
            'invalidOrUnknownReadbackSamples': invalid_readbacks,
            'firstObservedRunAgeUpperBoundMinutes': percentile_set(ages),
            'paired0to6DirectoryVsPublicObservationCount': len(pairs),
            'pairedPublicMinusDirectoryFirstSeenMinutes': percentile_set(pairs),
            'all168HourlyRunsVisible': visible_run_count == WINDOW_HOURS,
            'clientAdoptionAuthenticated': False,
        },
        'classification': {
            'directoryOnlyNotGribProof': True,
            'dwdFirstPublicationInstantVerified': False,
            'nativeEps20GribValuesVerified': False,
            'liveClientOrWidgetOrExportRefreshVerified': False,
            'sixtyMinuteProductionP95Authorized': False,
            'productionPointerMutation': False,
        },
    }


def _read_jsonl(paths: list[Path]) -> list[dict]:
    rows = []
    for path in paths:
        for line in path.read_text(encoding='utf-8').splitlines():
            if line.strip():
                rows.append(json.loads(line))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', nargs='+', required=True, type=Path)
    parser.add_argument('--readbacks', nargs='*', default=[], type=Path)
    parser.add_argument('--ending-at-utc', required=True, help='UTC ISO8601 Z')
    parser.add_argument('--poll-minutes', type=int, default=15)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = analyze(_read_jsonl(args.directory), _read_jsonl(args.readbacks),
                     ending_at_utc=args.ending_at_utc,
                     expected_poll_minutes=args.poll_minutes)
    # Exclusive creation prevents accidental overwrite of live evidence.
    with args.output.open('x', encoding='utf-8') as output:
        json.dump(result, output, ensure_ascii=False, allow_nan=False, indent=2,
                  sort_keys=True)
        output.write('\n')
    print('MID read-only censored P1/P5 evidence created; NO GRIB or SLO authorization')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

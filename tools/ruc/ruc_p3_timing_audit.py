#!/usr/bin/env python3
"""Read-only P3 timing evidence checker; wall/step gaps are not decoder costs.

Uses the published mid.ruc.workflow-timings.v1 GitHub artifacts only.
This is descriptive telemetry, NOT a same-input A/B benchmark.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

SCHEMA = 'mid.ruc.workflow-timings.v1'
OUT_SCHEMA = 'mid.ruc.p3-timing-audit.v1'


def duration(value):
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
        raise ValueError('invalid elapsedSeconds')
    return float(value)


def summarize(reports: list[dict]) -> dict:
    seen = set()
    entries = []
    for report in reports:
        if not isinstance(report, dict) or report.get('schema') != SCHEMA:
            raise ValueError('untrusted workflow timing artifact')
        run_id = report.get('runId')
        if type(run_id) is not int or run_id <= 0 or run_id in seen:
            raise ValueError('invalid or duplicate workflow runId')
        seen.add(run_id)
        jobs = report.get('jobs')
        if not isinstance(jobs, list) or not jobs:
            raise ValueError('missing jobs in timing artifact')
        output = {'runId': run_id, 'jobs': {}, 'unaccountedJobSeconds': 0.0,
                  'timingGapOver60Seconds': False}
        job_names = set()
        for job in jobs:
            if not isinstance(job, dict) or not isinstance(job.get('name'), str):
                raise ValueError('invalid job')
            name = job['name']
            if name in job_names:
                raise ValueError('duplicated job')
            job_names.add(name)
            if job.get('conclusion') == 'skipped':
                continue
            if job.get('conclusion') != 'success':
                raise ValueError('non-success job must not enter timing benchmark')
            wall = duration(job.get('elapsedSeconds'))
            steps = job.get('steps')
            if not isinstance(steps, list) or not steps:
                raise ValueError('missing job steps')
            seen_numbers = set()
            step_seconds = 0.0
            core_seconds = None
            named_steps = {}
            for step in steps:
                if not isinstance(step, dict) or type(step.get('number')) is not int:
                    raise ValueError('invalid step record')
                if step['number'] in seen_numbers:
                    raise ValueError('duplicate step in one job')
                seen_numbers.add(step['number'])
                elapsed = duration(step.get('elapsedSeconds'))
                step_seconds += elapsed
                title = step.get('name')
                if not isinstance(title, str):
                    raise ValueError('invalid step name')
                if 'Neuesten vollständigen RUC/RUC-EPS-Lauf laden und dekodieren' in title:
                    if core_seconds is not None:
                        raise ValueError('duplicate combined DWD download/decode step')
                    core_seconds = elapsed
                if elapsed >= 30:
                    named_steps[title] = elapsed
            # GitHub times are rounded to whole seconds, so tolerate 5s.
            gap = wall - step_seconds
            if gap < -5:
                raise ValueError('sum of steps exceeds reported job time')
            unaccounted = max(0.0, gap)
            if unaccounted > 60:
                output['timingGapOver60Seconds'] = True
            output['unaccountedJobSeconds'] += unaccounted
            output['jobs'][name] = {
                'jobWallSeconds': round(wall, 3),
                'reportedStepTotalSeconds': round(step_seconds, 3),
                'unaccountedSeconds': round(unaccounted, 3),
                'combinedCoreDownloadDecodeSeconds': core_seconds,
                'stepsAtLeast30Seconds': named_steps,
            }
        if not output['jobs']:
            raise ValueError('all jobs skipped')
        output['unaccountedJobSeconds'] = round(output['unaccountedJobSeconds'], 3)
        entries.append(output)

    return {
        'schema': OUT_SCHEMA,
        'runCount': len(entries),
        'runs': sorted(entries, key=lambda x: x['runId']),
        'publishedTimingArtifactsOnly': True,
        'splitDownloadVsDecodeMeasured': False,
        'sameRawGribShaInputsVerified': False,
        'matchedABSpeedupAuthorized': False,
        'cpuRamAndPeak900MBBudgetMeasuredHere': False,
        'liveClientFreshnessSloVerified': False,
        'interpretation': ('wall-minus-step gap is unattributed runner/telemetry time; '
                           'not observed decoder, network, DWD, or provider delay'),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reports', nargs='+', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    reports = [json.loads(path.read_text(encoding='utf-8')) for path in args.reports]
    report = summarize(reports)
    with args.output.open('x', encoding='utf-8') as file:
        json.dump(report, file, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False)
        file.write('\n')
    print('MID RUC P3 read-only timing accounting; no A/B speedup or SLO authorization')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

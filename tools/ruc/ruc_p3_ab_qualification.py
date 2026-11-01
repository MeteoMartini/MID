#!/usr/bin/env python3
"""Read-only, fail-closed RUC P3 paired A/B qualification; NEVER authorizes release.

Input receipts are externally supplied, *untrusted claims*. Pairing only compares
identical run/input/contract/output identities; independent attestation and full
MID publisher gates remain mandatory. No network or production side effects.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import re
from pathlib import Path

SHA = re.compile(r'^[a-f0-9]{64}$')
STAGES = ('download', 'decode', 'seal', 'prepare')
REQUIRED = ('gribHeaders', 'nativeGrid', 'bitmapNoData', 'unitsAndTimes',
            'deterministic27h', 'eps20', 'atomicSnapshot', 'decoderParity')
BUDGET = 900_000_000


def _sha(value):
    return type(value) is str and SHA.fullmatch(value) is not None


def _utc(value):
    if type(value) is not str or not value.endswith('Z'):
        raise ValueError('run must be a UTC RFC3339 timestamp ending Z')
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ValueError('invalid UTC run') from exc
    if parsed.utcoffset() != timedelta(0) or parsed.second or parsed.microsecond:
        raise ValueError('RUC run must be an exact UTC minute')
    return parsed


def inspect(row):
    if not isinstance(row, dict) or row.get('schema') != 'mid.ruc.p3-ab-trial.v1':
        raise ValueError('unsupported trial schema')
    if row.get('variant') not in ('baseline', 'candidate'):
        raise ValueError('trial variant must be baseline/candidate')
    _utc(row.get('run'))
    for key in ('sourceTreeSha256', 'inputInventorySha256', 'contractSha256',
                'outputInventorySha256', 'gridSha256'):
        if not _sha(row.get(key)):
            raise ValueError('missing or invalid source/contract/output SHA: ' + key)
    if type(row.get('physicalBytes')) is not int or not 0 < row['physicalBytes'] < BUDGET:
        raise ValueError('invalid or over-budget physical bytes')
    if type(row.get('epsMembers')) is not int or row['epsMembers'] != 20:
        raise ValueError('expected 20 independently verified EPS members')
    if type(row.get('hourlyLeadCount')) is not int or row['hourlyLeadCount'] != 28:
        raise ValueError('expected 28 native hourly leads 0..27')
    gates = row.get('gates')
    if not isinstance(gates, dict) or set(gates) != set(REQUIRED) or any(gates[k] is not True for k in REQUIRED):
        raise ValueError('missing or non-true independent scientific gate claims')
    stages = row.get('stageSeconds')
    if not isinstance(stages, dict) or set(stages) != set(STAGES):
        raise ValueError('missing or unrecognized timing stage')
    for key in STAGES:
        value = stages[key]
        if type(value) not in (float, int) or not math.isfinite(value) or value <= 0:
            raise ValueError('missing/invalid stage duration: ' + key)
    total = sum(stages.values())
    if total > 3600 * 4:
        raise ValueError('implausible total stage duration')
    return row


def compare(baseline, candidate):
    left, right = inspect(baseline), inspect(candidate)
    if left['variant'] != 'baseline' or right['variant'] != 'candidate':
        raise ValueError('baseline/candidate input order mismatch')
    same = ('run', 'sourceTreeSha256', 'inputInventorySha256', 'contractSha256',
            'outputInventorySha256', 'gridSha256', 'epsMembers', 'hourlyLeadCount',
            'physicalBytes')
    mismatched = [k for k in same if left[k] != right[k]]
    if mismatched:
        raise ValueError('different input, source, output or native contract: ' + ','.join(mismatched))
    earlier, later = [], []
    for key in STAGES:
        earlier.append(left['stageSeconds'][key]); later.append(right['stageSeconds'][key])
    baseline_seconds, candidate_seconds = sum(earlier), sum(later)
    return {'run': left['run'], 'inputInventorySha256': left['inputInventorySha256'],
            'contractSha256': left['contractSha256'],
            'baselineSeconds': round(baseline_seconds, 6),
            'candidateSeconds': round(candidate_seconds, 6),
            'deltaSeconds': round(candidate_seconds-baseline_seconds, 6),
            'ratio': round(candidate_seconds/baseline_seconds, 8),
            'stageDeltasSeconds': {k:round(right['stageSeconds'][k]-left['stageSeconds'][k],6)
                                   for k in STAGES}}


def report(rows):
    if not isinstance(rows, list) or not rows:
        raise ValueError('at least one baseline/candidate pair is required')
    by_run = {}
    for row in rows:
        inspect(row)
        key = (row['run'], row['variant'])
        if key in by_run:
            raise ValueError('duplicate trial for run/variant')
        by_run[key] = row
    runs = sorted({run for run, _ in by_run})
    pairs = []
    for run in runs:
        if (run, 'baseline') not in by_run or (run, 'candidate') not in by_run:
            raise ValueError('unpaired or censored trial; never replace missing with zero')
        pairs.append(compare(by_run[run,'baseline'], by_run[run,'candidate']))
    ratios = sorted(p['ratio'] for p in pairs)
    def nearest_rank(p):
        return ratios[max(0, math.ceil(len(ratios)*p)-1)]
    # Even many paired runs do not independently authenticate the receipts or
    # prove Pages/Worker/client adoption. No production SLO can follow here.
    return {'schema': 'mid.ruc.p3-ab-report.v1', 'publicationAuthorized': False,
            'productionSloAuthorized': False, 'sourceReceiptsIndependentlyVerified': False,
            'pairedRuns': len(pairs), 'runCoverageHours':
            int((_utc(runs[-1])-_utc(runs[0])).total_seconds()/3600)+1,
            'medianCandidateToBaselineRatio': nearest_rank(.5),
            'p95CandidateToBaselineRatio': nearest_rank(.95), 'pairs': pairs,
            'note': 'Read-only self-declared receipt comparison; independently verify DWD SHA, elapsed time, output bytes, worker and client before any release.'}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--trials', required=True, type=Path, help='JSON array of paired untrusted trial receipts')
    ap.add_argument('--output', required=True, type=Path)
    args = ap.parse_args()
    if args.output.exists():
        ap.error('refusing to overwrite any pre-existing report')
    result = report(json.loads(args.trials.read_text(encoding='utf-8')))
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()

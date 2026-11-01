#!/usr/bin/env python3
"""Lossless, fail-closed MID RUC observation ZIP bundler (read-only, never publishes).

Consumes ONLY the original dwd-ruc-observation-<run>-<attempt>.zip artifacts.
Produces JSONL for ruc_p1p5_censor_audit.py and a provenance/gap manifest.
GitHub run successes, directory indices and Pages pointers are NOT DWD GRIB
proof, first-publication times, live app adoption, or production SLO evidence.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
import stat
from zipfile import ZipFile, BadZipFile

ARTIFACT = re.compile(r'^dwd-ruc-observation-(\d+)-(\d+)\.zip$')
SHA = re.compile(r'^[a-f0-9]{40}$')
RUN = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
STATUS_SCHEMA = 'mid.ruc.observer-execution.v1'
DIRECTORY_SCHEMA = 'mid.ruc.dwd-directory-observation.v1'
READBACK_SCHEMA = 'mid.ruc.e2e-readback-shadow.v1'
MAX_UNCOMPRESSED = 256_000
MAX_FILE = 128_000


def json_strict(raw: bytes):
    def no_duplicates(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate JSON key')
            result[key] = value
        return result
    def no_constants(value):
        raise ValueError('nonfinite JSON constant: ' + value)
    return json.loads(raw.decode('utf-8'), object_pairs_hook=no_duplicates,
                      parse_constant=no_constants)


def utc(value):
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError('timestamp must end in UTC Z')
    dt = datetime.fromisoformat(value[:-1] + '+00:00')
    if dt.utcoffset() != timedelta(0):
        raise ValueError('timestamp is not UTC')
    return dt


def read_artifact(path: Path):
    match = ARTIFACT.fullmatch(path.name)
    if not match:
        raise ValueError('noncanonical observation artifact name')
    run_id, attempt = map(int, match.groups())
    if run_id < 1 or attempt < 1:
        raise ValueError('invalid run or attempt identifier')
    prefix = f'{run_id}-{attempt}'
    allowed = {
        f'ruc-observer-status-{prefix}.json',
        f'dwd-observation-{prefix}.jsonl',
        f'ruc-e2e-{prefix}.json',
    }
    try:
        with ZipFile(path, 'r') as archive:
            files = {}
            total = 0
            for info in archive.infolist():
                # Prevent path traversal, symlinks, decompression bombs, and surprises.
                if (info.filename not in allowed or info.filename in files or
                        info.is_dir() or (info.external_attr >> 16 and
                        stat.S_ISLNK(info.external_attr >> 16)) or
                        info.file_size > MAX_FILE or info.file_size <= 0):
                    raise ValueError('unexpected or unsafe observation ZIP member')
                total += info.file_size
                if total > MAX_UNCOMPRESSED:
                    raise ValueError('observation ZIP uncompressed budget exceeded')
                raw = archive.read(info)
                if len(raw) != info.file_size:
                    raise ValueError('observation member length mismatch')
                files[info.filename] = raw
    except BadZipFile as error:
        raise ValueError('invalid observation ZIP') from error
    status_file = f'ruc-observer-status-{prefix}.json'
    if status_file not in files:
        # Earlier observer revisions produced a green but unmeasured workflow.
        # This artifact is deliberately NOT accepted as a positive observation.
        return {'runId': run_id, 'runAttempt': attempt,
                'kind': 'missing-status', 'directory': [], 'readback': []}
    status = json_strict(files[status_file])
    if not isinstance(status, dict) or status.get('schema') != STATUS_SCHEMA:
        raise ValueError('invalid observer status schema')
    if type(status.get('runId')) is not int or status['runId'] != run_id or \
            type(status.get('runAttempt')) is not int or status['runAttempt'] != attempt:
        raise ValueError('observer status GitHub run/attempt mismatch')
    if type(status.get('lineageReady')) is not bool or \
            type(status.get('directoryObserved')) is not bool or \
            type(status.get('directorySamples')) is not int:
        raise ValueError('missing explicit release/observation status')
    ready = status['lineageReady']
    identities = [status.get(k) for k in ('checkoutSha', 'mainSha', 'stableSha')]
    if ready and (not all(isinstance(x, str) and SHA.fullmatch(x) for x in identities)
                  or len(set(identities)) != 1):
        raise ValueError('verified observation without Stable/Main SHA consensus')
    directory_name = f'dwd-observation-{prefix}.jsonl'
    readback_name = f'ruc-e2e-{prefix}.json'
    if not ready:
        if (directory_name in files or readback_name in files or
                status.get('result') != 'release-drift-or-unverified-lineage' or
                status['directorySamples'] != 0 or status['directoryObserved']):
            raise ValueError('release drift incorrectly claims evidence')
        return {'runId': run_id, 'runAttempt': attempt,
                'kind': 'release-drift', 'directory': [], 'readback': []}
    raw_dir = files.get(directory_name)
    directory = [json_strict(line) for line in raw_dir.splitlines() if line.strip()] if raw_dir else []
    if (len(directory) != status['directorySamples'] or
            bool(directory) != status['directoryObserved'] or len(directory) > 3):
        raise ValueError('directory count disagrees with observer status')
    seen_runs = set()
    for row in directory:
        if not isinstance(row, dict) or row.get('schema') != DIRECTORY_SCHEMA:
            raise ValueError('invalid original directory schema')
        run = row.get('run')
        if not isinstance(run, str) or not RUN.fullmatch(run) or run in seen_runs:
            raise ValueError('invalid or duplicate model run in poll')
        run_dt = datetime.strptime(run, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        if run_dt.strftime('%Y-%m-%dT%H:%M') != run or utc(row.get('observedAtUtc')) < run_dt:
            raise ValueError('invalid model run vs observation clock')
        seen_runs.add(run)
        if not isinstance(row.get('stages'), dict) or not isinstance(row.get('eps'), dict):
            raise ValueError('invalid directory/ensemble listing')
    readbacks = []
    if readback_name in files:
        row = json_strict(files[readback_name])
        if not isinstance(row, dict) or row.get('schema') != READBACK_SCHEMA:
            raise ValueError('invalid original public readback schema')
        utc(row.get('observedAtUtc'))
        if any(type(row.get(k)) is not bool for k in ('pagesValid', 'workerValid', 'sameRun')):
            raise ValueError('missing true/false public readback provenance')
        if row['sameRun'] and (not row['pagesValid'] or not row['workerValid'] or
                               row.get('pagesRun') != row.get('workerRun')):
            raise ValueError('contradictory Pages/Worker run match')
        if any(row[k] is not status.get(s) for k, s in (
            ('pagesValid', 'pagesObservedValid'),
            ('workerValid', 'workerObservedValid'),
            ('sameRun', 'sameRunObserved'))):
            raise ValueError('public readback disagrees with observer status')
        readbacks.append(row)
    if bool(readbacks) != (status.get('publicReadbackCaptured') is True):
        raise ValueError('readback presence disagrees with observer status')
    expected_result = ('missing-directory-evidence' if not directory else
                       'directory-only-no-public-readback' if not readbacks else
                       'directory-and-pages-worker-observed' if readbacks[0]['sameRun'] else
                       'directory-with-partial-public-readback')
    if status.get('result') != expected_result:
        raise ValueError('observer result disagrees with evidence')
    return {'runId': run_id, 'runAttempt': attempt,
            'kind': expected_result, 'directory': directory,
            'readback': readbacks, 'stableSha': identities[2]}


def bundle(paths, ending_at_utc, run_manifest=None):
    end = utc(ending_at_utc)
    if end > datetime.now(timezone.utc) + timedelta(minutes=1):
        raise ValueError('future audit period')
    expected = None
    if run_manifest is not None:
        if not isinstance(run_manifest, list):
            raise ValueError('GitHub run manifest must be a list')
        expected = set()
        for row in run_manifest:
            if not isinstance(row, dict) or any(type(row.get(k)) is not int or row[k] < 1
                                                 for k in ('runId', 'runAttempt')):
                raise ValueError('invalid GitHub run manifest row')
            key = (row['runId'], row['runAttempt'])
            if key in expected:
                raise ValueError('duplicate GitHub event in manifest')
            expected.add(key)
    records = {}
    for path in paths:
        record = read_artifact(Path(path))
        key = (record['runId'], record['runAttempt'])
        if key in records or expected is not None and key not in expected:
            raise ValueError('duplicate or non-manifest GitHub observation artifact')
        records[key] = record
    # Multiple attempts for one GitHub run must not fake independent samples.
    latest = {}
    for key in sorted(records):
        latest[key[0]] = key
    accepted = [records[key] for key in sorted(latest.values())]
    directory = [x for rec in accepted for x in rec['directory']]
    readbacks = [x for rec in accepted for x in rec['readback']]
    for row in directory + readbacks:
        if utc(row['observedAtUtc']) > end:
            raise ValueError('observation is after chosen audit cutoff')
    obs_dates = [(utc(r['observedAtUtc']), r.get('run')) for r in directory]
    if len(set(obs_dates)) != len(obs_dates):
        raise ValueError('duplicate DWD listing sample across GitHub artifacts')
    rb_dates = [utc(r['observedAtUtc']) for r in readbacks]
    if len(set(rb_dates)) != len(rb_dates):
        raise ValueError('duplicate Pages/Worker readback sample across artifacts')
    manifest = {
        'schema': 'mid.ruc.observer-artifact-bundle.v1',
        'endingAtUtc': ending_at_utc,
        'githubRunManifestProvided': expected is not None,
        'expectedGitHubRunAttempts': len(expected) if expected is not None else None,
        'missingGitHubRunAttemptArtifacts': (len(expected-set(records)) if expected is not None else None),
        'supersededAttemptCount': len(records)-len(accepted),
        'zipArtifactsAccepted': len(records),
        'distinctGitHubRunsSelected': len(accepted),
        'releaseDriftOrUnmeasuredRuns': sum(r['kind'] in ('missing-status','release-drift') for r in accepted),
        'directorySamples': len(directory),
        'publicReadbacks': len(readbacks),
        'selectedRunAttempts': [{'runId': r['runId'], 'runAttempt': r['runAttempt'],
                                 'kind': r['kind'], 'stableSha': r.get('stableSha')}
                                for r in accepted],
        'originalDwdGribVerified': False, 'originalEps20Verified': False,
        'firstDwdPublicationTimeVerified': False, 'liveClientAdoptionVerified': False,
        'productionSloAuthorized': False, 'productionPointerMutation': False,
    }
    return manifest, directory, readbacks


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--artifacts', nargs='*', default=[], type=Path)
    p.add_argument('--run-manifest', type=Path)
    p.add_argument('--ending-at-utc', required=True)
    p.add_argument('--output-dir', required=True, type=Path)
    a = p.parse_args()
    m = json_strict(a.run_manifest.read_bytes()) if a.run_manifest else None
    result, dirs, reads = bundle(a.artifacts, a.ending_at_utc, m)
    a.output_dir.mkdir(parents=True, exist_ok=False)
    for name, rows in (('directory.jsonl', dirs), ('readbacks.jsonl', reads)):
        with (a.output_dir / name).open('x', encoding='utf-8') as f:
            for item in rows:
                f.write(json.dumps(item, allow_nan=False, sort_keys=True) + '\n')
    with (a.output_dir / 'manifest.json').open('x', encoding='utf-8') as f:
        json.dump(result, f, allow_nan=False, sort_keys=True, indent=2)
        f.write('\n')
    print('Bundled original RUC observer evidence; 0 publication/SLO authorization')


if __name__ == '__main__':
    main()

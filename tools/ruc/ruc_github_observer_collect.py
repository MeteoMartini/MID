#!/usr/bin/env python3
"""Collect authentic GitHub MID RUC observer ZIPs for censored P1/P5 analysis.

Read-only: no schedule dispatch, publication, change to Pages/Worker, or SLO claim.
The GitHub API run inventory is independently fetched, bounded and preserved.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

from ruc_observer_artifact_bundle import read_artifact, bundle, utc

REPO = 'MeteoMartini/MID'
WORKFLOW = 'mid-ruc-availability-observer.yml'
API = 'https://api.github.com'
SHA = re.compile(r'^[a-f0-9]{40}$')
NAME = re.compile(r'^dwd-ruc-observation-(\d+)-(\d+)$')
MAX_PAGES = 15
MAX_RUNS = 900
MAX_ZIP_BYTES = 2_000_000


def safe_redirect_host(url):
    p = urlparse(url)
    host = (p.hostname or '').lower()
    return (p.scheme == 'https' and not p.username and not p.password and not p.fragment
            and (host == 'api.github.com' or host == 'github.com'
                 or host.endswith('.githubusercontent.com')
                 or host.endswith('.blob.core.windows.net')))


class SafeArtifactRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if not safe_redirect_host(newurl):
            raise ValueError('untrusted artifact download redirect')
        # Never forward the GitHub API bearer token to an artifact CDN.
        new = Request(newurl, method='GET', headers={'User-Agent': 'MID-RUC-artifact-readback/1'})
        return new


class GitHubReadOnly:
    def __init__(self, token):
        if not isinstance(token, str) or len(token.strip()) < 8:
            raise ValueError('missing read-only GitHub bearer token')
        self.token = token.strip()
        self.opener = build_opener(SafeArtifactRedirect())

    def get(self, path, *, binary=False):
        if not path.startswith(f'/repos/{REPO}/actions/') or '\n' in path:
            raise ValueError('untrusted GitHub API endpoint')
        request = Request(API + path, headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + self.token,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'MID-RUC-artifact-readback/1',
        })
        with self.opener.open(request, timeout=25) as reply:
            if reply.status != 200:
                raise RuntimeError('GitHub API HTTP status not OK')
            raw = reply.read((MAX_ZIP_BYTES if binary else 6_000_000) + 1)
        if not raw or len(raw) > (MAX_ZIP_BYTES if binary else 6_000_000):
            raise ValueError('GitHub response missing or over budget')
        if binary:
            return raw
        return json.loads(raw)

    def list_runs(self, page):
        return self.get(f'/repos/{REPO}/actions/workflows/{WORKFLOW}/runs?per_page=100&page={page}')

    def list_artifacts(self, run_id):
        return self.get(f'/repos/{REPO}/actions/runs/{run_id}/artifacts?per_page=100')

    def download_zip(self, artifact_id):
        return self.get(f'/repos/{REPO}/actions/artifacts/{artifact_id}/zip', binary=True)


def parse_observed_runs(client, cutoff):
    first = cutoff - timedelta(hours=192)  # preserve brackets for 168 model hours
    results = {}
    total_seen = 0
    reached_earlier = False
    for page in range(1, MAX_PAGES + 1):
        batch = client.list_runs(page)
        entries = batch.get('workflow_runs') if isinstance(batch, dict) else None
        if not isinstance(entries, list) or len(entries) > 100:
            raise ValueError('untrusted observer workflow run page')
        if not entries:
            reached_earlier = True
            break
        for run in entries:
            if not isinstance(run, dict):
                raise ValueError('invalid observer run record')
            run_id, attempt = run.get('id'), run.get('run_attempt')
            if (type(run_id) is not int or run_id <= 0 or type(attempt) is not int or attempt <= 0
                    or not isinstance(run.get('created_at'), str)):
                raise ValueError('invalid observer run provenance')
            when = utc(run['created_at'])
            if when < first:
                reached_earlier = True
                continue
            if when > cutoff:
                continue
            if run.get('head_branch') != 'main' or not isinstance(run.get('head_sha'), str) or not SHA.fullmatch(run['head_sha']):
                raise ValueError('unexpected source for observer workflow run')
            if run.get('event') not in ('schedule', 'workflow_dispatch'):
                raise ValueError('unexpected observer event')
            if run.get('status') not in ('completed', 'queued', 'in_progress', 'waiting', 'pending', 'requested'):
                raise ValueError('unknown observer run status')
            if run_id in results:
                raise ValueError('duplicate observer workflow run ID')
            results[run_id] = {
                'runId': run_id, 'runAttempt': attempt,
                'createdAtUtc': run['created_at'],
                'headSha': run['head_sha'],
                'status': run['status'],
                'conclusion': run.get('conclusion'),
            }
            total_seen += 1
            if total_seen > MAX_RUNS:
                raise ValueError('unbounded observer API run inventory')
        if reached_earlier:
            break
        if len(entries) < 100:
            reached_earlier = True
            break
    if not reached_earlier:
        raise ValueError('GitHub observer pagination incomplete')
    return sorted(results.values(), key=lambda x: x['runId'])


def collect(client, *, cutoff_utc, output_dir):
    cutoff = utc(cutoff_utc)
    if cutoff > datetime.now(timezone.utc) + timedelta(minutes=1):
        raise ValueError('future cutoff')
    output_dir = Path(output_dir)
    if output_dir.exists() or not output_dir.parent.is_dir() or output_dir.is_symlink():
        raise ValueError('output directory exists or parent missing')
    rows = parse_observed_runs(client, cutoff)
    # Build all evidence inside a private scratch directory. Nothing gets
    # published, and a failing sample leaves no partially trusted report.
    scratch = Path(tempfile.mkdtemp(prefix='.ruc-gh-observations-', dir=output_dir.parent))
    try:
        evidence = scratch/'artifacts'
        evidence.mkdir()
        records = []
        chosen_paths = []
        for run in rows:
            run_id, attempt = run['runId'], run['runAttempt']
            result = dict(run, artifactState='missing-or-unavailable', archiveSha256=None,
                          archiveDigestVerified=False)
            response = client.list_artifacts(run_id)
            artifacts = response.get('artifacts') if isinstance(response, dict) else None
            if not isinstance(artifacts, list) or response.get('total_count', 0) > 100:
                raise ValueError('unbounded or malformed GitHub artifact listing')
            expected_name = f'dwd-ruc-observation-{run_id}-{attempt}'
            matches = [x for x in artifacts if isinstance(x, dict) and x.get('name') == expected_name]
            if len(matches) > 1:
                raise ValueError('duplicate named GitHub observer artifacts')
            if matches:
                art = matches[0]
                workflow_run = art.get('workflow_run')
                if workflow_run is not None and (not isinstance(workflow_run, dict) or workflow_run.get('id') != run_id):
                    raise ValueError('GitHub artifact workflow run identity mismatch')
                size = art.get('size_in_bytes')
                artid = art.get('id')
                if type(artid) is not int or artid <= 0 or type(size) is not int or size < 1 or size > MAX_ZIP_BYTES:
                    raise ValueError('invalid original GitHub artifact size or ID')
                if art.get('expired') is True:
                    result['artifactState'] = 'expired'
                elif run['status'] != 'completed':
                    result['artifactState'] = 'incomplete-run'
                elif run['conclusion'] != 'success':
                    result['artifactState'] = 'non-success-run'
                else:
                    raw = client.download_zip(artid)
                    if len(raw) > MAX_ZIP_BYTES:
                        raise ValueError('original observer archive exceeds budget')
                    digest = hashlib.sha256(raw).hexdigest()
                    announced = art.get('digest')
                    if announced is not None and announced != 'sha256:' + digest:
                        raise ValueError('original GitHub artifact SHA-256 mismatch')
                    zip_path = evidence/(expected_name + '.zip')
                    zip_path.write_bytes(raw)
                    decoded = read_artifact(zip_path)
                    if decoded['runId'] != run_id or decoded['runAttempt'] != attempt:
                        raise ValueError('downloaded observer identity mismatch')
                    result['archiveSha256'] = digest
                    result['archiveDigestVerified'] = announced is not None
                    result['artifactState'] = decoded['kind']
                    result['artifactId'] = artid
                    chosen_paths.append(zip_path)
            records.append(result)
        manifest_rows = [{'runId': x['runId'], 'runAttempt': x['runAttempt']} for x in rows]
        summary, directory, readbacks = bundle(chosen_paths, cutoff_utc, manifest_rows)
        summary['githubInventorySource'] = 'GitHub REST actions workflow runs + artifacts (read-only)'
        summary['githubRunInventoryComplete'] = True
        summary['observerRunRecords'] = records
        summary['archiveSha256AuthenticatedViaGithubApiOnly'] = True
        summary['complete168hNativeGribOrClientSloProof'] = False
        for name, data in (('github-run-manifest.json', manifest_rows), ('provenance.json', summary)):
            with (scratch/name).open('x', encoding='utf8') as file:
                json.dump(data, file, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False)
                file.write('\n')
        for name, items in (('directory.jsonl', directory), ('readbacks.jsonl', readbacks)):
            with (scratch/name).open('x', encoding='utf8') as file:
                for item in items:
                    file.write(json.dumps(item, ensure_ascii=False, sort_keys=True, allow_nan=False)+'\n')
        scratch.rename(output_dir)
        return summary
    finally:
        if scratch.exists():
            shutil.rmtree(scratch)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cutoff-utc', required=True)
    parser.add_argument('--output-dir', required=True, type=Path)
    opts = parser.parse_args()
    if os.environ.get('GITHUB_REPOSITORY') not in (None, REPO):
        parser.error('foreign GitHub repository')
    reader = GitHubReadOnly(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN', ''))
    output = collect(reader, cutoff_utc=opts.cutoff_utc, output_dir=opts.output_dir)
    print(json.dumps({'schema': output['schema'], 'githubRunInventoryComplete': True,
                      'selectedGitHubRuns': output['distinctGitHubRunsSelected'],
                      'observedDirectorySamples': output['directorySamples'],
                      'observedPublicReadbacks': output['publicReadbacks'],
                      'productionSloAuthorized': False}, sort_keys=True))


if __name__ == '__main__':
    main()

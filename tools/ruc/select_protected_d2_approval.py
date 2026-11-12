#!/usr/bin/env python3
"""Read-only GitHub selector for the separately protected native ICON-D2 signer.

The public RUC publisher MUST NOT select a candidate-supplied index/sha/run.
Only the current protected main == mid-stable SHA, exact signer workflow ID,
successful Actions run and immutable digest-verified artifact are acceptable.
No secret is logged and no GitHub action is dispatched by this tool.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

REPO = 'MeteoMartini/MID'
SIGNER = 'mid-d2-original-release-approval.yml'
PATH = '.github/workflows/' + SIGNER
ARTIFACT = 'mid-d2-original-protected-attested'
SHA40 = re.compile(r'^[0-9a-f]{40}$')
DIGEST = re.compile(r'^sha256:[0-9a-f]{64}$')
RUN_ID = re.compile(r'^[1-9][0-9]{0,15}$')


def gh(path: str) -> dict:
    proc = subprocess.run(
        ['gh', 'api', 'repos/' + REPO + '/' + path],
        check=True, text=True, capture_output=True, timeout=30,
    )
    value = json.loads(proc.stdout)
    if not isinstance(value, dict):
        raise ValueError('GitHub API response is not an object')
    return value


def approved_run(run: dict, workflow_id: int, sha: str) -> bool:
    return (isinstance(run, dict) and run.get('workflow_id') == workflow_id
            and run.get('head_sha') == sha
            and run.get('head_branch') == 'main'
            and run.get('status') == 'completed'
            and run.get('conclusion') == 'success'
            and run.get('event') in ('schedule', 'workflow_dispatch')
            and run.get('path', '').split('@')[0] == PATH)


def approved_artifact(artifact: dict, run_id: int, sha: str) -> bool:
    linked = artifact.get('workflow_run') or {}
    return (artifact.get('name') == ARTIFACT and artifact.get('expired') is False
            and isinstance(artifact.get('id'), int) and artifact['id'] > 0
            and DIGEST.fullmatch(str(artifact.get('digest', ''))) is not None
            and linked.get('head_sha') in (None, sha)
            and linked.get('id') in (None, run_id))


def select(source_sha: str, requested_id: str = '') -> dict:
    if not SHA40.fullmatch(source_sha):
        raise ValueError('Trusted protected main/stable source SHA missing')
    if requested_id and not RUN_ID.fullmatch(requested_id):
        raise ValueError('Unsafe explicit native D2 approval run ID')
    main = gh('git/ref/heads/main')['object']['sha']
    stable = gh('git/ref/heads/mid-stable')['object']['sha']
    if main != source_sha or stable != source_sha:
        if requested_id:
            raise ValueError('Explicit native D2 release blocked by main/stable SHA drift')
        return {'available': False, 'reason': 'main/stable SHA drift'}
    workflow = gh('actions/workflows/' + SIGNER)
    workflow_id = workflow.get('id')
    if not isinstance(workflow_id, int) or workflow.get('path') != PATH:
        raise ValueError('Native D2 protected signer workflow identity invalid')
    if requested_id:
        candidates = [int(requested_id)]
    else:
        inventory = gh('actions/workflows/' + SIGNER + '/runs?per_page=24&status=success&branch=main')
        candidates = [item['id'] for item in inventory.get('workflow_runs', [])
                      if approved_run(item, workflow_id, source_sha)]
    for run_id in candidates:
        run = gh('actions/runs/' + str(run_id))
        if not approved_run(run, workflow_id, source_sha):
            if requested_id:
                raise ValueError('Requested original-DWD signature run not independently verified')
            continue
        artifacts = gh('actions/runs/' + str(run_id) + '/artifacts')
        matches = [a for a in artifacts.get('artifacts', [])
                   if approved_artifact(a, run_id, source_sha)]
        if len(matches) != 1:
            if requested_id:
                raise ValueError('Requested signed native D2 Actions artifact absent, ambiguous or expired')
            continue
        artifact = matches[0]
        return {'available': True, 'runId': run_id, 'artifactId': artifact['id'],
                'sourceSha': source_sha, 'artifactDigest': artifact['digest']}
    if requested_id:
        raise ValueError('Requested verified native D2 artifact was not found')
    return {'available': False, 'reason': 'no current signed original-DWD artifact for exact stable SHA'}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--requested-run-id', default='')
    parser.add_argument('--github-output', type=Path, required=True)
    args = parser.parse_args()
    selected = select(args.source_sha, args.requested_run_id)
    print('D2 PROTECTED SIGNER: ' + ('verified eligible original DWD artifact' if selected['available']
                                     else 'no eligible original DWD artifact; no native publication'))
    with args.github_output.open('a', encoding='utf8') as output:
        output.write('available=' + ('true' if selected['available'] else 'false') + '\n')
        if selected['available']:
            output.write('run_id=' + str(selected['runId']) + '\n')
            output.write('artifact_id=' + str(selected['artifactId']) + '\n')
            output.write('source_sha=' + str(selected['sourceSha']) + '\n')


if __name__ == '__main__':
    main()

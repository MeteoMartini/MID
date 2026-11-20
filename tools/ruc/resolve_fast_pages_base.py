#!/usr/bin/env python3
"""Resolve the immutable site artifact of the currently deployed Stable site."""

import argparse
import json
import re
import subprocess

REPOSITORY = 'MeteoMartini/MID'
SHA = re.compile(r'[0-9a-f]{40}')
DIGEST = re.compile(r'sha256:[0-9a-f]{64}')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def gh_api(path):
    result = subprocess.run(
        ['gh', 'api', '--method', 'GET', 'repos/' + REPOSITORY + '/' + path],
        check=True, capture_output=True, timeout=30,
    )
    return json.loads(result.stdout)


def resolve_installer_pages(expected_stable, api=gh_api, *, pending_release=None):
    """Accept only the verified installer, Fast deployment, or verified Fast rollback."""
    require(SHA.fullmatch(expected_stable), 'invalid expected Stable SHA')
    require(api('git/ref/heads/mid-stable')['object']['sha'] == expected_stable,
            'Stable lineage changed')
    expected_main = pending_release or expected_stable
    require(SHA.fullmatch(expected_main)
            and api('git/ref/heads/main')['object']['sha'] == expected_main,
            'main/Stable lineage changed')
    if pending_release and expected_main != expected_stable:
        lineage = api(f'compare/{expected_stable}...{expected_main}')
        require(lineage['status'] == 'ahead'
                and lineage['merge_base_commit']['sha'] == expected_stable
                and lineage['base_commit']['sha'] == expected_stable,
                'pending release does not descend from Stable')
    stable = api('git/commits/' + expected_stable)
    require(stable['sha'] == expected_stable and len(stable['parents']) == 1,
            'Stable is not an unambiguous installer promotion')
    message = stable['message'].strip()
    installed = bool(re.fullmatch(r'Install MID v\d+(?:\.\d+){3}', message))
    noop_package = bool(re.fullmatch(r'Prepare MID agent release from PR #[1-9]\d*', message))
    require(installed or noop_package, 'Stable is not an unambiguous installer promotion')
    if noop_package:
        # install-mid.yml explicitly permits a byte-identical ZIP no-op:
        # no new "Install MID" commit is made, and the already authenticated
        # release-bot ZIP commit is promoted unchanged after all installer gates.
        # Match that exact immutable bot-only single-file ZIP commit.
        package = api('commits/' + expected_stable)
        actor = 'mid-release-bot-meteomartini[bot]'
        files = package.get('files', [])
        require(package.get('sha') == expected_stable
                and package.get('author', {}).get('login') == actor
                and package.get('committer', {}).get('login') == actor
                and len(package.get('parents', [])) == 1
                and package['parents'][0]['sha'] == stable['parents'][0]['sha']
                and len(files) == 1
                and files[0].get('filename') == 'MID-professional-replacement.zip'
                and files[0].get('status') in ('added', 'modified'),
                'untrusted installer no-op ZIP identity')
        source = expected_stable
    else:
        source = stable['parents'][0]['sha']

    deployments = api('deployments?environment=github-pages&per_page=1')
    require(len(deployments) == 1, 'latest Pages deployment is missing')
    deployment = deployments[0]
    require(deployment['environment'] == 'github-pages'
            and deployment['sha'] in {source, expected_stable},
            'latest Pages deployment does not match the current Stable source')
    statuses = api(f"deployments/{deployment['id']}/statuses?per_page=1")
    require(len(statuses) == 1 and statuses[0]['state'] == 'success',
            'latest Pages deployment is not successful')
    jobs_url = re.fullmatch(
        rf'https://github\.com/{REPOSITORY}/actions/runs/([1-9]\d*)/job/([1-9]\d*)',
        statuses[0]['log_url'],
    )
    require(jobs_url, 'untrusted Pages deployment job link')
    run_id, job_id = map(int, jobs_url.groups())
    run = api(f'actions/runs/{run_id}')
    job = api(f'actions/jobs/{job_id}')
    require(run['id'] == run_id and run['head_sha'] == deployment['sha']
            and run['head_branch'] == 'main' and run['head_repository']['full_name'] == REPOSITORY
            and job['id'] == job_id and job['run_id'] == run_id
            and job['head_sha'] == run['head_sha'] and job['run_attempt'] == run['run_attempt'],
            'untrusted Pages workflow or attempt')
    passed = {step['name'] for step in job['steps'] if step['conclusion'] == 'success'}
    if run['path'] == '.github/workflows/install-mid.yml':
        require(run['head_sha'] == source and run['conclusion'] == 'success'
                and job['conclusion'] == 'success'
                and any(re.fullmatch(r'GitHub-Pages-Deployment · Versuch [1-3]', step) for step in passed),
                'Pages deployment job or installer attempt does not match')
        artifact_prefix = 'github-pages'
        # Installer names its artifacts by deploy slot, not workflow attempt.
        slot = re.fullmatch(r'MID auf GitHub Pages veröffentlichen · Versuch ([1-3])',
                            job.get('name', ''))
        require(slot, 'installer Pages deployment slot is unknown')
        slot = int(slot[1])
        if slot != 1:
            require(f'Pages-Artefakt nur bei Bedarf hochladen · Versuch {slot}' in passed,
                    'installer reused an earlier artifact without an unambiguous identity')
    elif run['path'] == '.github/workflows/mid-ruc-preprocess.yml':
        require(run['head_sha'] == expected_stable, 'RUC Pages job is not on current Stable')
        if job['name'] == 'Unabhängige Fast Lane geschützt auf Pages veröffentlichen':
            normal = ('mid-fast-pages', {'Fast-Pages-Kandidat veröffentlichen',
                      'Exakten Fast-Punkt und unveränderten Vollpointer öffentlich abfragen'})
            rollback = ('mid-fast-rollback', {'Fast-Pages-Rückfall veröffentlichen',
                        'Rückkehr des originalen Vollpointers prüfen'})
        elif job['name'] == 'MID + RUC kostenfrei auf GitHub Pages veröffentlichen':
            normal = ('mid-ruc-pages', {job['name'],
                      'Produktiven Worker gegen den veröffentlichten RUC-Lauf prüfen'})
            rollback = ('mid-ruc-pages-rollback',
                        {'Nach fehlgeschlagenem Codec-Healthcheck RUC-Rohsnapshot zurückveröffentlichen',
                         'Rollback-Worker/Pages mit derselben Run-ID nachweisen'})
        else:
            raise ValueError('unknown RUC Pages publisher job')
        if run['conclusion'] == job['conclusion'] == 'success':
            artifact_prefix, required = normal
        else:
            require(run['conclusion'] == job['conclusion'] == 'failure',
                    'RUC Pages publish run has no accepted terminal outcome')
            artifact_prefix, required = rollback
        require(required <= passed, 'RUC deployment or rollback readback did not pass')
    else:
        raise ValueError('latest Pages deployment uses an unknown publisher')
    inventory = api(f'actions/runs/{run_id}/artifacts?per_page=100')
    require(inventory['total_count'] <= 100, 'incomplete installer artifact inventory')
    name = f"{artifact_prefix}-{run_id}-{slot if artifact_prefix == 'github-pages' else run['run_attempt']}"
    archives = [artifact for artifact in inventory['artifacts'] if artifact['name'] == name]
    require(len(archives) == 1, 'missing or ambiguous Stable Pages artifact')
    archive = archives[0]
    require(not archive['expired'] and DIGEST.fullmatch(archive.get('digest') or ''),
            'Stable Pages artifact is expired or has no immutable digest')
    return {
        'deployment_id': deployment['id'],
        'run_id': run_id,
        'artifact_id': archive['id'],
        'artifact_digest': archive['digest'],
        'source_sha': run['head_sha'],
        'stable_sha': expected_stable,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stable-sha', required=True)
    args = parser.parse_args()
    print(json.dumps(resolve_installer_pages(args.stable_sha), sort_keys=True))


if __name__ == '__main__':
    main()

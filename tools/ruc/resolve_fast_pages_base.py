#!/usr/bin/env python3
"""Resolve the immutable site artifact of the currently deployed Stable installer."""

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


def resolve_installer_pages(expected_stable, api=gh_api):
    """Accept only the successful deployment associated with this Stable promotion."""
    require(SHA.fullmatch(expected_stable), 'invalid expected Stable SHA')
    for ref in ('main', 'mid-stable'):
        require(api('git/ref/heads/' + ref)['object']['sha'] == expected_stable,
                'main/Stable lineage changed')
    stable = api('git/commits/' + expected_stable)
    require(stable['sha'] == expected_stable and len(stable['parents']) == 1
            and re.fullmatch(r'Install MID v\d+(?:\.\d+){3}', stable['message'].strip()),
            'Stable is not an unambiguous installer promotion')
    source = stable['parents'][0]['sha']

    deployments = api('deployments?environment=github-pages&per_page=1')
    require(len(deployments) == 1, 'latest Pages deployment is missing')
    deployment = deployments[0]
    require(deployment['environment'] == 'github-pages' and deployment['sha'] == source,
            'latest Pages deployment does not match the Stable installer source')
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
    require(run['id'] == run_id and run['conclusion'] == 'success'
            and run['path'] == '.github/workflows/install-mid.yml'
            and run['head_sha'] == source and run['head_branch'] == 'main'
            and run['head_repository']['full_name'] == REPOSITORY,
            'Pages run does not match the successful Stable installer')
    job = api(f'actions/jobs/{job_id}')
    require(job['id'] == job_id and job['run_id'] == run_id and job['conclusion'] == 'success'
            and job['head_sha'] == source and job['run_attempt'] == run['run_attempt']
            and any(re.fullmatch(r'GitHub-Pages-Deployment · Versuch [1-3]', step['name'])
                    and step['conclusion'] == 'success' for step in job['steps']),
            'Pages deployment job or installer attempt does not match')
    inventory = api(f'actions/runs/{run_id}/artifacts?per_page=100')
    require(inventory['total_count'] <= 100, 'incomplete installer artifact inventory')
    name = f"github-pages-{run_id}-{run['run_attempt']}"
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
        'source_sha': source,
        'stable_sha': expected_stable,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stable-sha', required=True)
    args = parser.parse_args()
    print(json.dumps(resolve_installer_pages(args.stable_sha), sort_keys=True))


if __name__ == '__main__':
    main()

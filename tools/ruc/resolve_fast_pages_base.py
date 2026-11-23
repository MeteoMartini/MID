#!/usr/bin/env python3
"""Resolve the immutable site artifact of the currently deployed Stable site."""

import argparse
import json
import os
import re
import subprocess

REPOSITORY = 'MeteoMartini/MID'
SHA = re.compile(r'[0-9a-f]{40}')
DIGEST = re.compile(r'sha256:[0-9a-f]{64}')
INSTALLER_WORKFLOW = '.github/workflows/install-mid.yml'
RUC_WORKFLOW = '.github/workflows/mid-ruc-preprocess.yml'
LOCKED_PUBLISHERS = {
    (INSTALLER_WORKFLOW, 'deploy_pages_2'): 'MID auf GitHub Pages veröffentlichen · Versuch 2',
    (INSTALLER_WORKFLOW, 'deploy_pages_3'): 'MID auf GitHub Pages veröffentlichen · Versuch 3',
    (RUC_WORKFLOW, 'publish'): 'MID + RUC kostenfrei auf GitHub Pages veröffentlichen',
    (RUC_WORKFLOW, 'publish_fast'): 'Unabhängige Fast Lane geschützt auf Pages veröffentlichen',
}



def require(condition, message):
    if not condition:
        raise ValueError(message)


def gh_api(path):
    result = subprocess.run(
        ['gh', 'api', '--method', 'GET', 'repos/' + REPOSITORY + '/' + path],
        check=True, capture_output=True, timeout=30,
    )
    return json.loads(result.stdout)


def own_pages_job(api, environment):
    """Identify the running job only at the protected, locked publisher call sites."""
    if environment.get('GITHUB_ACTIONS') != 'true' or environment.get('GITHUB_REPOSITORY') != REPOSITORY:
        return None
    for (path, job_key), name in LOCKED_PUBLISHERS.items():
        if (environment.get('GITHUB_WORKFLOW_REF') == f'{REPOSITORY}/{path}@refs/heads/main'
                and environment.get('GITHUB_JOB') == job_key):
            break
    else:
        return None

    run_id = environment.get('GITHUB_RUN_ID', '')
    attempt = environment.get('GITHUB_RUN_ATTEMPT', '')
    event_sha = environment.get('GITHUB_SHA', '')
    require(re.fullmatch(r'[1-9][0-9]*', run_id) and re.fullmatch(r'[1-9][0-9]*', attempt)
            and SHA.fullmatch(event_sha), 'invalid running Pages job context')
    run_id, attempt = int(run_id), int(attempt)
    run = api(f'actions/runs/{run_id}')
    require(run.get('id') == run_id and run.get('path') == path
            and run.get('head_branch') == 'main' and run.get('head_sha') == event_sha
            and (run.get('head_repository') or {}).get('full_name') == REPOSITORY
            and run.get('run_attempt') == attempt and run.get('status') == 'in_progress',
            'untrusted running Pages workflow')
    inventory = api(f'actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100')
    jobs = inventory.get('jobs')
    require(isinstance(jobs, list) and len(jobs) <= 100
            and len(jobs) == inventory.get('total_count'), 'incomplete running Pages job inventory')
    matching = [job for job in jobs if job.get('name') == name]
    require(len(matching) == 1, 'missing or ambiguous running Pages job')
    job = matching[0]
    require(type(job.get('id')) is int and job['id'] > 0 and job.get('run_id') == run_id
            and job.get('head_sha') == event_sha and job.get('run_attempt') == attempt
            and job.get('status') == 'in_progress', 'untrusted running Pages job')
    return event_sha, f'https://github.com/{REPOSITORY}/actions/runs/{run_id}/job/{job["id"]}'


# Immutable workflow blob shared by published Stable .513 and the original
# .514/.515 RUC runs. This narrowly identifies historical non-publishing
# jobs that produced a successful GitHub *environment* status anyway.
RUC_FALSE_SUCCESS_WORKFLOW_SHA = 'f43d49a53a86bf41c3797a0c8c7e047a32f22863'


def verified_ruc_nonpublication(api, deployment, status, expected_main):
    """Skip only a signed-by-GitHub environment success with NO Pages action.

    All unknown, changed, incomplete or actually publishing jobs remain
    subject to the ordinary source and artifact checks.
    """
    link = status.get('log_url')
    if not isinstance(link, str):
        return False
    matched = re.fullmatch(
        rf'https://github\.com/{REPOSITORY}/actions/runs/([1-9]\d*)/job/([1-9]\d*)',
        link,
    )
    if not matched:
        return False
    run_id, job_id = int(matched[1]), int(matched[2])
    event_sha = deployment.get('sha')
    if not isinstance(event_sha, str) or not SHA.fullmatch(event_sha):
        return False

    run = api(f'actions/runs/{run_id}')
    if not (run.get('id') == run_id
            and run.get('path') == RUC_WORKFLOW
            and run.get('head_branch') == 'main'
            and run.get('head_sha') == event_sha
            and (run.get('head_repository') or {}).get('full_name') == REPOSITORY
            and run.get('status') == 'completed'
            and run.get('conclusion') == 'success'
            and type(run.get('run_attempt')) is int
            and run['run_attempt'] >= 1):
        return False
    job = api(f'actions/jobs/{job_id}')
    if not (job.get('id') == job_id
            and job.get('run_id') == run_id
            and job.get('head_sha') == event_sha
            and job.get('run_attempt') == run['run_attempt']
            and job.get('status') == 'completed'
            and job.get('conclusion') == 'success'
            and job.get('name') == LOCKED_PUBLISHERS[(RUC_WORKFLOW, 'publish')]):
        return False

    steps = job.get('steps')
    if not isinstance(steps, list):
        return False
    expected = {
        'RUC-Basis und laufendes Release gegen aktuellen MID-Stable-Stand prüfen': 'success',
        'Vor dem großen Snapshot-Download authentifizierten Contract-Hash prüfen': 'skipped',
        'Vorbereiteten RUC-Snapshot laden': 'skipped',
        'GitHub-Pages-Artefakt hochladen': 'skipped',
        'MID + RUC kostenfrei auf GitHub Pages veröffentlichen': 'skipped',
        'Nach fehlgeschlagenem Codec-Healthcheck RUC-Rohsnapshot zurückveröffentlichen': 'skipped',
        'Rollback-Rohdaten als GitHub-Pages-Artefakt hochladen': 'skipped',
        'RUC-Ergebnis eindeutig zusammenfassen': 'success',
    }
    for name, outcome in expected.items():
        matching = [step for step in steps if isinstance(step, dict) and step.get('name') == name]
        if len(matching) != 1 or matching[0].get('conclusion') != outcome:
            return False

    # An old source must be an ancestor of today's pending release; neither
    # another PR nor an unrelated historic workflow may suppress a success.
    if event_sha != expected_main:
        ancestry = api(f'compare/{event_sha}...{expected_main}')
        if not (ancestry.get('status') == 'ahead'
                and (ancestry.get('merge_base_commit') or {}).get('sha') == event_sha
                and (ancestry.get('base_commit') or {}).get('sha') == event_sha):
            return False

    # A later source edit could add an unrecognised deploy step. Verify the
    # exact original reviewed workflow blob, not just display step names.
    wf = api(f'contents/{RUC_WORKFLOW}?ref={event_sha}')
    return wf.get('sha') == RUC_FALSE_SUCCESS_WORKFLOW_SHA


def resolve_installer_pages(expected_stable, api=gh_api, *, pending_release=None, environment=None):
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
        files = package.get('files') or []
        require(package.get('sha') == expected_stable
                and (package.get('author') or {}).get('login') == actor
                and (package.get('committer') or {}).get('login') == actor
                and len(package.get('parents') or []) == 1
                and package['parents'][0]['sha'] == stable['parents'][0]['sha']
                and len(files) == 1
                and files[0].get('filename') == 'MID-professional-replacement.zip'
                and files[0].get('status') in ('added', 'modified'),
                'untrusted installer no-op ZIP identity')
        source = expected_stable
    else:
        source = stable['parents'][0]['sha']

    # Failed newer Pages deployments must not hide the last successfully
    # attested Stable deployment from Installer retries. Refuse unknown
    # successful sources and pending deployments; inspect bounded history.
    deployments = api('deployments?environment=github-pages&per_page=30')
    require(isinstance(deployments, list) and 0 < len(deployments) <= 30,
            'Pages deployment history missing or incomplete')
    own_job = own_pages_job(api, environment if environment is not None else {})
    own_seen = False
    deployment = None
    statuses = None
    for item in deployments:
        require(item.get('environment') == 'github-pages',
                'Pages deployment environment differs')
        recent = api(f"deployments/{item['id']}/statuses?per_page=1")
        require(len(recent) == 1, 'Pages deployment status missing')
        if recent[0]['state'] == 'success':
            if verified_ruc_nonpublication(api, item, recent[0], expected_main):
                continue
            if item.get('sha') not in {source, expected_stable}:
                # Rejection stays fail-closed. A bounded, sanitized identity lets
                # the original installer logs identify the exact foreign record,
                # without disclosing status URLs, tokens or untrusted API fields.
                foreign_id = item.get('id')
                foreign_sha = item.get('sha')
                diagnostic_id = foreign_id if type(foreign_id) is int and foreign_id > 0 else 'INVALID'
                diagnostic_sha = foreign_sha if isinstance(foreign_sha, str) and SHA.fullmatch(foreign_sha) else 'INVALID'
                raise ValueError(
                    'latest successful Pages deployment not on Stable source'
                    f' (deployment_id={diagnostic_id}, deployment_sha={diagnostic_sha})'
                )
            deployment, statuses = item, recent
            break
        # The environment creates this record before the job executes any step.
        # All other pending statuses, including another job in this run, block.
        if (not own_seen and recent[0]['state'] == 'in_progress'
                and own_job == (item.get('sha'), recent[0].get('log_url'))):
            own_seen = True
            continue
        require(recent[0]['state'] in ('failure', 'error'),
                'newest Pages deployment not in a safe terminal state')
    require(deployment is not None,
            'latest Pages deployment is not successful')
    # deploy-pages publishes a run-level status URL on some valid Pages
    # deployments. Never infer a job without independently verifying its
    # identity, source SHA, run attempt and successful deploy/rollback step.
    url = statuses[0].get('log_url', '')
    run_link = re.fullmatch(
        rf'https://github\.com/{REPOSITORY}/actions/runs/([1-9]\d*)(?:/job/([1-9]\d*))?',
        url,
    )
    require(run_link, 'untrusted Pages deployment run link')
    run_id = int(run_link[1])
    run = api(f'actions/runs/{run_id}')
    require(run['id'] == run_id and run['head_sha'] == deployment['sha']
            and run['head_branch'] == 'main'
            and run['head_repository']['full_name'] == REPOSITORY,
            'untrusted Pages workflow or attempt')
    if run_link[2]:
        job_id = int(run_link[2])
        job = api(f'actions/jobs/{job_id}')
    else:
        inventory = api(f'actions/runs/{run_id}/jobs?per_page=100')
        require(inventory.get('total_count', 101) <= 100
                and isinstance(inventory.get('jobs'), list)
                and len(inventory['jobs']) == inventory['total_count'],
                'incomplete Pages job inventory')
        jobs = inventory['jobs']
        def deployment_step(item):
            steps = item.get('steps') or []
            if run['path'] == '.github/workflows/install-mid.yml':
                return (re.fullmatch(r'MID auf GitHub Pages veröffentlichen · Versuch [1-3]',
                                     item.get('name', '')) is not None
                        and any(re.fullmatch(r'GitHub-Pages-Deployment · Versuch [1-3]',
                                             s.get('name', ''))
                                and s.get('conclusion') == 'success' for s in steps))
            if run['path'] == '.github/workflows/mid-ruc-preprocess.yml':
                if item.get('name') == 'Unabhängige Fast Lane geschützt auf Pages veröffentlichen':
                    return any(s.get('name') in ('Fast-Pages-Kandidat veröffentlichen',
                                               'Fast-Pages-Rückfall veröffentlichen')
                               and s.get('conclusion') == 'success' for s in steps)
                if item.get('name') == 'MID + RUC kostenfrei auf GitHub Pages veröffentlichen':
                    return any(s.get('name') in ('MID + RUC kostenfrei auf GitHub Pages veröffentlichen',
                                               'Nach fehlgeschlagenem Codec-Healthcheck RUC-Rohsnapshot zurückveröffentlichen')
                               and s.get('conclusion') == 'success' for s in steps)
            return False
        selected = [item for item in jobs if item.get('run_id') == run_id
                    and item.get('head_sha') == run['head_sha']
                    and item.get('run_attempt') == run['run_attempt']
                    and deployment_step(item)]
        require(len(selected) == 1, 'missing or ambiguous Pages deployment job')
        job = selected[0]
        job_id = job['id']
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
    print(json.dumps(resolve_installer_pages(args.stable_sha, environment=os.environ), sort_keys=True))


if __name__ == '__main__':
    main()

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


# Exact reviewed installer workflow which introduced the post-Stable catalog.
# This exception is strictly for Pages baseline identity, never release authority.
CATALOG_ONLY_INSTALLER_WORKFLOW_SHA = 'f524bb0b7eaa9b86c350194472ae56e16b10eac1'
CATALOG_JOB = 'SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren'


def verified_catalog_only_installer(api, run, job, stable_sha, source_sha, installed):
    """Return a complete immutable job-inventory receipt, or None; no writes."""
    actor = 'mid-release-bot-meteomartini[bot]'
    if not (installed and run.get('path') == INSTALLER_WORKFLOW
            and run.get('event') == 'workflow_dispatch'
            and run.get('status') == 'completed' and run.get('conclusion') == 'failure'
            and type(run.get('run_attempt')) is int and run['run_attempt'] == 1
            and type(run.get('id')) is int and run['id'] > 0
            and run.get('head_sha') == source_sha and run.get('head_branch') == 'main'
            and (run.get('repository') or {}).get('full_name') == REPOSITORY
            and (run.get('head_repository') or {}).get('full_name') == REPOSITORY
            and (run.get('actor') or {}).get('login') == actor
            and (run.get('triggering_actor') or {}).get('login') == actor):
        return None
    commit = api('commits/' + stable_sha)
    if not (commit.get('sha') == stable_sha
            and (commit.get('author') or {}).get('login') == actor
            and (commit.get('committer') or {}).get('login') == actor
            and len(commit.get('parents') or []) == 1
            and commit['parents'][0].get('sha') == source_sha
            and re.fullmatch(r'Install MID v\d+(?:\.\d+){3}',
                             (commit.get('commit') or {}).get('message', '').strip())
            and api(f'contents/{INSTALLER_WORKFLOW}?ref={source_sha}').get('sha')
            == CATALOG_ONLY_INSTALLER_WORKFLOW_SHA):
        return None
    path = f"actions/runs/{run['id']}/attempts/1/jobs?per_page=100"
    inventory = api(path)
    jobs = inventory.get('jobs')
    if not (isinstance(jobs, list) and len(jobs) == inventory.get('total_count') == 22
            and all(isinstance(j, dict) and type(j.get('id')) is int and j['id'] > 0
                    and j.get('run_id') == run['id'] and j.get('run_attempt') == 1
                    and j.get('head_sha') == source_sha and j.get('status') == 'completed'
                    and isinstance(j.get('name'), str) for j in jobs)
            and len({j['id'] for j in jobs}) == len({j['name'] for j in jobs}) == len(jobs)):
        return None
    by_name = {j['name']: j for j in jobs}
    required = {
        'Release-ZIP prüfen und immutable Snapshot vorbereiten',
        'Release-Core, Build, Audit und iOS prüfen',
        'Vollständig geprüften Release sammeln und committen',
        'Geprüften MID-Worker sicher automatisch veröffentlichen',
        'Erfolgreichen Pages-/Worker-Release finalisieren',
        *(f'Release-Core-Regression · core-{n}/4' for n in range(1, 5)),
        *(f'Release-Heavy · {name}' for name in (
            'heavy-mountain-visual ·', 'heavy-native-map ·', 'heavy-browser-state ·',
            'heavy-unified-map · 1/3', 'heavy-unified-map · 2/3', 'heavy-unified-map · 3/3')),
    }
    pages = {f'MID auf GitHub Pages veröffentlichen · Versuch {n}' for n in range(1, 4)}
    optional = {'GitHub-Pages-Artefakt parallel vorbereiten',
                'Pages-Retry abkühlen · 1', 'Pages-Retry abkühlen · 2'}
    if not (set(by_name) == required | pages | optional | {CATALOG_JOB}
            and all(by_name[n].get('conclusion') == 'success' for n in required)
            and all(by_name[n].get('conclusion') in ('success', 'skipped') for n in optional)
            and all(by_name[n].get('conclusion') in ('success', 'skipped') for n in pages)
            and by_name[CATALOG_JOB].get('conclusion') == 'failure'):
        return None
    selected = [by_name[n] for n in pages if by_name[n]['conclusion'] == 'success']
    if not (len(selected) == 1 and selected[0]['id'] == job.get('id')
            and selected[0].get('steps') == job.get('steps')
            and selected[0].get('name') == job.get('name')
            and job.get('run_attempt') == 1 and job.get('conclusion') == 'success'):
        return None
    final = by_name['Erfolgreichen Pages-/Worker-Release finalisieren']

    def step_is(entry, name, outcome):
        matches = [s for s in (entry.get('steps') or []) if isinstance(s, dict)
                   and s.get('name') == name]
        return len(matches) == 1 and matches[0].get('conclusion') == outcome

    if not (step_is(final, 'Geprüften Release ausschließlich per API-Fast-Forward nach mid-stable promoten', 'success')
            and step_is(final, 'Finalen Stable-SHA verifizieren und Qualitätsstatus setzen', 'success')
            and step_is(by_name[CATALOG_JOB],
                        'SHA-/Job-/Pages-/Worker-/Tag-Provenienz verifizieren und GitHub Release erzeugen', 'failure')):
        return None
    return path, inventory


def resolve_installer_pages(expected_stable, api=gh_api, *, pending_release=None, environment=None,
                            verify_inactive=None):
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
    history_path = 'deployments?environment=github-pages&per_page=30'
    history_pages = []
    observed_statuses = []
    seen_ids = set()

    def bounded_history():
        for page in range(1, 5):
            path = history_path if page == 1 else f'{history_path}&page={page}'
            batch = api(path)
            require(isinstance(batch, list) and len(batch) <= 30,
                    'Pages deployment history missing or incomplete')
            require(page > 1 or batch, 'Pages deployment history missing or incomplete')
            for item in batch:
                ident = item.get('id') if isinstance(item, dict) else None
                require(type(ident) is int and ident > 0, 'invalid Pages deployment ID')
                require(ident not in seen_ids, 'duplicate ID in Pages deployment history')
                seen_ids.add(ident)
            history_pages.append((path, batch))
            yield from batch
            if len(batch) < 30:
                return
        raise ValueError('Pages deployment history scan limit reached')

    own_job = own_pages_job(api, environment if environment is not None else {})
    own_seen = False
    deployment = None
    statuses = None
    inactive_candidate = False
    for item in bounded_history():
        require(item.get('environment') == 'github-pages',
                'Pages deployment environment differs')
        status_path = f"deployments/{item['id']}/statuses?per_page=1"
        recent = api(status_path)
        require(isinstance(recent, list) and len(recent) == 1
                and isinstance(recent[0], dict), 'Pages deployment status missing')
        observed_statuses.append((status_path, recent))
        if recent[0]['state'] == 'inactive':
            status_history_path = f"deployments/{item['id']}/statuses?per_page=30"
            history = api(status_history_path)
            require(isinstance(history, list) and 1 < len(history) < 30
                    and history[0] == recent[0]
                    and all(isinstance(status, dict) for status in history),
                    'inactive Pages status history missing, changed or incomplete')
            observed_statuses.append((status_history_path, history))
            prior_success = [status for status in history[1:] if status.get('state') == 'success']
            if len(prior_success) == 1 and verified_ruc_nonpublication(
                    api, item, prior_success[0], expected_main):
                continue
            if (verify_inactive is not None and len(prior_success) == 1
                    and item.get('sha') in {source, expected_stable}):
                deployment, statuses = item, prior_success
                inactive_candidate = True
                break
        if (recent[0]['state'] == 'success'
                and verified_ruc_nonpublication(api, item, recent[0], expected_main)):
            continue
        if recent[0]['state'] == 'success':
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
                f"newest Pages deployment not in a safe terminal state (deployment_id={item['id']})")
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
    historical_job = job.get('run_attempt') != run.get('run_attempt')
    require(job.get('id') == job_id and job.get('run_id') == run_id
            and job.get('head_sha') == run['head_sha'],
            'untrusted Pages workflow job identity')
    if historical_job:
        attempt = job.get('run_attempt')
        require(run_link[2] and run['path'] == '.github/workflows/install-mid.yml'
                and run.get('status') == 'completed' and run.get('conclusion') == 'success'
                and type(attempt) is int and type(run.get('run_attempt')) is int
                and 1 <= attempt < run['run_attempt'] and verify_inactive is not None,
                'untrusted historical Pages attempt')
        historic = api(f'actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100')
        entries = historic.get('jobs')
        require(isinstance(entries, list) and len(entries) == historic.get('total_count')
                and len(entries) <= 100
                and all(isinstance(entry, dict)
                        and type(entry.get('id')) is int and entry['id'] > 0
                        and entry.get('run_id') == run_id
                        and entry.get('run_attempt') == attempt
                        for entry in entries)
                and len({entry['id'] for entry in entries}) == len(entries)
                and entries.count(job) == 1,
                'historical Pages job missing or ambiguous')

    passed = {step['name'] for step in job['steps'] if step['conclusion'] == 'success'}
    catalog_receipt = None
    if run['path'] == '.github/workflows/install-mid.yml':
        if run['conclusion'] == 'failure':
            catalog_receipt = verified_catalog_only_installer(api, run, job, expected_stable, source, installed)
        require(run['head_sha'] == source and (run['conclusion'] == 'success' or catalog_receipt is not None)
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
    identity = {
        'deployment_id': deployment['id'],
        'run_id': run_id,
        'artifact_id': archive['id'],
        'artifact_digest': archive['digest'],
        'source_sha': run['head_sha'],
        'stable_sha': expected_stable,
    }
    if inactive_candidate or historical_job:
        require(verify_inactive(identity) is True,
                'Pages archive does not match the public site')
    for path, expected in reversed(observed_statuses):
        require(api(path) == expected, 'Pages deployment status changed during scan')
    for path, expected in reversed(history_pages):
        require(api(path) == expected, 'Pages deployment history changed during scan')
    if inactive_candidate or historical_job:
        require(api('git/ref/heads/mid-stable')['object']['sha'] == expected_stable
                and api('git/ref/heads/main')['object']['sha'] == expected_main,
                'main/Stable lineage changed during public proof')
    if catalog_receipt is not None:
        receipt_path, receipt_inventory = catalog_receipt
        require(api(f'actions/runs/{run_id}') == run and api(receipt_path) == receipt_inventory
                and api(f'actions/runs/{run_id}/artifacts?per_page=100') == inventory,
                'catalog-only installer evidence changed during scan')
        require(api('git/ref/heads/mid-stable')['object']['sha'] == expected_stable
                and api('git/ref/heads/main')['object']['sha'] == expected_main,
                'main/Stable lineage changed during catalog-only proof')
    return identity


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stable-sha', required=True)
    args = parser.parse_args()
    print(json.dumps(resolve_installer_pages(args.stable_sha, environment=os.environ), sort_keys=True))


if __name__ == '__main__':
    main()

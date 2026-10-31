#!/usr/bin/env python3
"""Verify that the deployed MID Worker can read the just-published RUC run.

GitHub Pages reports a deployment as successful before every CDN/custom-domain edge
necessarily serves the new ``ruc/latest.json``.  Therefore the post-deploy health
check remains strict, but allows a short bounded convergence window.  It never
accepts a stale/wrong run: the expected freshly published run must become ready
before the retry budget is exhausted.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

MAX_PAGES_PROBE_ATTEMPTS = 12


def health_url(raw: str) -> str:
    url = urllib.parse.urlsplit(raw.strip())
    if url.scheme not in {'https', 'http'} or not url.netloc:
        raise ValueError('MID_RUC_WORKER_HEALTH_URL must be an absolute http(s) URL')
    query = urllib.parse.parse_qsl(url.query, keep_blank_values=True)
    query = [(k, v) for k, v in query if k != 'mode'] + [('mode', 'ruc-health')]
    return urllib.parse.urlunsplit((url.scheme, url.netloc, url.path or '/', urllib.parse.urlencode(query), url.fragment))


def probe_url(raw: str, run: str, attempt: int) -> str:
    """Make every convergence probe distinct without changing Worker semantics."""
    url = urllib.parse.urlsplit(raw)
    query = urllib.parse.parse_qsl(url.query, keep_blank_values=True)
    query = [(k, v) for k, v in query if k not in {'mid_ruc_expected', 'mid_ruc_probe'}]
    query += [('mid_ruc_expected', run), ('mid_ruc_probe', str(attempt))]
    return urllib.parse.urlunsplit((url.scheme, url.netloc, url.path, urllib.parse.urlencode(query), url.fragment))


def expected_run(meta_path: str) -> str:
    data = json.loads(Path(meta_path).read_text(encoding='utf-8'))
    if data.get('schema') != 'mid.dwd.ruc.grid.v2' or not data.get('run'):
        raise ValueError('local RUC metadata is invalid')
    return str(data['run'])


def verified_snapshot_contract(meta: dict, *, allow_legacy_rollback: bool = False) -> dict:
    """Check the immutable 27 h model axes and native geometry before public readback.

    The candidate is already SHA-sealed by the producer. Here we require exact
    typed dimensions rather than treating a partly decoded snapshot as healthy.
    """
    from datetime import datetime, timedelta
    if not isinstance(meta, dict) or meta.get('schema') != 'mid.dwd.ruc.grid.v2':
        raise RuntimeError('RUC snapshot metadata schema invalid')
    run = meta.get('run')
    try:
        if not isinstance(run, str) or len(run) != 16:
            raise ValueError('invalid run')
        base = datetime.strptime(run, '%Y-%m-%dT%H:%M')
        if base.strftime('%Y-%m-%dT%H:%M') != run:
            raise ValueError('noncanonical run')
    except ValueError as error:
        raise RuntimeError('RUC snapshot model initialization is invalid') from error
    # A legacy 14 h raw rollback exists for the rare full-codec-activation
    # failure. It is allowed ONLY in the separately gated rollback workflow.
    if allow_legacy_rollback:
        pages = meta.get('pages')
        if (meta.get('storageProfile') != 'pages-free-v1' or
                not isinstance(pages, dict) or pages.get('profile') != 'pages-free-v1' or
                pages.get('nativeEpsMembers') is not False):
            raise RuntimeError('RUC legacy rollback is not a verified raw Pages profile')
    hours = 14 if allow_legacy_rollback else 27
    axis = [(base + timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(hours + 1)]
    for label, times in (
        ('times', meta.get('times')),
        ('deterministic.times', (meta.get('deterministic') or {}).get('times') if isinstance(meta.get('deterministic'), dict) else None),
        ('epsSummary.times', (meta.get('epsSummary') or {}).get('times') if isinstance(meta.get('epsSummary'), dict) else None),
        ('eps.times', (meta.get('eps') or {}).get('times') if isinstance(meta.get('eps'), dict) else None),
    ):
        if not isinstance(times, list) or times != axis:
            raise RuntimeError(f'RUC snapshot {label} is not complete 0..+{hours}h UTC hourly')
    points = meta.get('pointCount')
    members = (meta.get('eps') or {}).get('memberCount') if isinstance(meta.get('eps'), dict) else None
    grid = meta.get('grid')
    if type(points) is not int or points < 1 or type(members) is not int or members != 20:
        raise RuntimeError('RUC snapshot point/member dimensions invalid')
    if not isinstance(grid, dict) or type(grid.get('nativePointCount')) is not int or grid['nativePointCount'] != points:
        raise RuntimeError('RUC snapshot native-grid dimensions invalid')
    return {'run': run, 'timeCount': len(axis), 'pointCount': points,
            'epsMemberCount': members, 'times': axis, 'grid': grid}


def check(payload: dict, run: str, *, expected_contract: dict | None = None) -> None:
    required={'configured':True,'ready':True,'fresh':True,'schemaValid':True}
    for key, value in required.items():
        if payload.get(key) is not value:
            raise RuntimeError(
                f'worker RUC health {key}={payload.get(key)!r}, expected {value!r}; '
                f'run={payload.get("run")!r}; reason={payload.get("reason")!r}'
            )
    if str(payload.get('run','')) != run:
        raise RuntimeError(f'worker RUC run {payload.get("run")!r} does not match published run {run!r}')
    objects = payload.get('objectsPresent') or {}
    for key in ('lookup', 'deterministic', 'epsSummary'):
        if objects.get(key) is not True:
            raise RuntimeError(f'worker RUC object {key} is not present')
    backend = str(payload.get('backend') or '')
    if backend == 'r2' and objects.get('epsMembers') is not True:
        raise RuntimeError('worker RUC native EPS object is not present for R2 backend')
    if backend == 'pages' and payload.get('nativeEpsMembers') is not False:
        raise RuntimeError('GitHub Pages free profile must explicitly omit native EPS members')
    if expected_contract is None:
        if int(payload.get('timeCount') or 0) < 4 or int(payload.get('pointCount') or 0) < 1 or int(payload.get('epsMemberCount') or 0) < 2:
            raise RuntimeError('worker RUC metadata counts are incomplete')
    else:
        if run != expected_contract['run']:
            raise RuntimeError('worker RUC run differs from the sealed local manifest')
        for name in ('timeCount', 'pointCount', 'epsMemberCount'):
            received = payload.get(name)
            if type(received) is not int or received != expected_contract[name]:
                raise RuntimeError(f'worker RUC {name}={received!r} differs from sealed snapshot {expected_contract[name]}')


def fetch_payload(url: str, timeout: float) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'MID-RUC-health-check/2',
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f'worker RUC health HTTP {response.status}')
        payload = json.loads(response.read().decode())
    if not isinstance(payload, dict):
        raise RuntimeError('worker RUC health payload is not an object')
    return payload


def codec_evidence(payload: dict, meta: dict) -> dict:
    """Report codec adoption separately from the strict, rollback-safe raw gate.

    A successful base health check is not proof that a codec was decoded.  Keep
    absent, disabled and raw-fallback states visible without turning the optional
    pilot into a prerequisite for serving the preserved raw product.
    """
    published = meta.get('pages', {}).get('losslessTransport') or {}
    pilot = payload.get('codecPilot')
    pilot = pilot if isinstance(pilot, dict) else {}
    expected = published.get('mode') == 'dual-read-pilot'
    verified = bool(
        expected and bool(meta.get('run')) and payload.get('run') == meta.get('run')
        and published.get('rawRetained') is True
        and pilot.get('advertised') is True and pilot.get('readEnabled') is True
        and pilot.get('verified') is True and pilot.get('rawRetained') is True
        and pilot.get('transport') == 'byteplanes-gzip'
    )
    return {
        'run': str(meta.get('run', '')),
        'published': expected,
        'addedBytes': published.get('addedBytes'),
        'advertised': pilot.get('advertised'),
        'readEnabled': pilot.get('readEnabled'),
        'verified': verified,
        'transport': pilot.get('transport'),
        'chunkIndex': pilot.get('chunkIndex'),
        'rawRetained': pilot.get('rawRetained'),
        'reason': pilot.get('reason'),
    }


def active_profile_valid(meta: dict) -> bool:
    return bool(isinstance(meta,dict) and meta.get('schema')=='mid.dwd.ruc.grid.v2'
                and meta.get('storageProfile')=='pages-lossless-v1'
                and meta.get('migration',{}).get('schema')=='mid.ruc.migration-active.v1'
                and meta.get('migration',{}).get('productionEnabled') is True
                and meta.get('pages',{}).get('profile')=='pages-lossless-v1'
                and meta.get('pages',{}).get('losslessTransport')=={
                    'profile':'mid.ruc.compressed-pages.v1','mode':'replacement','rawRetained':False})

def full_codec_evidence(payload:dict,meta:dict)->dict:
    expected=active_profile_valid(meta)
    full=payload.get('fullCodec') if isinstance(payload.get('fullCodec'),dict) else {}
    verified=bool(expected and payload.get('run')==meta.get('run')
                  and payload.get('storageProfile')=='pages-lossless-v1'
                  and full.get('advertised') is True and full.get('verified') is True
                  and full.get('rawRetained') is False)
    return {'run':str(meta.get('run','')),'published':expected,'verified':verified,
            'advertised':full.get('advertised'),'rawRetained':full.get('rawRetained')}

def probe_pages(base: str, run: str, *, attempts=MAX_PAGES_PROBE_ATTEMPTS, fetcher=fetch_payload, sleeper=time.sleep, expected_profile='pages-free-v1', expected_contract: dict | None = None, allow_legacy_rollback: bool = False) -> int:
    """Prove public Pages convergence separately from Worker adoption."""
    url = urllib.parse.urljoin(base.rstrip('/') + '/', 'latest.json')
    last_error = None
    for attempt in range(1, max(1, attempts) + 1):
        try:
            meta = fetcher(probe_url(url, run, attempt), 15)
            if meta.get('schema') != 'mid.dwd.ruc.grid.v2' or meta.get('storageProfile') != expected_profile or (expected_profile == 'pages-lossless-v1' and not active_profile_valid(meta)):
                raise RuntimeError('Pages RUC metadata schema/profile is invalid')
            if meta.get('run') != run:
                raise RuntimeError(f'Pages RUC run {meta.get("run")!r} does not match {run!r}')
            if expected_contract is not None:
                if verified_snapshot_contract(meta, allow_legacy_rollback=allow_legacy_rollback) != expected_contract:
                    raise RuntimeError('Pages RUC geometry, member or validity axes differ from sealed local snapshot')
            return attempt
        except Exception as error:
            last_error = error
            if attempt < max(1, attempts):
                delay = min(30, 8 * 1.5 ** (attempt - 1))
                print(
                    f'MID RUC Pages not converged ({attempt}/{attempts}): {error}; '
                    f'retry in {delay:.0f}s',
                    file=sys.stderr,
                )
                sleeper(delay)
    raise RuntimeError(f'pages-publication: public RUC metadata did not converge after {attempts} attempts: {last_error}')


def probe_until_ready(
    url: str,
    run: str,
    *,
    timeout: float = 15,
    attempts: int = 7,
    retry_delay: float = 8,
    max_retry_delay: float = 30,
    fetcher=fetch_payload,
    sleeper=time.sleep,
    expected_contract: dict | None = None,
) -> tuple[dict, int]:
    attempts = max(1, int(attempts))
    retry_delay = max(0.0, float(retry_delay))
    max_retry_delay = max(retry_delay, float(max_retry_delay))
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            payload = fetcher(probe_url(url, run, attempt), timeout)
            check(payload, run, expected_contract=expected_contract)
            return payload, attempt
        except Exception as error:  # strict final gate; only timing is retried
            last_error = error
            if attempt >= attempts:
                break
            delay = min(max_retry_delay, retry_delay * (1.5 ** (attempt - 1)))
            print(
                f'MID RUC health not converged ({attempt}/{attempts}): {error}; '
                f'retry in {delay:.0f}s',
                file=sys.stderr,
            )
            sleeper(delay)

    raise RuntimeError(f'worker RUC health did not converge after {attempts} attempts: {last_error}')


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--url', required=True)
    p.add_argument('--meta', default='.ruc-out/latest.json')
    p.add_argument('--legacy-rollback', action='store_true', help='only for the separately verified 14 h raw emergency rollback')
    p.add_argument('--pages-base', help='Verify public Pages pointer before probing Worker adoption')
    p.add_argument('--timeout', type=float, default=15)
    p.add_argument('--attempts', type=int, default=7)
    p.add_argument('--pages-attempts', type=int, default=MAX_PAGES_PROBE_ATTEMPTS,
                   help='bounded public Pages metadata convergence window; separate from Worker attempts')
    p.add_argument('--retry-delay', type=float, default=8)
    p.add_argument('--max-retry-delay', type=float, default=30)
    a = p.parse_args()
    if not 1 <= a.pages_attempts <= MAX_PAGES_PROBE_ATTEMPTS:
        p.error(f'--pages-attempts must be between 1 and {MAX_PAGES_PROBE_ATTEMPTS}')
    run = expected_run(a.meta)
    meta = json.loads(Path(a.meta).read_text(encoding='utf-8'))
    expected_contract = verified_snapshot_contract(meta, allow_legacy_rollback=a.legacy_rollback)
    if meta.get('storageProfile')=='pages-lossless-v1' and not active_profile_valid(meta):
        raise RuntimeError('full RUC profile has not been explicitly activated')
    url = health_url(a.url)
    if a.pages_base:
        page_attempt = probe_pages(a.pages_base, run, attempts=a.pages_attempts, expected_profile=meta.get('storageProfile','pages-free-v1'), expected_contract=expected_contract, allow_legacy_rollback=a.legacy_rollback)
        print(f'MID RUC Pages publication OK: run={run}, probe={page_attempt}')
    payload, attempt = probe_until_ready(
        url,
        run,
        timeout=a.timeout,
        attempts=a.attempts,
        retry_delay=a.retry_delay,
        max_retry_delay=a.max_retry_delay,
        expected_contract=expected_contract,
    )
    print(
        f'MID RUC health OK: backend={payload.get("backend")}, run={run}, '
        f'ageHours={payload.get("ageHours")}, points={payload.get("pointCount")}, '
        f'epsMembers={payload.get("epsMemberCount")}, probe={attempt}/{a.attempts}'
    )
    print('MID RUC codec evidence: ' + json.dumps(codec_evidence(payload, meta), sort_keys=True))
    if meta.get('storageProfile')=='pages-lossless-v1':
        full=full_codec_evidence(payload,meta)
        if not full['verified']:raise RuntimeError('productively compressed RUC profile did not pass actual Worker record reads')
        print('MID RUC full codec evidence: '+json.dumps(full,sort_keys=True))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f'MID RUC health FAILED: {error}', file=sys.stderr)
        raise SystemExit(2)

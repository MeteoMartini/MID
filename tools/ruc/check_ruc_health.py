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


def check(payload: dict, run: str) -> None:
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
    if int(payload.get('timeCount') or 0) < 4 or int(payload.get('pointCount') or 0) < 1 or int(payload.get('epsMemberCount') or 0) < 2:
        raise RuntimeError('worker RUC metadata counts are incomplete')


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
) -> tuple[dict, int]:
    attempts = max(1, int(attempts))
    retry_delay = max(0.0, float(retry_delay))
    max_retry_delay = max(retry_delay, float(max_retry_delay))
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            payload = fetcher(probe_url(url, run, attempt), timeout)
            check(payload, run)
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
    p.add_argument('--timeout', type=float, default=15)
    p.add_argument('--attempts', type=int, default=7)
    p.add_argument('--retry-delay', type=float, default=8)
    p.add_argument('--max-retry-delay', type=float, default=30)
    a = p.parse_args()
    run = expected_run(a.meta)
    url = health_url(a.url)
    payload, attempt = probe_until_ready(
        url,
        run,
        timeout=a.timeout,
        attempts=a.attempts,
        retry_delay=a.retry_delay,
        max_retry_delay=a.max_retry_delay,
    )
    print(
        f'MID RUC health OK: backend={payload.get("backend")}, run={run}, '
        f'ageHours={payload.get("ageHours")}, points={payload.get("pointCount")}, '
        f'epsMembers={payload.get("epsMemberCount")}, probe={attempt}/{a.attempts}'
    )
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f'MID RUC health FAILED: {error}', file=sys.stderr)
        raise SystemExit(2)

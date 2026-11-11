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
from datetime import datetime, timezone
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Public Pages edges can still serve the preceding run after deploy-pages
# succeeds (observed in the 16Z/19Z incidents on 2026-11-10). Allow bounded
# propagation time before declaring non-convergence; never accept a stale run.
MAX_PAGES_PROBE_ATTEMPTS = 18
MAX_WORKER_PROBE_ATTEMPTS = 7
MAX_PROBE_JOURNAL_RECORDS = 64
SAFE_DIAGNOSTIC_CODES = {
    'codec_defect_proven',
    'codec_evidence_unclassified',
    'invalid_json',
    'pages_convergence_timeout',
    'pages_http_error',
    'pages_pointer_not_converged',
    'pages_profile_mismatch',
    'pages_run_mismatch',
    'payload_not_object',
    'probe_timeout',
    'probe_transport_failed',
    'ruc_health_error',
    'snapshot_axis_invalid',
    'snapshot_grid_invalid',
    'snapshot_member_or_point_count_invalid',
    'snapshot_pages_dimensions_mismatch',
    'snapshot_pages_manifest_mismatch',
    'snapshot_pages_proof_missing',
    'snapshot_profile_inactive',
    'snapshot_rollback_profile_invalid',
    'snapshot_run_invalid',
    'snapshot_schema_invalid',
    'snapshot_worker_dimensions_mismatch',
    'snapshot_worker_run_mismatch',
    'snapshot_contract_invalid',
    'unclassified_probe_error',
    'worker_counts_incomplete',
    'worker_eps_object_missing',
    'worker_http_error',
    'worker_not_adopted',
    'worker_not_converged',
    'worker_object_missing',
    'worker_pages_profile_invalid',
    'worker_payload_error',
    'worker_readiness_failed',
    'worker_run_mismatch',
    'worker_transport_error',
}


class RucHealthError(RuntimeError):
    default_code = 'ruc_health_error'

    def __init__(self, message: str, *, code: str | None = None,
                 http_status: int | None = None, metadata: dict | None = None,
                 attempts: int | None = None):
        super().__init__(message)
        self.code = code or self.default_code
        self.safe_message = message
        self.http_status = http_status
        self.metadata = metadata or {}
        self.attempts = attempts

    def after_attempts(self, attempts: int):
        return type(self)(
            f'{self.safe_message}; did not converge after {attempts} attempts',
            code=self.code,
            http_status=self.http_status,
            metadata=self.metadata,
            attempts=attempts,
        )


class PagesConvergenceError(RucHealthError):
    default_code = 'pages_pointer_not_converged'


class SnapshotContractError(RucHealthError):
    default_code = 'snapshot_contract_invalid'


class WorkerHTTPError(RucHealthError):
    default_code = 'worker_http_error'


class WorkerTransportError(RucHealthError):
    default_code = 'worker_transport_error'


class WorkerPayloadError(RucHealthError):
    default_code = 'worker_payload_error'


class WorkerAdoptionError(RucHealthError):
    default_code = 'worker_not_adopted'


class CodecDefectError(RucHealthError):
    default_code = 'codec_defect_proven'


def _emit_rollback_admission(error: RucHealthError | None, *,
                             pages_verified: bool, full_profile: bool) -> None:
    """Fail-closed, runner-local verdict. Never infer codec failure from a stale URL."""
    target = os.environ.get('GITHUB_OUTPUT')
    if not target:
        return
    code = (error.code if isinstance(error, RucHealthError) and
            error.code in SAFE_DIAGNOSTIC_CODES else 'unclassified_probe_error')
    # Only an independently raised, typed and proven codec defect *after*
    # strict public same-run Pages convergence may admit legacy raw recovery.
    # No current probe raises this class merely from worker non-readiness.
    allowed = (pages_verified is True and full_profile is True and
               type(error) is CodecDefectError and code == 'codec_defect_proven')
    try:
        with open(target, 'a', encoding='utf-8') as out:
            out.write('health_failure_code=' + code + '\n')
            out.write('rollback_admitted=' + ('true' if allowed else 'false') + '\n')
    except OSError:
        # Missing output itself prevents rollback. Preserve the health exit 2.
        pass


class _HTTPProbeFailure(Exception):
    def __init__(self, status: int, metadata: dict):
        self.status = status
        self.metadata = metadata


class _InvalidProbePayload(Exception):
    pass


class ProbeResponse:
    def __init__(self, payload, status: int | None = None, metadata: dict | None = None):
        self.payload = payload
        self.status = status
        self.metadata = metadata


def _safe_response_metadata(headers) -> dict:
    if headers is None:
        return {}
    metadata = {}
    if isinstance(headers, dict) and any(
        key in headers for key in ('ageSeconds', 'cacheStatus', 'contentType')
    ):
        age_seconds = headers.get('ageSeconds')
        if type(age_seconds) is int and 0 <= age_seconds <= 999_999_999:
            metadata['ageSeconds'] = age_seconds
        cache_status = headers.get('cacheStatus')
        if isinstance(cache_status, str) and cache_status in {
            'hit', 'miss', 'expired', 'stale', 'bypass', 'dynamic',
            'revalidated', 'updating', 'uncacheable',
        }:
            metadata['cacheStatus'] = cache_status
        content_type = headers.get('contentType')
        if content_type in {'json', 'other'}:
            metadata['contentType'] = content_type
        return metadata
    age = headers.get('Age')
    if isinstance(age, str) and age.isascii() and age.isdecimal() and len(age) <= 9:
        metadata['ageSeconds'] = int(age)
    cache_status = headers.get('CF-Cache-Status') or headers.get('X-Cache')
    if isinstance(cache_status, str):
        token = cache_status.strip().upper()
        if token in {'HIT', 'MISS', 'EXPIRED', 'STALE', 'BYPASS', 'DYNAMIC',
                     'REVALIDATED', 'UPDATING', 'UNCACHEABLE'}:
            metadata['cacheStatus'] = token.lower()
    content_type = headers.get('Content-Type')
    if isinstance(content_type, str):
        metadata['contentType'] = (
            'json' if content_type.split(';', 1)[0].strip().lower() == 'application/json'
            else 'other'
        )
    return metadata


class ProbeJournal:
    @staticmethod
    def _safe_public_run(value: object) -> str:
        """Report only canonical public UTC model-run labels, never arbitrary JSON."""
        if value is None:
            return 'unavailable'
        if not isinstance(value, str):
            return 'unrecognized'
        for fmt in ('%Y-%m-%dT%H:%M', '%Y%m%d%H'):
            try:
                if datetime.strptime(value, fmt).strftime(fmt) == value:
                    return value
            except ValueError:
                pass
        return 'unrecognized'

    def __init__(self):
        self.records = []

    def record(self, *, attempt: int, phase: str, run: str, status: int | None,
               metadata: dict | None = None, diagnostic_code: str | None = None,
               observed_run: object = None, observed_profile: object = None):
        if len(self.records) >= MAX_PROBE_JOURNAL_RECORDS:
            return
        safe_run = run if isinstance(run, str) and re.fullmatch(
            r'(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}|\d{10})', run
        ) else 'unavailable'
        record = {
            'utc': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
            'attempt': max(0, int(attempt)),
            'phase': phase if phase in {'pages_pointer', 'worker_adoption'} else 'unclassified',
            'run': safe_run,
            'httpStatus': status if type(status) is int and 100 <= status <= 599 else None,
            'metadata': _safe_response_metadata(metadata or {}),
            'diagnosticCode': diagnostic_code if isinstance(diagnostic_code, str)
            and diagnostic_code in SAFE_DIAGNOSTIC_CODES else 'unclassified',
        }
        if phase == 'pages_pointer':
            record['observedRun'] = self._safe_public_run(observed_run)
            record['observedStorageProfile'] = (
                observed_profile
                if isinstance(observed_profile, str) and observed_profile in {
                    'pages-lossless-v1', 'pages-free-v1', 'pages-codec-staging-v1'
                }
                else 'unavailable' if observed_profile is None else 'unrecognized'
            )
        self.records.append(record)

    def as_dict(self) -> dict:
        return {
            'schema': 'mid.ruc.health-probe-journal.v1',
            'deploymentId': 'unavailable',
            'records': list(self.records),
        }


def _response_metadata(response: ProbeResponse) -> dict:
    return _safe_response_metadata(response.metadata or {})


def _fetch_for_probe(fetcher, url: str, timeout: float, phase: str) -> ProbeResponse:
    try:
        result = fetcher(url, timeout)
    except _InvalidProbePayload:
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerPayloadError
        raise error_type('Probe response is not valid JSON', code='invalid_json') from None
    except _HTTPProbeFailure as error:
        if phase == 'pages_pointer':
            raise PagesConvergenceError(
                'Pages request returned a non-success HTTP status',
                code='pages_http_error', http_status=error.status, metadata=error.metadata,
            ) from None
        raise WorkerHTTPError(
            'Worker request returned a non-success HTTP status',
            http_status=error.status, metadata=error.metadata,
        ) from None
    except urllib.error.HTTPError as error:
        metadata = _safe_response_metadata(error.headers)
        if phase == 'pages_pointer':
            raise PagesConvergenceError(
                'Pages request returned a non-success HTTP status',
                code='pages_http_error', http_status=error.code, metadata=metadata,
            ) from None
        raise WorkerHTTPError(
            'Worker request returned a non-success HTTP status',
            http_status=error.code, metadata=metadata,
        ) from None
    except (TimeoutError, socket.timeout):
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerTransportError
        raise error_type('Probe timed out', code='probe_timeout') from None
    except (urllib.error.URLError, OSError, ConnectionError):
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerTransportError
        raise error_type('Probe transport failed', code='probe_transport_failed') from None
    except RucHealthError:
        raise
    except Exception:
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerTransportError
        raise error_type('Probe failed with an unclassified error',
                         code='unclassified_probe_error') from None

    if isinstance(result, ProbeResponse):
        response = result
    elif isinstance(result, dict):
        response = ProbeResponse(result)
    else:
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerPayloadError
        raise error_type('Probe response is not a JSON object',
                         code='payload_not_object')
    if not isinstance(response.payload, dict):
        error_type = PagesConvergenceError if phase == 'pages_pointer' else WorkerPayloadError
        raise error_type('Probe response is not a JSON object',
                         code='payload_not_object', http_status=response.status,
                         metadata=_response_metadata(response))
    return response


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
    try:
        data = json.loads(Path(meta_path).read_text(encoding='utf-8'))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        raise SnapshotContractError('Local RUC metadata is unavailable or invalid') from None
    if not isinstance(data, dict) or data.get('schema') != 'mid.dwd.ruc.grid.v2' or not data.get('run'):
        raise SnapshotContractError('Local RUC metadata is unavailable or invalid')
    return str(data['run'])


def verified_snapshot_contract(meta: dict, *, allow_legacy_rollback: bool = False) -> dict:
    """Check the immutable 27 h model axes and native geometry before public readback.

    The candidate is already SHA-sealed by the producer. Here we require exact
    typed dimensions rather than treating a partly decoded snapshot as healthy.
    """
    from datetime import datetime, timedelta
    if not isinstance(meta, dict) or meta.get('schema') != 'mid.dwd.ruc.grid.v2':
        raise SnapshotContractError('RUC snapshot metadata schema is invalid',
                                    code='snapshot_schema_invalid')
    run = meta.get('run')
    try:
        if not isinstance(run, str) or len(run) != 16:
            raise ValueError('invalid run')
        base = datetime.strptime(run, '%Y-%m-%dT%H:%M')
        if base.strftime('%Y-%m-%dT%H:%M') != run:
            raise ValueError('noncanonical run')
    except ValueError:
        raise SnapshotContractError('RUC snapshot model initialization is invalid',
                                    code='snapshot_run_invalid') from None
    # A legacy 14 h raw rollback exists for the rare full-codec-activation
    # failure. It is allowed ONLY in the separately gated rollback workflow.
    if allow_legacy_rollback:
        pages = meta.get('pages')
        if (meta.get('storageProfile') != 'pages-free-v1' or
                not isinstance(pages, dict) or pages.get('profile') != 'pages-free-v1' or
                pages.get('nativeEpsMembers') is not False):
            raise SnapshotContractError('RUC legacy rollback profile is not verified',
                                        code='snapshot_rollback_profile_invalid')
    hours = 14 if allow_legacy_rollback else 27
    axis = [(base + timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(hours + 1)]
    for label, times in (
        ('times', meta.get('times')),
        ('deterministic.times', meta.get('deterministic', {}).get('times') if isinstance(meta.get('deterministic'), dict) else None),
        ('epsSummary.times', meta.get('epsSummary', {}).get('times') if isinstance(meta.get('epsSummary'), dict) else None),
        ('eps.times', meta.get('eps', {}).get('times') if isinstance(meta.get('eps'), dict) else None),
    ):
        if not isinstance(times, list) or times != axis:
            raise SnapshotContractError(
                f'RUC snapshot {label} is not complete 0..+{hours}h UTC hourly',
                code='snapshot_axis_invalid',
            )
    points = meta.get('pointCount')
    members = (meta.get('eps') or {}).get('memberCount') if isinstance(meta.get('eps'), dict) else None
    grid = meta.get('grid')
    if type(points) is not int or points < 1 or type(members) is not int or members != 20:
        raise SnapshotContractError('RUC snapshot point/member dimensions are invalid',
                                    code='snapshot_member_or_point_count_invalid')
    if not isinstance(grid, dict) or type(grid.get('nativePointCount')) is not int or grid['nativePointCount'] != points:
        raise SnapshotContractError('RUC snapshot native-grid dimensions are invalid',
                                    code='snapshot_grid_invalid')
    return {'run': run, 'timeCount': len(axis), 'pointCount': points,
            'epsMemberCount': members, 'times': axis, 'grid': grid}


def check(payload: dict, run: str, *, expected_contract: dict | None = None) -> None:
    if not isinstance(payload, dict):
        raise WorkerPayloadError('Worker response is not a JSON object',
                                 code='payload_not_object')
    required={'configured':True,'ready':True,'fresh':True,'schemaValid':True}
    for key, value in required.items():
        if payload.get(key) is not value:
            raise WorkerAdoptionError(
                f'Worker RUC readiness field {key} is not healthy',
                code='worker_readiness_failed',
            )
    if str(payload.get('run','')) != run:
        raise WorkerAdoptionError('Worker RUC run does not match the published run',
                                  code='worker_run_mismatch')
    objects = payload.get('objectsPresent') or {}
    if not isinstance(objects, dict):
        objects = {}
    for key in ('lookup', 'deterministic', 'epsSummary'):
        if objects.get(key) is not True:
            raise WorkerAdoptionError(f'Worker RUC object {key} is not present',
                                      code='worker_object_missing')
    backend_value = payload.get('backend')
    backend = backend_value if isinstance(backend_value, str) else ''
    if backend == 'r2' and objects.get('epsMembers') is not True:
        raise WorkerAdoptionError('Worker RUC native EPS object is not present for R2 backend',
                                  code='worker_eps_object_missing')
    if backend == 'pages' and payload.get('nativeEpsMembers') is not False:
        raise WorkerAdoptionError('GitHub Pages free profile did not explicitly omit native EPS members',
                                  code='worker_pages_profile_invalid')
    if expected_contract is None:
        counts = (payload.get('timeCount'), payload.get('pointCount'), payload.get('epsMemberCount'))
        if any(type(value) is not int for value in counts) or counts[0] < 4 or counts[1] < 1 or counts[2] < 2:
            raise WorkerAdoptionError('Worker RUC metadata counts are incomplete',
                                      code='worker_counts_incomplete')
    else:
        if run != expected_contract['run']:
            raise SnapshotContractError('Worker RUC run differs from the sealed local manifest',
                                        code='snapshot_worker_run_mismatch')
        for name in ('timeCount', 'pointCount', 'epsMemberCount'):
            received = payload.get(name)
            if type(received) is not int or received != expected_contract[name]:
                raise SnapshotContractError(
                    f'Worker RUC {name} differs from the sealed snapshot',
                    code='snapshot_worker_dimensions_mismatch',
                )


def fetch_payload(url: str, timeout: float) -> dict:
    """Compatibility wrapper for callers that only need the JSON payload."""
    try:
        return fetch_probe(url, timeout).payload
    except _HTTPProbeFailure as error:
        raise WorkerHTTPError('Worker request returned a non-success HTTP status',
                              http_status=error.status,
                              metadata=error.metadata) from None
    except _InvalidProbePayload:
        raise WorkerPayloadError('Worker response is not valid JSON',
                                 code='invalid_json') from None


def fetch_probe(url: str, timeout: float) -> ProbeResponse:
    req = urllib.request.Request(
        url,
        headers={
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'MID-RUC-health-check/2',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.status
            metadata = _safe_response_metadata(response.headers)
            if status != 200:
                raise _HTTPProbeFailure(status, metadata)
            body = response.read()
    except urllib.error.HTTPError as error:
        raise _HTTPProbeFailure(error.code, _safe_response_metadata(error.headers)) from None
    try:
        payload = json.loads(body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise _InvalidProbePayload from None
    if not isinstance(payload, dict):
        return ProbeResponse(payload, status, metadata)
    return ProbeResponse(payload, status, metadata)


def codec_evidence(payload: dict, meta: dict) -> dict:
    """Report codec adoption separately from the strict, rollback-safe raw gate.

    A successful base health check is not proof that a codec was decoded.  Keep
    absent, disabled and raw-fallback states visible without turning the optional
    pilot into a prerequisite for serving the preserved raw product.
    """
    pages = meta.get('pages') if isinstance(meta.get('pages'), dict) else {}
    published = pages.get('losslessTransport')
    published = published if isinstance(published, dict) else {}
    pilot = payload.get('codecPilot')
    pilot = pilot if isinstance(pilot, dict) else {}
    expected = published.get('mode') == 'dual-read-pilot'
    boolean_field = lambda value: value if type(value) is bool else None
    transport = pilot.get('transport')
    transport = transport if isinstance(transport, str) and transport in {
        'byteplanes-gzip', 'raw', 'unavailable'
    } else 'unavailable'
    added_bytes = published.get('addedBytes')
    chunk_index = pilot.get('chunkIndex')
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
        'addedBytes': added_bytes if type(added_bytes) is int and added_bytes >= 0 else None,
        'advertised': boolean_field(pilot.get('advertised')),
        'readEnabled': boolean_field(pilot.get('readEnabled')),
        'verified': verified,
        'transport': transport,
        'chunkIndex': chunk_index if type(chunk_index) is int and chunk_index >= 0 else None,
        'rawRetained': boolean_field(pilot.get('rawRetained')),
    }


def active_profile_valid(meta: dict) -> bool:
    migration = meta.get('migration') if isinstance(meta, dict) else None
    pages = meta.get('pages') if isinstance(meta, dict) else None
    return bool(isinstance(meta, dict) and isinstance(migration, dict)
                and isinstance(pages, dict)
                and meta.get('schema') == 'mid.dwd.ruc.grid.v2'
                and meta.get('storageProfile') == 'pages-lossless-v1'
                and migration.get('schema') == 'mid.ruc.migration-active.v1'
                and migration.get('productionEnabled') is True
                and pages.get('profile') == 'pages-lossless-v1'
                and pages.get('losslessTransport') == {
                    'profile': 'mid.ruc.compressed-pages.v1',
                    'mode': 'replacement',
                    'rawRetained': False,
                })

def full_codec_evidence(payload:dict,meta:dict)->dict:
    expected=active_profile_valid(meta)
    full=payload.get('fullCodec') if isinstance(payload.get('fullCodec'),dict) else {}
    verified=bool(expected and payload.get('run')==meta.get('run')
                  and payload.get('storageProfile')=='pages-lossless-v1'
                  and full.get('advertised') is True and full.get('verified') is True
                  and full.get('rawRetained') is False)
    advertised = full.get('advertised')
    raw_retained = full.get('rawRetained')
    return {'run':str(meta.get('run','')),'published':expected,'verified':verified,
            'advertised':advertised if type(advertised) is bool else None,
            'rawRetained':raw_retained if type(raw_retained) is bool else None}

def probe_pages(base: str, run: str, *, attempts=MAX_PAGES_PROBE_ATTEMPTS, fetcher=None, sleeper=time.sleep, expected_profile='pages-free-v1', expected_contract: dict | None = None, expected_manifest: dict | None = None, allow_legacy_rollback: bool = False, journal: ProbeJournal | None = None) -> int:
    """Prove public Pages convergence separately from Worker adoption."""
    url = urllib.parse.urljoin(base.rstrip('/') + '/', 'latest.json')
    last_error = None
    attempts = min(MAX_PAGES_PROBE_ATTEMPTS, max(1, int(attempts)))
    journal = journal or ProbeJournal()
    fetcher = fetcher or fetch_probe
    for attempt in range(1, attempts + 1):
        response = None
        try:
            response = _fetch_for_probe(
                fetcher, probe_url(url, run, attempt), 15, 'pages_pointer'
            )
            meta = response.payload
            if meta.get('schema') != 'mid.dwd.ruc.grid.v2' or meta.get('storageProfile') != expected_profile or (expected_profile == 'pages-lossless-v1' and not active_profile_valid(meta)):
                raise PagesConvergenceError('Pages RUC metadata schema/profile is invalid',
                                            code='pages_profile_mismatch')
            if meta.get('run') != run:
                raise PagesConvergenceError('Pages RUC run does not match the expected publication',
                                            code='pages_run_mismatch')
            if expected_contract is not None:
                if verified_snapshot_contract(meta, allow_legacy_rollback=allow_legacy_rollback) != expected_contract:
                    raise SnapshotContractError(
                        'Pages RUC dimensions or validity axes differ from the sealed snapshot',
                        code='snapshot_pages_dimensions_mismatch',
                    )
            # Dimensions alone do not bind the original object SHA inventory,
            # codec proof, or Pages byte budget. Compare the complete sealed
            # JSON manifest after public convergence, not merely its model run.
            # Canonical typed JSON avoids false passes for e.g. 1 == True.
            if expected_manifest is not None:
                try:
                    published_json = json.dumps(meta, sort_keys=True, separators=(',', ':'),
                                                allow_nan=False)
                    sealed_json = json.dumps(expected_manifest, sort_keys=True,
                                             separators=(',', ':'), allow_nan=False)
                except (TypeError, ValueError):
                    raise SnapshotContractError(
                        'Pages RUC manifest is not canonical JSON',
                        code='snapshot_pages_manifest_mismatch',
                    ) from None
                if published_json != sealed_json:
                    raise SnapshotContractError(
                        'Pages RUC manifest differs from the sealed snapshot',
                        code='snapshot_pages_manifest_mismatch',
                    )
            journal.record(attempt=attempt, phase='pages_pointer', run=run,
                           status=response.status, metadata=_response_metadata(response),
                           observed_run=meta.get('run'),
                           observed_profile=meta.get('storageProfile'))
            return attempt
        except RucHealthError as error:
            last_error = error
            observed = response.payload if response is not None else {}
            journal.record(
                attempt=attempt, phase='pages_pointer', run=run,
                status=response.status if response else error.http_status,
                metadata=_response_metadata(response) if response else error.metadata,
                diagnostic_code=error.code,
                observed_run=observed.get('run'),
                observed_profile=observed.get('storageProfile'),
            )
            if attempt < attempts:
                delay = min(30, 8 * 1.5 ** (attempt - 1))
                print(
                    f'MID RUC Pages not converged ({attempt}/{attempts}) [{error.code}]; '
                    f'retry in {delay:.0f}s',
                    file=sys.stderr,
                )
                sleeper(delay)
    if isinstance(last_error, SnapshotContractError):
        raise last_error.after_attempts(attempts)
    raise PagesConvergenceError(
        f'pages-publication: public RUC metadata did not converge after {attempts} attempts',
        code='pages_convergence_timeout',
        http_status=last_error.http_status if last_error else None,
        metadata=last_error.metadata if last_error else None,
        attempts=attempts,
    ) from None


def probe_until_ready(
    url: str,
    run: str,
    *,
    timeout: float = 15,
    attempts: int = 7,
    retry_delay: float = 8,
    max_retry_delay: float = 30,
    fetcher=None,
    sleeper=time.sleep,
    expected_contract: dict | None = None,
    journal: ProbeJournal | None = None,
) -> tuple[dict, int]:
    attempts = min(MAX_WORKER_PROBE_ATTEMPTS, max(1, int(attempts)))
    retry_delay = max(0.0, float(retry_delay))
    max_retry_delay = max(retry_delay, float(max_retry_delay))
    last_error: Exception | None = None
    journal = journal or ProbeJournal()
    fetcher = fetcher or fetch_probe

    for attempt in range(1, attempts + 1):
        response = None
        try:
            response = _fetch_for_probe(
                fetcher, probe_url(url, run, attempt), timeout, 'worker_adoption'
            )
            check(response.payload, run, expected_contract=expected_contract)
            journal.record(attempt=attempt, phase='worker_adoption', run=run,
                           status=response.status, metadata=_response_metadata(response))
            return response.payload, attempt
        except RucHealthError as error:  # strict final gate; only timing is retried
            last_error = error
            journal.record(
                attempt=attempt, phase='worker_adoption', run=run,
                status=response.status if response else error.http_status,
                metadata=_response_metadata(response) if response else error.metadata,
                diagnostic_code=error.code,
            )
            if attempt >= attempts:
                break
            delay = min(max_retry_delay, retry_delay * (1.5 ** (attempt - 1)))
            print(
                f'MID RUC health not converged ({attempt}/{attempts}) [{error.code}]; '
                f'retry in {delay:.0f}s',
                file=sys.stderr,
            )
            sleeper(delay)

    if isinstance(last_error, RucHealthError):
        raise type(last_error)(
            f'worker RUC health did not converge after {attempts} attempts ({last_error.code})',
            code=last_error.code,
            http_status=last_error.http_status,
            metadata=last_error.metadata,
            attempts=attempts,
        ) from None
    raise WorkerAdoptionError(
        f'Worker RUC health did not converge after {attempts} attempts',
        code='worker_not_converged', attempts=attempts,
    ) from None


def main(argv=None) -> int:
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
    a = p.parse_args(argv)
    if not 1 <= a.pages_attempts <= MAX_PAGES_PROBE_ATTEMPTS:
        p.error(f'--pages-attempts must be between 1 and {MAX_PAGES_PROBE_ATTEMPTS}')
    if not 1 <= a.attempts <= MAX_WORKER_PROBE_ATTEMPTS:
        p.error(f'--attempts must be between 1 and {MAX_WORKER_PROBE_ATTEMPTS}')
    journal = ProbeJournal()
    pages_verified = False
    full_profile = False
    try:
        run = expected_run(a.meta)
        try:
            meta = json.loads(Path(a.meta).read_text(encoding='utf-8'))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            raise SnapshotContractError('Local RUC metadata is unavailable or invalid') from None
        expected_contract = verified_snapshot_contract(meta, allow_legacy_rollback=a.legacy_rollback)
        full_profile = (meta.get('storageProfile') == 'pages-lossless-v1' and active_profile_valid(meta))
        if meta.get('storageProfile') == 'pages-lossless-v1' and not active_profile_valid(meta):
            raise SnapshotContractError('Full RUC profile has not been explicitly activated',
                                        code='snapshot_profile_inactive')
        # A healthy Worker response alone cannot prove public same-run Pages
        # convergence. Full-codec publication must never pass without the
        # independently checked Pages pointer and sealed dimensions.
        if full_profile and not a.pages_base:
            raise SnapshotContractError(
                'Active full RUC profile requires public Pages pointer verification',
                code='snapshot_pages_proof_missing',
            )
        url = health_url(a.url)
        if a.pages_base:
            page_attempt = probe_pages(
                a.pages_base, run, attempts=a.pages_attempts,
                expected_profile=meta.get('storageProfile', 'pages-free-v1'),
                expected_contract=expected_contract, expected_manifest=meta,
                allow_legacy_rollback=a.legacy_rollback, journal=journal,
            )
            pages_verified = True
            print(f'MID RUC Pages publication OK: run={run}, probe={page_attempt}')
        payload, attempt = probe_until_ready(
            url,
            run,
            timeout=a.timeout,
            attempts=a.attempts,
            retry_delay=a.retry_delay,
            max_retry_delay=a.max_retry_delay,
            expected_contract=expected_contract,
            journal=journal,
        )
        backend = payload.get('backend')
        backend = backend if isinstance(backend, str) and backend in {'pages', 'r2'} else 'unavailable'
        age = payload.get('ageHours')
        age = age if type(age) in {int, float} else None
        points = payload.get('pointCount') if type(payload.get('pointCount')) is int else None
        members = payload.get('epsMemberCount') if type(payload.get('epsMemberCount')) is int else None
        print(
            f'MID RUC health OK: backend={backend}, run={run}, ageHours={age}, '
            f'points={points}, epsMembers={members}, probe={attempt}/{a.attempts}'
        )
        print('MID RUC codec evidence: ' + json.dumps(codec_evidence(payload, meta), sort_keys=True))
        if meta.get('storageProfile') == 'pages-lossless-v1':
            full = full_codec_evidence(payload, meta)
            if not full['verified']:
                raise WorkerAdoptionError(
                    'Full-codec adoption is not verified; available health fields do not prove a codec defect',
                    code='codec_evidence_unclassified',
                )
            print('MID RUC full codec evidence: ' + json.dumps(full, sort_keys=True))
        print('MID RUC probe journal: ' + json.dumps(journal.as_dict(), sort_keys=True))
        return 0
    except RucHealthError as error:
        _emit_rollback_admission(error, pages_verified=pages_verified, full_profile=full_profile)
        print('MID RUC probe journal: ' + json.dumps(journal.as_dict(), sort_keys=True),
              file=sys.stderr)
        print(f'MID RUC health FAILED: {error.code}', file=sys.stderr)
        return 2
    except Exception:
        _emit_rollback_admission(None, pages_verified=pages_verified, full_profile=full_profile)
        print('MID RUC probe journal: ' + json.dumps(journal.as_dict(), sort_keys=True),
              file=sys.stderr)
        print('MID RUC health FAILED: unclassified', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())

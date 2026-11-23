#!/usr/bin/env python3
"""Read-only targeted original DWD RUC-EPS index QA for decoder gap tuples.

This is NOT GRIB/EPS20 admission. It never downloads GRIB, dispatches or publishes.
Use only for fresh run/member/hour tuples from a real failed pipeline log.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeout
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
import json
import re
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import Request, urlopen

ORIGIN = 'https://opendata.dwd.de'
ROOT = ORIGIN + '/weather/nwp/v1/m/icon-d2-ruc-eps/p/TOT_PREC/r/'
RUN_RE = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
FILENAME_RE = re.compile(r'^PT(?P<h>\d{3})H(?P<m>\d{2})M\.grib2$', re.I)
MAX_BODY_BYTES = 2_000_000
MAX_CASES = 8
MAX_WORKERS = 4
TIMEOUT_SECONDS = 4
WALL_BUDGET_SECONDS = 14


class Anchors(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            href = dict(attrs).get('href')
            if isinstance(href, str):
                self.hrefs.append(href)


def run_epoch(run):
    if not isinstance(run, str) or not RUN_RE.fullmatch(run):
        raise ValueError('invalid canonical UTC run')
    parsed = datetime.strptime(run, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    if parsed.strftime('%Y-%m-%dT%H:%M') != run:
        raise ValueError('invalid calendar run')
    return parsed


def parse_case(value):
    """Input format: 2026-11-23T11:00,09,002 (init, member, lead hours)."""
    if not isinstance(value, str):
        raise ValueError('invalid case')
    parts = value.split(',')
    if len(parts) != 3:
        raise ValueError('expected UTC-run,member,lead-hours')
    run = parts[0]
    run_epoch(run)
    if not re.fullmatch(r'(0[1-9]|1[0-9]|20)', parts[1]):
        raise ValueError('expected two-digit member 01..20')
    if not re.fullmatch(r'(00[0-9]|01[0-9]|02[0-7])', parts[2]):
        raise ValueError('expected three-digit UTC lead 000..027')
    return {'run': run, 'member': int(parts[1]), 'leadHours': int(parts[2])}


def validate_cases(cases, observed_at):
    if not isinstance(cases, list) or not 1 <= len(cases) <= MAX_CASES:
        raise ValueError('case count out of bounds')
    if not isinstance(observed_at, datetime) or observed_at.tzinfo is None:
        raise ValueError('observation must be timezone-aware')
    now = observed_at.astimezone(timezone.utc)
    checked = set()
    runs = set()
    for row in cases:
        if not isinstance(row, dict) or set(row) != {'run', 'member', 'leadHours'}:
            raise ValueError('untrusted case shape')
        run = run_epoch(row['run'])
        member = row['member']
        lead = row['leadHours']
        if type(member) is not int or not 1 <= member <= 20 or type(lead) is not int or not 0 <= lead <= 27:
            raise ValueError('invalid member/lead')
        age = (now - run).total_seconds() / 60
        if not -5 <= age <= 240:
            raise ValueError('case outside original four-hour freshness window')
        key = (row['run'], member, lead)
        if key in checked:
            raise ValueError('duplicate tuple')
        checked.add(key)
        runs.add(row['run'])
    if len(runs) > 2:
        raise ValueError('too many model runs')
    return now


def index_url(run, member):
    run_epoch(run)
    if type(member) is not int or not 1 <= member <= 20:
        raise ValueError('invalid member')
    return ROOT + run + f'/e/{member:02d}/s/'


def read_original_index(url):
    """Fixed DWD origin, maximum response bytes BEFORE UTF-8 decoding."""
    if not isinstance(url, str) or not url.startswith(ROOT):
        raise ValueError('unexpected original index URL')
    parts = urlsplit(url)
    if parts.scheme != 'https' or parts.netloc != 'opendata.dwd.de' or parts.query or parts.fragment:
        raise ValueError('untrusted index origin')
    req = Request(url, headers={'Accept': 'text/html', 'User-Agent': 'MID-Data13-RUC-EPS-targeted-gap/1'})
    with urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        resolved = urlsplit(response.geturl())
        if (response.status != 200 or resolved.scheme != 'https' or resolved.netloc != parts.netloc
                or unquote(resolved.path) != unquote(parts.path) or resolved.query or resolved.fragment):
            raise ValueError('noncanonical source response')
        declared = response.headers.get('Content-Length')
        if declared is not None and (not declared.isdecimal() or int(declared) > MAX_BODY_BYTES):
            raise ValueError('untrusted response Content-Length')
        payload = response.read(MAX_BODY_BYTES + 1)
        if len(payload) > MAX_BODY_BYTES:
            raise ValueError('source index byte limit exceeded')
    return payload.decode('utf-8', errors='strict')


def classify_index(body, directory, lead):
    """Only advertised names, never original GRIB existence or integrity."""
    if not isinstance(body, str) or len(body.encode('utf-8')) > MAX_BODY_BYTES:
        raise ValueError('unbounded source HTML')
    if not isinstance(directory, str) or not directory.startswith(ROOT) or not directory.endswith('/s/'):
        raise ValueError('unexpected DWD directory')
    if type(lead) is not int or not 0 <= lead <= 27:
        raise ValueError('invalid lead')
    anchors = Anchors()
    anchors.feed(body)
    names = set()
    grib_count = 0
    for href in anchors.hrefs:
        if href in ('../', './') or href.startswith(('?', '#')):
            continue  # Apache parent/sort metadata only
        resolved = urlsplit(urljoin(directory, href))
        if (resolved.scheme != 'https' or resolved.netloc != 'opendata.dwd.de'
                or resolved.query or resolved.fragment or not unquote(resolved.path).startswith(unquote(urlsplit(directory).path))):
            raise ValueError('foreign or altered DWD href')
        suffix = unquote(resolved.path)[len(unquote(urlsplit(directory).path)):]
        match = FILENAME_RE.fullmatch(suffix)
        if not match:
            raise ValueError('unknown original index format')
        h, minute = int(match['h']), int(match['m'])
        if h > 27 or minute >= 60 or minute % 5 != 0 or (h == 27 and minute != 0):
            raise ValueError('unexpected original time step')
        if suffix.upper() in names:
            raise ValueError('duplicate advertised original file')
        names.add(suffix.upper())
        grib_count += 1
    if grib_count == 0:
        raise ValueError('empty index is not absence proof')
    expected = f'PT{lead:03d}H00M.GRIB2'
    return {'directoryStatus': 'ADVERTISED' if expected in names else 'NOT_ADVERTISED',
            'hourlyNames': sum(bool(re.fullmatch(r'PT\d{3}H00M\.GRIB2', name)) for name in names),
            'totalGribNames': grib_count}


def probe(cases, *, observed_at=None, fetch_index=read_original_index):
    observed_at = observed_at or datetime.now(timezone.utc)
    now = validate_cases(cases, observed_at)
    unique = {(c['run'], c['member']) for c in cases}
    results = {}
    # At most 8 source indexes and 4 concurrent requests, no retries or writes.
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(unique))) as pool:
        futures = {pool.submit(fetch_index, index_url(run, member)): (run, member)
                   for run, member in sorted(unique)}
        try:
            for future in as_completed(futures, timeout=WALL_BUDGET_SECONDS):
                key = futures[future]
                try:
                    results[key] = future.result()
                except Exception:
                    results[key] = None
        except FuturesTimeout:
            pass
        for future, key in futures.items():
            if key not in results:
                future.cancel()
                results[key] = None
    observations = []
    for c in cases:
        directory = index_url(c['run'], c['member'])
        source = results[(c['run'], c['member'])]
        try:
            inspected = classify_index(source, directory, c['leadHours']) if source is not None else None
        except (ValueError, UnicodeError):
            inspected = None
        status = inspected['directoryStatus'] if inspected else 'UNKNOWN'
        observations.append({'run': c['run'], 'member': c['member'], 'leadHours': c['leadHours'],
                             'validTimeUtc': (run_epoch(c['run'])+timedelta(hours=c['leadHours']))
                             .isoformat().replace('+00:00', 'Z'),
                             'directoryStatus': status, 'gribHeaderVerified': False,
                             'valuesVerified': False, 'publicationAuthorized': False,
                             'diagnosis': 'index-gap-evidence' if status == 'NOT_ADVERTISED'
                             else 'downstream-gap-not-excluded' if status == 'ADVERTISED'
                             else 'unverified',
                             'indexNameCount': inspected['totalGribNames'] if inspected else None})
    return {'schema': 'mid.ruc.eps-targeted-index-gap.v1',
            'observedAtUtc': now.isoformat().replace('+00:00', 'Z'),
            'source': ROOT, 'requestCount': len(unique), 'cases': observations,
            'overall': 'INCOMPLETE_OR_UNKNOWN', 'publicationAuthorized': False,
            'limits': {'maxCases': MAX_CASES, 'maxWorkers': MAX_WORKERS,
                       'maxBodyBytes': MAX_BODY_BYTES, 'perRequestTimeoutSeconds': TIMEOUT_SECONDS},
            'warning': 'Directory-only observation: can change after publication, no GRIB/header/member/value admission.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', dest='cases', action='append', required=True,
                        help='exact init,member,hour: 2026-11-23T11:00,09,002')
    args = parser.parse_args()
    try:
        report = probe([parse_case(case) for case in args.cases])
    except (ValueError, TypeError) as exc:
        parser.error(str(exc))
    print(json.dumps(report, separators=(',', ':'), ensure_ascii=False, allow_nan=False))
    # 0 = bounded audit completed; explicitly NOT a full EPS20 source-green signal.
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

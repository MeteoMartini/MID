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
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit
from urllib.request import Request, HTTPRedirectHandler, build_opener

ORIGIN = 'https://opendata.dwd.de'
ROOT = ORIGIN + '/weather/nwp/v1/m/icon-d2-ruc-eps/p/TOT_PREC/r/'
RUN_RE = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00$')
FILENAME_RE = re.compile(r'^PT(?P<h>[0-9]{3})H(?P<m>[0-9]{2})M\.grib2(?:\.bz2)?$')
MAX_BODY_BYTES = 2_000_000
MAX_CASES = 8
MAX_WORKERS = 4
TIMEOUT_SECONDS = 4
WALL_BUDGET_SECONDS = 14


class RejectRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if fp is not None:
            fp.close()
        raise ValueError('redirected original index')


# A redirect must never initiate a second request, even back to the same host.
urlopen = build_opener(RejectRedirect()).open


class Anchors(HTMLParser):
    """Conservative explicit HTML envelope; not a general browser HTML parser."""
    VOID = frozenset({'area','br','col','embed','hr','img','input','link','meta',
                      'param','source','track','wbr'})
    INERT = frozenset({'base','template','script','style','textarea','xmp','iframe',
                       'noembed','noframes','noscript','plaintext','svg','math','object'})

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []
        self.stack = []
        self.seen_html = False
        self.seen_head = False
        self.seen_body = False
        self.closed_html = False

    def handle_starttag(self, tag, attrs):
        if self.closed_html or 'title' in self.stack or tag in self.INERT:
            raise ValueError('unexpected or inert directory markup')
        if tag == 'html':
            if self.seen_html or self.stack:
                raise ValueError('duplicate directory root')
            self.seen_html = True
        elif not self.stack:
            raise ValueError('directory markup outside root')
        if tag in {'head','body'}:
            if self.stack != ['html'] or self.seen_body or (tag == 'head' and self.seen_head):
                raise ValueError('ambiguous directory envelope')
            if tag == 'head':
                self.seen_head = True
            else:
                self.seen_body = True
        elif tag != 'html' and not any(x in self.stack for x in ('head','body')):
            raise ValueError('directory markup outside head/body')
        if tag == 'a':
            if 'body' not in self.stack or 'a' in self.stack:
                raise ValueError('misplaced or nested directory link')
            hrefs = [value for name, value in attrs if name.lower() == 'href']
            if len(hrefs) != 1 or not isinstance(hrefs[0], str) or not hrefs[0]:
                raise ValueError('missing or ambiguous original href')
            self.hrefs.append(hrefs[0])
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        if tag not in self.VOID:
            raise ValueError('unexpected self-closing directory element')
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            raise ValueError('unbalanced directory markup')
        self.stack.pop()
        if tag == 'html':
            if not self.seen_body:
                raise ValueError('missing directory body')
            self.closed_html = True

    def handle_data(self, data):
        # HTMLParser may emit incomplete markup or RCDATA as text.
        if '<' in data or (not self.stack and data.strip()):
            raise ValueError('unverified directory text/markup')

    def verify_complete(self):
        if self.stack or not self.closed_html or not self.seen_body:
            raise ValueError('incomplete directory HTML envelope')


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


def canonical_directory(url):
    if not isinstance(url, str):
        raise ValueError('unexpected original index URL')
    match = re.fullmatch(re.escape(ROOT) + r'(20\d\d-\d\d-\d\dT\d\d:00)/e/(0[1-9]|1[0-9]|20)/s/', url)
    if not match or index_url(match[1], int(match[2])) != url:
        raise ValueError('noncanonical original index URL')
    return url


def read_framed_body(response):
    """No negative index evidence from an incomplete or ambiguous HTTP body."""
    lengths = response.headers.get_all('Content-Length') or []
    transfers = response.headers.get_all('Transfer-Encoding') or []
    encodings = response.headers.get_all('Content-Encoding') or []
    if encodings and encodings != ['identity']:
        raise ValueError('untrusted response Content-Encoding')
    if lengths:
        if (len(lengths) != 1 or transfers or not re.fullmatch(r'[0-9]{1,10}', lengths[0])
                or int(lengths[0]) > MAX_BODY_BYTES):
            raise ValueError('untrusted response Content-Length')
        expected = int(lengths[0])
    elif transfers == ['chunked'] and getattr(response, 'chunked', False) is True:
        expected = None
    else:
        raise ValueError('unverified response framing')
    payload = response.read(MAX_BODY_BYTES + 1)
    if len(payload) > MAX_BODY_BYTES:
        raise ValueError('source index byte limit exceeded')
    if expected is not None and len(payload) != expected:
        raise ValueError('incomplete response Content-Length')
    if expected is None and not response.isclosed():
        raise ValueError('incomplete chunked response')
    return payload


def read_original_index(url):
    """Fixed DWD origin, maximum response bytes BEFORE UTF-8 decoding."""
    canonical_directory(url)
    req = Request(url, headers={'Accept': 'text/html', 'Accept-Encoding': 'identity', 'User-Agent': 'MID-Data13-RUC-EPS-targeted-gap/1'})
    with urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        if response.status != 200 or response.geturl() != url:
            raise ValueError('noncanonical source response')
        payload = read_framed_body(response)
    return payload.decode('utf-8', errors='strict')


def classify_index(body, directory, lead):
    """Only advertised names, never original GRIB existence or integrity."""
    if not isinstance(body, str) or len(body.encode('utf-8')) > MAX_BODY_BYTES:
        raise ValueError('unbounded source HTML')
    canonical_directory(directory)
    if type(lead) is not int or not 0 <= lead <= 27:
        raise ValueError('invalid lead')
    # A fully framed HTTP response can still contain truncated HTML.
    # Require explicit final root closure and balanced parsed elements.
    if not body.rstrip().lower().endswith('</html>'):
        raise ValueError('incomplete directory HTML ending')
    anchors = Anchors()
    anchors.feed(body)
    anchors.close()
    anchors.verify_complete()
    names = set()
    grib_count = 0
    for href in anchors.hrefs:
        if href in ('../', './') or href.startswith(('?', '#')):
            continue  # Apache parent/sort metadata only
        root_path = urlsplit(directory).path
        suffix = href[len(directory):] if href.startswith(directory) else (
            href[len(root_path):] if href.startswith(root_path) else href)
        match = FILENAME_RE.fullmatch(suffix)
        if not match:
            raise ValueError('unknown original index format')
        h, minute = int(match['h']), int(match['m'])
        if h > 27 or minute >= 60 or minute % 5 != 0 or (h == 27 and minute != 0):
            raise ValueError('unexpected original time step')
        name = f'PT{h:03d}H{minute:02d}M.GRIB2'
        if name in names:
            raise ValueError('duplicate advertised original file')
        names.add(name)
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
    # The library's wait budget is soft; main() supervises the entire CLI
    # child process so even socket/DNS/thread cleanup cannot extend its runtime.
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


def _run_cli():
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


def run_cli_with_deadline(command, timeout=WALL_BUDGET_SECONDS):
    """Supervise one read-only child; discard partial output on any failure."""
    try:
        completed = subprocess.run(command, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, timeout=timeout,
                                   check=False)
    except subprocess.TimeoutExpired:
        print('EPS index diagnostic deadline exceeded; no evidence emitted', file=sys.stderr)
        return 124
    if completed.returncode != 0:
        # No partial JSON can be mistaken for source evidence.
        print('EPS index diagnostic child failed; no evidence emitted', file=sys.stderr)
        return completed.returncode if completed.returncode > 0 else 1
    sys.stdout.buffer.write(completed.stdout)
    return 0


def main(argv=None):
    # A separate process, not non-daemon threads, is the cancellation boundary.
    # subprocess.run kills and reaps it on timeout after process creation.
    args = sys.argv[1:] if argv is None else argv
    command = [sys.executable, '-I', '-c',
               "import runpy,sys; ns=runpy.run_path(sys.argv.pop(1)); raise SystemExit(ns['_run_cli']())",
               str(Path(__file__).resolve()), *args]
    return run_cli_with_deadline(command)


if __name__ == '__main__':
    raise SystemExit(main())

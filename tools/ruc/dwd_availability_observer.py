#!/usr/bin/env python3
"""Read-only DWD RUC directory sampler; NOT a GRIB or EPS admission check.

A listing proves only that a filename was advertised at observation time.
The 27h/20-member production pipeline and its ecCodes admission remain sovereign.
Directory timestamps are not used as actual DWD publication timestamps.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import re
from urllib.parse import quote, unquote, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = 'https://opendata.dwd.de/weather/nwp/v1/m/'
DET = ROOT + 'icon-d2-ruc/p/'
EPS = ROOT + 'icon-d2-ruc-eps/p/'
FIELDS = ('T_2M', 'TD_2M', 'RELHUM_2M', 'PMSL', 'U_10M', 'V_10M',
          'VMAX_10M', 'TOT_PREC', 'CLCT', 'CLCL', 'CAPE_ML', 'CIN_ML')
HORIZONS = (6, 14, 27)
RUN = re.compile(r'^20\d\d-\d\d-\d\dT\d\d:00/$')
LEAD = re.compile(r'PT(?P<h>\d{3})H(?P<m>\d{2})M', re.I)
GRIB = re.compile(r'\.(?:grib2|grb2)(?:\.bz2)?$', re.I)


class Anchors(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            href = dict(attrs).get('href')
            if isinstance(href, str):
                self.hrefs.append(href)


def assert_dwd_url(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.netloc != 'opendata.dwd.de' or parsed.username or parsed.password:
        raise ValueError('untrusted source outside DWD HTTPS origin')
    if not parsed.path.startswith('/weather/nwp/v1/m/') or '..' in unquote(parsed.path).split('/'):
        raise ValueError('unsafe DWD path')


def fetch_index(url: str) -> list[str]:
    assert_dwd_url(url)
    with urlopen(Request(url, headers={'User-Agent': 'MID-RUC-availability-observer/1',
                                       'Accept': 'text/html'}), timeout=15) as response:
        if response.status != 200:
            raise RuntimeError(f'DWD HTTP {response.status}')
        payload = response.read(2_000_001)
        if len(payload) > 2_000_000:
            raise ValueError('DWD index exceeds safe size')
    parser = Anchors()
    parser.feed(payload.decode('utf-8', errors='strict'))
    return parser.hrefs


def valid_run(value: str) -> bool:
    if not RUN.fullmatch(value + '/'):
        return False
    try:
        parsed = datetime.strptime(value, '%Y-%m-%dT%H:%M')
        return parsed.strftime('%Y-%m-%dT%H:%M') == value
    except ValueError:
        return False


def discovered_runs(indexer=fetch_index) -> list[str]:
    available = set()
    for href in indexer(f'{DET}T_2M/r/'):
        run = unquote(href).rstrip('/')
        if valid_run(run):
            available.add(run)
    return sorted(available, reverse=True)


def directory_grib_leads(index_url: str, indexer=fetch_index, max_depth=4) -> set[int]:
    """Advertised minute offsets only; no data, header or member verification."""
    assert_dwd_url(index_url)
    if not index_url.endswith('/'):
        raise ValueError('expected directory URL')
    found, queue, visited = set(), [(index_url, 0)], set()
    while queue:
        url, depth = queue.pop()
        if url in visited:
            continue
        visited.add(url)
        for href in indexer(url):
            if href.startswith(('?', '#', '//')) or href in ('../', './'):
                continue
            candidate = urljoin(url, href)
            assert_dwd_url(candidate)
            if not candidate.startswith(index_url):
                continue
            if href.endswith('/'):
                if depth < max_depth:
                    queue.append((candidate, depth + 1))
                continue
            if not GRIB.search(urlsplit(candidate).path):
                continue
            match = LEAD.search(unquote(urlsplit(candidate).path))
            if match:
                found.add(60 * int(match['h']) + int(match['m']))
    return found


def observe(run: str, indexer=fetch_index, observed_at=None) -> dict:
    if not valid_run(run):
        raise ValueError('noncanonical DWD run')
    observed = observed_at or datetime.now(timezone.utc)
    if observed.tzinfo is None:
        raise ValueError('observation timestamp has no UTC offset')
    observed = observed.astimezone(timezone.utc)
    if observed < datetime.strptime(run, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc):
        raise ValueError('observation predates model initialization')
    tasks = [(f'deterministic/{param}', f'{DET}{quote(param)}/r/{run}/') for param in FIELDS]
    tasks.append(('eps/TOT_PREC', f'{EPS}TOT_PREC/r/{run}/'))

    def fetch(task):
        key, url = task
        try:
            return key, sorted(directory_grib_leads(url, indexer)), None
        except Exception as error:
            # Network errors are unknown availability, never empty/zero data.
            return key, None, f'{type(error).__name__}: {str(error)[:180]}'

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(fetch, tasks))
    inventory = {key: {'advertisedLeadMinutes': leads, 'error': error,
                       'headerVerified': False} for key, leads, error in results}
    stages = {}
    for horizon in HORIZONS:
        required = set(range(0, horizon * 60 + 1, 60))
        missing = {param: sorted(required - set(inventory['deterministic/' + param]['advertisedLeadMinutes']))
                   for param in FIELDS if inventory['deterministic/' + param]['advertisedLeadMinutes'] is not None
                   and not required.issubset(set(inventory['deterministic/' + param]['advertisedLeadMinutes']))}
        unknown = [param for param in FIELDS if inventory['deterministic/' + param]['advertisedLeadMinutes'] is None]
        stages[f'0-{horizon}h'] = {
            'directoryComplete': None if unknown else not missing,
            'missingLeadMinutesByField': missing, 'unknownFields': unknown,
            'gribHeaderVerified': False, 'valuesVerified': False,
            'publicationAuthorized': False,
        }
    # A failed/unknown directory listing is not evidence of absence.
    field_leads = [inventory['deterministic/' + k]['advertisedLeadMinutes'] for k in FIELDS]
    first_advertised = True if any(field_leads) else (None if any(leads is None for leads in field_leads) else False)
    return {
        'schema': 'mid.ruc.dwd-directory-observation.v1',
        'observedAtUtc': observed.isoformat().replace('+00:00', 'Z'),
        'run': run,
        'source': ROOT,
        'firstAdvertisedField': first_advertised,
        'stages': stages,
        'eps': {
            'totPrecDirectoryHasGrib': bool(inventory['eps/TOT_PREC']['advertisedLeadMinutes'])
            if inventory['eps/TOT_PREC']['advertisedLeadMinutes'] is not None else None,
            'memberCount': None, 'membersComplete': None,
            'headerVerified': False, 'fullValuesVerified': False,
        },
        'directories': inventory,
        'evidenceLimit': 'directory-listing-only; observation time is an upper bound on first-publication time',
        'productionEnabled': False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runs', type=int, default=2, choices=[1, 2, 3])
    parser.add_argument('--output', required=True, help='new JSONL output file (never overwrite)')
    args = parser.parse_args()
    from pathlib import Path
    destination = Path(args.output)
    if destination.exists():
        parser.error('observation output must be new; no overwrite allowed')
    runs = discovered_runs()[:args.runs]
    if not runs:
        raise SystemExit('no canonical DWD runs visible; no observation published')
    observations = [observe(run) for run in runs]
    destination.write_text(''.join(json.dumps(row, ensure_ascii=False, allow_nan=False,
                                               separators=(',', ':')) + '\n' for row in observations),
                           encoding='utf-8')
    print(f'DWD directory observations: {len(observations)} runs, {destination}; no GRIB admission')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

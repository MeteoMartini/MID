#!/usr/bin/env python3
"""Read-only DWD source inventory for MID winter and convective map candidates.

This tool NEVER fetches or decodes GRIB bytes and NEVER authorizes display,
model capability, forecast values, or release. It only checks that *named*
original DWD files for an explicitly pinned model/run/grid exist together.

Examples:
  python tools/ruc/qa_dwd_seasonal_source_inventory.py --model icon-d2 --run 2026111000 --scenario winter
  python tools/ruc/qa_dwd_seasonal_source_inventory.py --model icon-eu --run 2026111000 --scenario convective

Requires only the Python standard library and HTTPS access to DWD Open Data.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import re
import sys
from urllib.parse import urlparse
from urllib.request import build_opener, HTTPRedirectHandler, Request

ORIGIN = 'https://opendata.dwd.de/weather/nwp'
MODELS = {
    'icon-d2': {'region': 'germany', 'grids': ('regular-lat-lon', 'icosahedral'), 'last': 48},
    'icon-eu': {'region': 'europe', 'grids': ('regular-lat-lon',), 'last': 120},
}
SCENARIOS = {
    'winter': {
        'required': ('tot_prec', 't_2m', 'ww', 'h_snow'),
        'supplementary': ('snow_gsp', 'snow_con', 'rain_gsp', 'rain_con', 'grau_gsp'),
    },
    'convective': {
        'required': ('tot_prec', 'cape_ml', 'cin_ml'),
        'supplementary': ('lpi', 'lpi_con_max', 'vmax_10m'),
    },
}
# Directory availability is not a numerical field/phase/shear validity check.
CAPABILITY = 'listing-only-not-renderable'
MAX_DIRECTORY_BYTES = 2_000_000
FILE_RE = re.compile(
    r'^icon-(?P<id>d2|eu)_(?P<region>germany|europe)_(?P<grid>regular-lat-lon|icosahedral)'
    r'_single-level_(?P<run>20\d{8})_(?P<lead>\d{3})_(?P<suffix>(?:2d_)?[A-Za-z0-9_]+)\.grib2\.bz2$'
)


class InventoryError(ValueError):
    pass


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            href = dict(attrs).get('href')
            if href:
                self.links.append(href)


def validate_request(model: str, run: str, scenario: str, grid: str):
    if model not in MODELS or scenario not in SCENARIOS:
        raise InventoryError('unsupported model or scenario')
    if grid not in MODELS[model]['grids']:
        raise InventoryError('requested grid not supplied by this model')
    if not re.fullmatch(r'20\d{8}', run):
        raise InventoryError('invalid pinned YYYYMMDDHH run')
    try:
        date = datetime.strptime(run, '%Y%m%d%H')
    except ValueError as exc:
        raise InventoryError('invalid UTC run date/hour') from exc
    if date.hour not in (0, 6, 12, 18) and model == 'icon-eu':
        raise InventoryError('unsupported ICON-EU cycle hour')
    if date.hour not in (0, 3, 6, 9, 12, 15, 18, 21) and model == 'icon-d2':
        raise InventoryError('unsupported ICON-D2 cycle hour')


def source_dir(model: str, run: str, field: str) -> str:
    return f'{ORIGIN}/{model}/grib/{run[-2:]}/{field}/'


def extract_leads(html: str, model: str, run: str, field: str, grid: str) -> dict[int, str]:
    """Only exact model/run/field/grid basenames; never generic fuzzy matches."""
    if model not in MODELS or grid not in MODELS[model]['grids'] or not re.fullmatch(r'[a-z][a-z0-9_]*', field):
        raise InventoryError('unsupported source selection')
    parser = LinkParser()
    parser.feed(html)
    found: dict[int, str] = {}
    prefix = source_dir(model, run, field)
    for href in parser.links:
        u = urlparse(href)
        if u.scheme or u.netloc:
            if u.scheme != 'https' or u.hostname != 'opendata.dwd.de' or not u.geturl().startswith(prefix):
                continue
            if u.query or u.fragment or u.path.rsplit('/', 1)[0] + '/' != urlparse(prefix).path:
                continue
            base = u.path.rsplit('/', 1)[-1]
        else:
            if '/' in href or '?' in href or '#' in href:
                continue
            base = href
        match = FILE_RE.fullmatch(base)
        if not match or match.group('region') != MODELS[model]['region']:
            continue
        if match.group('id') != model.split('-')[1] or match.group('run') != run or match.group('grid') != grid:
            continue
        expected_suffix = ('2d_' if model == 'icon-d2' else '') + (field.lower() if model == 'icon-d2' else field.upper())
        if match.group('suffix') != expected_suffix:
            continue
        lead = int(match.group('lead'))
        if lead in found:
            raise InventoryError(f'duplicate original file: {model}/{field}/{grid}/T+{lead}')
        found[lead] = base
    return found


def publication_interval(model: str, lead: int) -> int:
    if model not in MODELS or not isinstance(lead, int) or lead <= 0 or lead > MODELS[model]['last']:
        raise InventoryError('lead outside known nominal publication window')
    if model == 'icon-d2' or lead <= 78:
        return 1
    if lead >= 81 and lead % 3 == 0:
        return 3
    raise InventoryError('non-published intermediate ICON-EU forecast hour')


def evidence_only_report(model: str, run: str, scenario: str, grid: str, catalogs: dict[str, dict[int, str]]) -> dict:
    """File-list intersection is *not* field header, bitmap, phase, shear, or pixel proof."""
    validate_request(model, run, scenario, grid)
    required = SCENARIOS[scenario]['required']
    optional = SCENARIOS[scenario]['supplementary']
    missing_fields = [field for field in required if not catalogs.get(field)]
    joint = set.intersection(*(set(catalogs.get(field, ())) for field in required)) if not missing_fields else set()
    windows = []
    for lead in sorted(joint):
        try:
            interval = publication_interval(model, lead)
        except InventoryError:
            continue
        if lead - interval not in catalogs.get('tot_prec', {}):
            continue
        windows.append({'leadHour': lead, 'nominalPrecipHours': interval,
                        'fieldListingOnly': True, 'gribStatisticVerified': False})
    return {
        'schema': 'mid.dwd.seasonal-inventory.qa.v1',
        'model': model, 'runUTC': datetime.strptime(run, '%Y%m%d%H').strftime('%Y-%m-%dT%H:00:00Z'),
        'scenario': scenario, 'advertisedGrid': grid,
        'capability': CAPABILITY, 'renderable': False, 'releaseApproved': False,
        'verified': {'directoryNames': True, 'originalBytes': False, 'gribHeader': False,
                     'sameGridCoordinates': False, 'bitmapNoData': False,
                     'precipitationStatistic': False, 'phaseClassification': False,
                     'snowPhysicalSemantics': False, 'convectiveShear': False},
        'required': {field: sorted(catalogs.get(field, {})) for field in required},
        'supplementary': {field: sorted(catalogs.get(field, {})) for field in optional},
        'missingRequiredFields': missing_fields,
        'candidateOutputEndpoints': windows,
        'missingIsNotZero': True,
    }


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def fetch_listing(url: str) -> str:
    u = urlparse(url)
    if u.scheme != 'https' or u.hostname != 'opendata.dwd.de' or u.query or u.fragment:
        raise InventoryError('not an approved DWD original HTTPS directory')
    opener = build_opener(NoRedirect())
    response = opener.open(Request(url, headers={'User-Agent': 'MID-read-only-seasonal-inventory/1.0'}), timeout=25)
    try:
        if response.status != 200:
            raise InventoryError('original DWD directory not available')
        data = response.read(MAX_DIRECTORY_BYTES + 1)
    finally:
        response.close()
    if len(data) > MAX_DIRECTORY_BYTES:
        raise InventoryError('oversize DWD listing')
    return data.decode('utf-8', errors='replace')


def collect(model: str, run: str, scenario: str, grid: str) -> dict:
    validate_request(model, run, scenario, grid)
    catalogs = {}
    source_errors = {}
    for field in SCENARIOS[scenario]['required'] + SCENARIOS[scenario]['supplementary']:
        try:
            catalogs[field] = extract_leads(fetch_listing(source_dir(model, run, field)),model,run,field,grid)
        except Exception as exc:
            # A missing supplementary field is NoData, never silently substituted.
            catalogs[field] = {}
            if field in SCENARIOS[scenario]['required']:
                raise InventoryError(f'missing mandatory {field} listing: {type(exc).__name__}: {exc}') from exc
            source_errors[field] = type(exc).__name__ + ': ' + str(exc)
    report = evidence_only_report(model, run, scenario, grid, catalogs)
    report['observedAtUTC'] = datetime.now(timezone.utc).isoformat()
    report['supplementarySourceErrors'] = source_errors
    # Optional fetch errors mean UNKNOWN, never a proven absent/or zero original.
    for field in source_errors:
        report['supplementary'][field] = None
    return report


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--model', choices=tuple(MODELS), required=True)
    p.add_argument('--scenario', choices=tuple(SCENARIOS), required=True)
    p.add_argument('--run', required=True)
    p.add_argument('--grid', default='regular-lat-lon', choices=('regular-lat-lon','icosahedral'))
    a = p.parse_args()
    try:
        result = collect(a.model,a.run,a.scenario,a.grid)
        print(json.dumps(result,sort_keys=True,indent=2,ensure_ascii=False))
        return 0 if result['candidateOutputEndpoints'] and not result['missingRequiredFields'] else 2
    except (InventoryError, OSError) as exc:
        print(json.dumps({'schema':'mid.dwd.seasonal-inventory.qa.v1','capability':CAPABILITY,
                          'renderable':False,'releaseApproved':False,'status':'BLOCKED','error':str(exc)},ensure_ascii=False))
        return 2


if __name__ == '__main__':
    sys.exit(main())

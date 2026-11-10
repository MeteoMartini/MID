#!/usr/bin/env python3
"""Read-only qualification of original DWD ICON-EU seasonal-map GRIB fields.

No publication, map renderer, or forecast pipeline is modified by this tool.
Do NOT promote its output without independent QA, source and deployment gates.

Usage (requires requests/numpy/eccodes, present in MID's RUC CI dependencies):
  python tools/ruc/qa_icon_eu_seasonal_grib.py --run 2026111000 --leads 1,78,81

The run is explicitly pinned; this tool NEVER guesses the latest run or
splices data from different cycles. It fails closed for missing original bytes.
"""
from __future__ import annotations

import argparse
import bz2
from datetime import datetime, timedelta, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile
from urllib.parse import urlparse

BASE = 'https://opendata.dwd.de/weather/nwp/icon-eu/grib'
FIELDS = {'tot_prec': 'TOT_PREC', 't_2m': 'T_2M', 'vmax_10m': 'VMAX_10M'}
FILE_RE = re.compile(r'^icon-eu_europe_regular-lat-lon_single-level_(\d{10})_(\d{3})_(TOT_PREC|T_2M|VMAX_10M)\.grib2\.bz2$')
MAX_WIRE_BYTES = 16_000_000
MAX_DECODED_BYTES = 64_000_000


class ContractError(ValueError):
    pass


class AnchorParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href')
            if href:
                self.hrefs.append(href)


def enumerate_leads(html: str, run: str, field: str) -> dict[int, str]:
    """Accept only exact original DWD basename and requested run/field."""
    if not re.fullmatch(r'20\d{8}', run) or field not in FIELDS:
        raise ContractError('invalid requested run or field')
    parser = AnchorParser(); parser.feed(html)
    found = {}
    source_dir = f'{BASE}/{run[-2:]}/{field}/'
    for href in parser.hrefs:
        parsed = urlparse(href)
        if parsed.query or parsed.fragment:
            continue
        if parsed.scheme or parsed.netloc:
            # DWD's real Apache indexes expose absolute URLs, not only basenames.
            # Accept precisely this HTTPS directory, never a lookalike host,
            # credentials, another cycle/field, or an off-origin redirect.
            if (parsed.scheme != 'https' or parsed.hostname != 'opendata.dwd.de'
                or parsed.username is not None or parsed.password is not None):
                continue
            try:
                if parsed.port not in (None, 443):
                    continue
            except ValueError:
                continue
            if not parsed.path.startswith(urlparse(source_dir).path):
                continue
            basename = parsed.path.rsplit('/', 1)[-1]
            if parsed.path != urlparse(source_dir + basename).path:
                continue
        else:
            if '/' in href or not href:
                continue
            basename = href
        match = FILE_RE.fullmatch(basename)
        if not match or match.group(1) != run or match.group(3) != FIELDS[field]:
            continue
        lead = int(match.group(2))
        if lead in found:
            raise ContractError(f'duplicate original {field} lead {lead}')
        found[lead] = basename
    return found


def target_interval(lead: int) -> int:
    """Typical regular-grid publication cadence; not proof of GRIB stats."""
    if not isinstance(lead, int) or lead < 1 or lead > 120:
        raise ContractError('forecast lead outside seasonal-map contract')
    if lead <= 78:
        return 1
    if lead >= 81 and lead % 3 == 0:
        return 3
    raise ContractError('no published original lead for this hour')


def planned_pairs(catalogs: dict[str, dict[int, str]], lead: int) -> dict[str, str]:
    """Find exact same-cycle filenames; no interpolation or hidden fallback."""
    width = target_interval(lead)
    required = {'tot_prec': (lead - width, lead), 't_2m': (lead,), 'vmax_10m': (lead,)}
    out = {}
    for field, needed in required.items():
        listing = catalogs.get(field) or {}
        for hour in needed:
            if hour not in listing:
                raise ContractError(f'missing {field} original at lead {hour}')
            out[f'{field}:{hour}'] = listing[hour]
    return out


def verify_window(meta: dict, *, run: str, lead: int, field: str) -> int:
    """Use GRIB keys, never the listing or filename, as semantic authority."""
    expected = datetime.strptime(run, '%Y%m%d%H').replace(tzinfo=timezone.utc)
    category = {'tot_prec': (0,1,52), 't_2m': (0,0,0), 'vmax_10m': (0,2,22)}.get(field)
    if not category or tuple(meta.get(k) for k in ('discipline','parameterCategory','parameterNumber')) != category:
        raise ContractError('original GRIB2 discipline/category/number mismatch')
    start = datetime.strptime(f"{meta['dataDate']:08d}{meta['dataTime']:04d}", '%Y%m%d%H%M').replace(tzinfo=timezone.utc)
    valid = datetime.strptime(f"{meta['validityDate']:08d}{meta['validityTime']:04d}", '%Y%m%d%H%M').replace(tzinfo=timezone.utc)
    if start != expected or valid != expected + timedelta(hours=lead):
        raise ContractError('GRIB origin or validity mismatch')
    if meta['centre'] != 78 or meta['gridType'] != 'regular_ll':
        raise ContractError('GRIB provider or grid not original DWD regular lat/lon')
    if meta['endStep'] != lead:
        raise ContractError('GRIB endStep differs from expected lead')
    step = meta['stepType']
    if field == 'tot_prec':
        if meta['paramId'] != 228228 or step != 'accum' or meta['startStep'] != 0:
            raise ContractError('not source-run cumulative total precipitation')
        if meta['units'] not in ('kg m**-2', 'kg m-2', 'mm'):
            raise ContractError('unverified precipitation unit')
        return lead
    if field == 't_2m':
        if step != 'instant' or meta['startStep'] != lead or meta['typeOfLevel'] != 'heightAboveGround' or meta['level'] != 2 or meta['units'] != 'K':
            raise ContractError('not original instantaneous 2m temperature')
        return 0
    if field == 'vmax_10m':
        if step != 'max' or meta['typeOfLevel'] != 'heightAboveGround' or meta['level'] != 10 or meta['units'] not in ('m s-1', 'm s**-1'):
            raise ContractError('not original maximum 10m gust')
        interval = lead - meta['startStep']
        if interval <= 0 or interval > lead:
            raise ContractError('invalid original gust statistic interval')
        # The summer composite must compare the same accumulation/statistics period.
        if interval != target_interval(lead):
            raise ContractError('gust interval incompatible with original precipitation window')
        return interval
    raise ContractError('unknown original parameter')


def cumulative_difference(previous, current, *, tolerance: float = 1e-10):
    """Cellwise difference: missing/negative stays missing; genuine zero is zero."""
    if len(previous) != len(current) or not previous:
        raise ContractError('mismatched or empty original raster')
    values = []
    for a, b in zip(previous, current):
        if a is None or b is None or not (isinstance(a, (int,float)) and isinstance(b,(int,float))):
            values.append(None); continue
        from math import isfinite
        if not isfinite(a) or not isfinite(b) or b < 0 or a < 0 or b - a < -tolerance:
            values.append(None); continue
        # Tiny negative differences still indicate an unresolved original/quantization issue.
        values.append(b - a if b >= a else None)
    return values


def cumulative_difference_array(previous, current):
    """Vectorized same-run cumulative delta, with explicit per-cell NaN gaps.

    No array-to-Python-list conversion at full ICON-EU grid resolution.
    Negative changes (including tiny negative resets) are unresolved, not zero.
    """
    import numpy as np
    start=np.asarray(previous,dtype=np.float64)
    end=np.asarray(current,dtype=np.float64)
    if start.ndim!=1 or end.shape!=start.shape or start.size==0:
        raise ContractError('cumulative grid shape/size mismatch')
    valid=(np.isfinite(start)&np.isfinite(end)&(start>=0)&(end>=0)&(end>=start))
    return np.where(valid,end-start,np.nan)


def _request_bytes(session, url: str) -> bytes:
    """Bounded read-only original fetch; do not follow off-domain redirects."""
    if urlparse(url).scheme != 'https' or urlparse(url).hostname != 'opendata.dwd.de':
        raise ContractError('untrusted original origin')
    response = session.get(url, timeout=45, allow_redirects=False, stream=True)
    response.raise_for_status()
    if response.status_code != 200:
        raise ContractError('original fetch redirected')
    payload = bytearray()
    for chunk in response.iter_content(65536):
        payload.extend(chunk)
        if len(payload) > MAX_WIRE_BYTES:
            raise ContractError('original exceeds bounded compressed bytes')
    if not payload.startswith(b'BZh'):
        raise ContractError('original response was not BZip2')
    return bytes(payload)


def validate_regular_grid(latitudes, longitudes, ni: int, nj: int) -> str:
    """Fail closed on transposed/ragged/nonrectangular original DWD coordinates."""
    import numpy as np
    if not isinstance(ni, int) or not isinstance(nj, int) or ni < 2 or nj < 2:
        raise ContractError('invalid original grid dimensions')
    lats = np.asarray(latitudes, dtype=np.float64)
    lons = np.asarray(longitudes, dtype=np.float64)
    if (lats.ndim != 1 or lons.ndim != 1 or lats.size != ni*nj
        or lons.size != ni*nj or not np.isfinite(lats).all()
        or not np.isfinite(lons).all()):
        raise ContractError('missing/nonfinite original grid coordinates')
    lat = lats.reshape(nj, ni)
    lon = lons.reshape(nj, ni)
    if not (np.allclose(lat,lat[:,0,None],rtol=0,atol=1e-6)
        and np.allclose(lon,lon[0,None,:],rtol=0,atol=1e-6)):
        raise ContractError('original DWD coordinates are not rectangular')
    lat_axis, lon_axis = lat[:,0], lon[0,:]
    if (np.any(np.abs(lat_axis)>90) or np.any(lon_axis < -180)
        or np.any(lon_axis > 360)):
        raise ContractError('unphysical original grid coordinates')
    lat_diff, lon_diff = np.diff(lat_axis), np.diff(lon_axis)
    if not ((np.all(lat_diff>0) or np.all(lat_diff<0))
        and (np.all(lon_diff>0) or np.all(lon_diff<0))):
        raise ContractError('original axes not strictly monotonic')
    shape = f'{nj}x{ni}:'.encode('ascii')
    return hashlib.sha256(shape + np.stack((lats,lons)).tobytes()).hexdigest()


def mask_only_documented_missing(values, missing_value):
    """A huge/corrupt finite extreme is NOT a missing bitmap cell."""
    import numpy as np
    values = np.asarray(values, dtype=np.float64)
    if np.isinf(values).any():
        raise ContractError('infinite original GRIB value is not valid NoData')
    missing = ~np.isfinite(values)
    try:
        sentinel = float(missing_value)
    except (TypeError,ValueError,OverflowError) as exc:
        raise ContractError('invalid original missingValue sentinel') from exc
    if np.isfinite(sentinel):
        missing |= values == sentinel
    return np.where(missing, np.nan, values)


def validate_original_range(field: str, values) -> None:
    """Reject physically impossible decoded extremes; never clamp or smooth."""
    import numpy as np
    bounds = {'tot_prec':(0,6500), 't_2m':(170,340), 'vmax_10m':(0,200)}
    if field not in bounds:
        raise ContractError('unknown original field for physical validation')
    values = np.asarray(values, dtype=np.float64)
    finite = values[np.isfinite(values)]
    if finite.size == 0:
        raise ContractError('original field has no valid values')
    low,high = bounds[field]
    if np.any(finite<low) or np.any(finite>high):
        raise ContractError('implausible original field values: no clamping permitted')


def decode_original(payload: bytes) -> tuple[dict, object, str]:
    """Decode exactly one GRIB2 message with ecCodes; preserve bitmap/NoData."""
    import numpy as np
    from eccodes import codes_grib_new_from_file, codes_get, codes_get_long, codes_get_array, codes_release, codes_set
    decompressor = bz2.BZ2Decompressor()
    raw = decompressor.decompress(payload, max_length=MAX_DECODED_BYTES + 1)
    if len(raw) > MAX_DECODED_BYTES or not decompressor.eof or decompressor.unused_data:
        raise ContractError('incomplete, overlarge or multi-stream BZip2')
    if not raw.startswith(b'GRIB'):
        raise ContractError('BZip2 contents not GRIB')
    with tempfile.TemporaryFile() as file:
        file.write(raw); file.seek(0)
        gid = codes_grib_new_from_file(file)
        if gid is None:
            raise ContractError('no GRIB message')
        try:
            codes_set(gid, 'stepUnits', 1)
            if codes_get_long(gid,'edition') != 2:
                raise ContractError('not GRIB2')
            keys = ('dataDate','dataTime','validityDate','validityTime','endStep','startStep','paramId','centre','level','Ni','Nj','discipline','parameterCategory','parameterNumber')
            meta = {key:int(codes_get_long(gid,key)) for key in keys}
            meta.update({key:str(codes_get(gid,key)) for key in ('stepType','units','gridType','typeOfLevel','shortName')})
            # Native grid identity and value ordering are qualified independently below.
            raw_vals = np.asarray(codes_get_array(gid,'values'),dtype=np.float64)
            lats = np.asarray(codes_get_array(gid,'latitudes'),dtype=np.float64)
            lons = np.asarray(codes_get_array(gid,'longitudes'),dtype=np.float64)
            if raw_vals.size != meta['Ni']*meta['Nj'] or lats.size != raw_vals.size or lons.size != raw_vals.size:
                raise ContractError('original grid dimensions inconsistent')
            missing = float(codes_get(gid,'missingValue'))
            # Preserve genuine missing/bitmap cells, but never hide a corrupt
            # finite extreme behind an arbitrary magnitude threshold.
            values = mask_only_documented_missing(raw_vals,missing)
            grid_signature = validate_regular_grid(lats,lons,meta['Ni'],meta['Nj'])
            extra = codes_grib_new_from_file(file)
            if extra is not None:
                codes_release(extra)
                raise ContractError('multi-message GRIB: ambiguous source field')
            return meta,values,grid_signature
        finally:
            codes_release(gid)


def run_qualification(run: str, leads: list[int]) -> dict:
    import requests
    import numpy as np
    if not re.fullmatch(r'20\d{8}',run):
        raise ContractError('invalid requested UTC cycle')
    session = requests.Session()
    catalogs = {}
    for name in FIELDS:
        url = f'{BASE}/{run[-2:]}/{name}/'
        res = session.get(url, timeout=30, allow_redirects=False)
        res.raise_for_status()
        if res.status_code != 200:
            raise ContractError('DWD original directory redirected')
        catalogs[name] = enumerate_leads(res.text,run,name)
    entries = []
    for lead in leads:
        paired = planned_pairs(catalogs, lead)
        fetched = {}
        for key,name in paired.items():
            field,hour_str = key.split(':'); hour = int(hour_str)
            url = f'{BASE}/{run[-2:]}/{field}/{name}'
            payload = _request_bytes(session,url)
            meta,values,grid_id = decode_original(payload)
            verify_window(meta,run=run,lead=hour,field=field)
            validate_original_range(field,values)
            fetched[key] = (meta,values,grid_id,hashlib.sha256(payload).hexdigest())
        if len({v[2] for v in fetched.values()}) != 1:
            raise ContractError('original grids/coordinates differ across paired fields')
        width = target_interval(lead)
        old = fetched[f'tot_prec:{lead-width}'][1]
        new = fetched[f'tot_prec:{lead}'][1]
        # Avoid 3 gigantic Python lists for one whole-grid frame.
        values = cumulative_difference_array(old,new)
        gust = fetched[f'vmax_10m:{lead}'][1]
        temp = fetched[f't_2m:{lead}'][1]
        valid_winter = np.isfinite(values) & np.isfinite(temp)
        valid_summer = np.isfinite(values) & np.isfinite(gust)
        if not valid_winter.any() or not valid_summer.any():
            raise ContractError('no valid seasonal pair cells')
        entries.append({'lead':lead,'intervalHours':width,'totalCells':len(values),
          'validWinter':int(valid_winter.sum()),'validSummer':int(valid_summer.sum()),
          'minPrecipitationMm':float(np.nanmin(values)),'maxPrecipitationMm':float(np.nanmax(values)),
          'files':{key:{'sha256':val[3], 'units':val[0]['units'], 'stepType':val[0]['stepType'],
                          'startStep':val[0]['startStep'],'endStep':val[0]['endStep']} for key,val in fetched.items()}})
    return {'schema':'mid.icon-eu.seasonal.original-qa.v1','run':run,'source':'DWD ICON-EU GRIB2 originals',
            'releaseApproved':False,'entries':entries}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',required=True,help='Exact UTC cycle YYYYMMDDHH (no automatic fallback)')
    parser.add_argument('--leads',default='1,78,81',help='Comma-separated forecast lead hours')
    parser.add_argument('--output',type=Path)
    args = parser.parse_args()
    try:
        leads = [int(x) for x in args.leads.split(',')]
        if len(set(leads)) != len(leads) or not 1<=len(leads)<=5:
            raise ContractError('invalid/duplicate number of probe leads')
        result = run_qualification(args.run,leads)
        content = json.dumps(result,sort_keys=True,ensure_ascii=False,indent=2)+'\n'
        if args.output:
            args.output.write_text(content,encoding='utf-8')
        else:
            print(content)
        return 0
    except (ContractError,ValueError,ImportError,RuntimeError) as exc:
        print(json.dumps({'schema':'mid.icon-eu.seasonal.original-qa.v1','releaseApproved':False,
                          'status':'BLOCKED','error':str(exc)},ensure_ascii=False))
        return 2


if __name__ == '__main__':
    raise SystemExit(main())

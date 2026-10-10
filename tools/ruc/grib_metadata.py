"""Metadata-first DWD ICON-D2 RUC GRIB2 guards.

Use decoded GRIB section headers, never filenames as the sole field authority.
WMO Common Table C-1 defines originating centre 78 as Offenbach/RSMC.
Core/coordinate contracts are calibrated against archived DWD headers.
MU energy contracts are separately calibrated; other optional levels remain open.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import re
from meteo_integrity import MeteoIntegrityError, validate_grib_origin


# discipline/category/number, first surface/code/value, second surface/code/value,
# statistical processing. Values are decoded from raw scaled surface keys.
CORE_CONTRACTS = {
    'temperature_2m': (0,0,0,103,2,255,None,'instant'),
    'dew_point_2m': (0,0,6,103,2,255,None,'instant'),
    'relative_humidity_2m': (0,1,1,103,2,255,None,'instant'),
    'pressure_msl': (0,3,1,101,0,255,None,'instant'),
    'u10': (0,2,2,103,10,255,None,'instant'),
    'v10': (0,2,3,103,10,255,None,'instant'),
    'wind_gusts_10m': (0,2,22,103,10,255,None,'max'),
    'precipitation_acc': (0,1,52,1,0,255,None,'accum'),
    'cloud_cover': (0,6,1,1,0,255,None,'instant'),
    'cloud_cover_low': (0,6,22,100,80000,1,0,'instant'),
    'cape': (0,7,6,192,0,255,None,'instant'),
    'convective_inhibition': (0,7,7,192,0,255,None,'instant'),
    'CLAT': (0,191,1,1,0,255,None,'instant'),
    'CLON': (0,191,2,1,0,255,None,'instant'),
}
# A DWD grid revision must be recalibrated, not accepted by point count alone.
OPTIONAL_MU_CONTRACTS = {
    'cape_mu': (0,7,6,193,0,255,None,'instant'),
    'cin_mu': (0,7,7,193,0,255,None,'instant'),
}
NATIVE_GRID = ('c6b12daa91ad64045b26c1b6452a2a20',47,1,542040)


def source_contract_manifest(run):
    """Machine-readable source semantics, distinct from packed interval amounts."""
    reference=datetime.fromisoformat(run.replace('Z','+00:00'))
    reference=reference.replace(tzinfo=timezone.utc) if reference.tzinfo is None else reference.astimezone(timezone.utc)
    return {'schema':'mid.ruc.source-grib-contract.v1','forecastReferenceTime':reference.isoformat(),
            'scope':'12 core fields, CLAT/CLON, EPS TOT_PREC and optional CAPE_MU/CIN_MU; other optional levels not calibrated',
            'epsMemberIds':list(range(1,21)),
            'nativeGrid':{'uuid':NATIVE_GRID[0],'number':NATIVE_GRID[1],
                          'reference':NATIVE_GRID[2],'pointCount':NATIVE_GRID[3]},
            'parameterColumns':['discipline','category','number','firstSurfaceCode','firstSurfaceValue',
                                'secondSurfaceCode','secondSurfaceValue','processing'],
            'parameters':{name:list(contract) for name,contract in CORE_CONTRACTS.items()},
            'optionalParameters':{name:list(contract) for name,contract in OPTIONAL_MU_CONTRACTS.items()},
            'sourceTimeBounds':{'instant':'[valid,valid]','accum':'[initialization,valid]',
                                'max':'[max(initialization,valid-3600 seconds),valid]'},
            'packedPrecipitation':'interval amounts from differences of validated accumulations'}


def step_seconds(value, unit):
    """Decode ecCodes numeric or suffixed sub-hourly steps without guessing."""
    units={0:('m',60),1:('h',3600),13:('s',1)}
    if unit not in units:
        raise MeteoIntegrityError(f'unsupported RUC step unit {unit}')
    match=re.fullmatch(r'(\d+(?:\.\d+)?)([smh]?)',str(value))
    suffix,factor=units[unit]
    if not match or (match[2] and match[2]!=suffix):
        raise MeteoIntegrityError(f'invalid or contradictory GRIB step {value!r}, unit {unit}')
    seconds=Decimal(match[1])*factor
    if seconds!=seconds.to_integral_value():
        raise MeteoIntegrityError('GRIB step is not an integral second')
    return int(seconds)


def validate_time_window(reference, valid, start, end, unit, kind):
    """Separate initialization, lead, validity and statistical bounds in UTC."""
    if reference.tzinfo is None or valid.tzinfo is None:
        raise MeteoIntegrityError('GRIB time contract requires timezone-aware UTC times')
    reference=reference.astimezone(timezone.utc);valid=valid.astimezone(timezone.utc)
    first=step_seconds(start,unit);last=step_seconds(end,unit)
    if first>last or reference+timedelta(seconds=last)!=valid:
        raise MeteoIntegrityError('GRIB time bounds or initialization + lead != validity')
    if kind=='instant' and first!=last:
        raise MeteoIntegrityError('instant GRIB must have equal start/end bounds')
    if kind=='accum' and first!=0:
        raise MeteoIntegrityError('TOT_PREC accumulation must start at initialization')
    if kind=='max' and (last%3600 or first!=max(0,last-3600)):
        raise MeteoIntegrityError('VMAX_10M must cover the preceding native hour (zero at initialization)')
    if kind not in {'instant','accum','max'}:
        raise MeteoIntegrityError(f'unsupported core GRIB processing {kind!r}')
    return {'forecast_reference_time':reference.isoformat(),'lead_seconds':last,
            'valid_time':valid.isoformat(),
            'time_bounds':[(reference+timedelta(seconds=first)).isoformat(),valid.isoformat()],
            'processing':kind}


def inspect_grib_header(gid, expected_run: datetime | None = None, expected_parameter=None):
    from eccodes import codes_get, codes_get_long
    edition = int(codes_get_long(gid, 'edition'))
    centre = int(codes_get_long(gid, 'centre'))
    if edition != 2:
        raise MeteoIntegrityError(f'GRIB edition {edition}: DWD RUC requires GRIB2')
    if centre != 78:
        raise MeteoIntegrityError(f'GRIB originating centre {centre}: expected DWD/Offenbach 78')
    data_date = int(codes_get_long(gid, 'dataDate'))
    data_time = int(codes_get_long(gid, 'dataTime'))
    valid_date = int(codes_get_long(gid, 'validityDate'))
    valid_time = int(codes_get_long(gid, 'validityTime'))
    try:
        valid = datetime.strptime(f'{valid_date:08d}{valid_time:04d}', '%Y%m%d%H%M').replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise MeteoIntegrityError('invalid GRIB validity date/time') from exc
    if expected_run is not None:
        validate_grib_origin(data_date, data_time, expected_run)
        if valid < expected_run.astimezone(timezone.utc):
            raise MeteoIntegrityError('GRIB valid time predates the requested RUC initialization')
    signature = (
        int(codes_get_long(gid, 'discipline')),
        int(codes_get_long(gid, 'parameterCategory')),
        int(codes_get_long(gid, 'parameterNumber')),
        str(codes_get(gid, 'typeOfLevel')),
        float(codes_get(gid, 'level')),
        str(codes_get(gid, 'gridType')),
        int(codes_get_long(gid, 'numberOfPoints')),
    )
    if signature[-1] <= 0:
        raise MeteoIntegrityError('GRIB has no native grid points')
    def surface(which):
        code=int(codes_get_long(gid,f'typeOf{which}FixedSurface'))
        if code==255:return code,None
        scale=int(codes_get_long(gid,f'scaleFactorOf{which}FixedSurface'))
        value=int(codes_get_long(gid,f'scaledValueOf{which}FixedSurface'))
        if scale==2147483647 or value==2147483647:
            # Generic GRIB surface templates may omit an inapplicable value.
            # Calibrated RUC contracts below still require their exact values.
            return code,None
        return code,Decimal(value)*(Decimal(10)**(-scale))
    first=surface('First');second=surface('Second')
    kind=str(codes_get(gid,'stepType'))
    grid=None
    if signature[-2]=='unstructured_grid':
        grid=(str(codes_get(gid,'uuidOfHGrid')).lower(),
              int(codes_get_long(gid,'numberOfGridUsed')),
              int(codes_get_long(gid,'numberOfGridInReference')),signature[-1])
        if grid!=NATIVE_GRID:
            raise MeteoIntegrityError(f'RUC native grid identity differs: {grid}')
    contract=CORE_CONTRACTS.get(expected_parameter) or OPTIONAL_MU_CONTRACTS.get(expected_parameter)
    if expected_parameter is not None and grid is None:
        raise MeteoIntegrityError(f'{expected_parameter}: expected native unstructured RUC grid')
    if contract is not None:
        actual=(*signature[:3],*first,*second,kind)
        if actual!=contract:
            raise MeteoIntegrityError(f'{expected_parameter}: fixed GRIB parameter/level/processing differs: {actual}')
        reference=datetime.strptime(f'{data_date:08d}{data_time:04d}','%Y%m%d%H%M').replace(tzinfo=timezone.utc)
        validate_time_window(reference,valid,codes_get(gid,'startStep'),codes_get(gid,'endStep'),
                             int(codes_get_long(gid,'stepUnits')),kind)
    # Preserve gridType/point-count as the final two fields for existing callers.
    signature=(*signature[:5],first,second,kind if contract is not None else None,grid,*signature[5:])
    return valid, signature


def assert_same_parameter_signature(name: str, reference, candidate):
    """Fail closed on silently mixed parameter/level/grid inside one logical RUC product."""
    if reference is not None and tuple(reference) != tuple(candidate):
        raise MeteoIntegrityError(
            f'{name}: GRIB discipline/category/number, level or grid differs '
            f'within a product sequence: expected {reference}, received {candidate}'
        )
    return tuple(candidate)

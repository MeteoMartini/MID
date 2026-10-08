"""Metadata-first DWD ICON-D2 RUC GRIB2 guards.

Use decoded GRIB section headers, never filenames as the sole field authority.
WMO Common Table C-1 defines originating centre 78 as Offenbach/RSMC.
The per-parameter signature is checked for intra-run consistency; fixed
shortName/level tables require separate live-product calibration.
"""
from __future__ import annotations

from datetime import datetime, timezone
from meteo_integrity import MeteoIntegrityError, validate_grib_origin


def inspect_grib_header(gid, expected_run: datetime | None = None):
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
    return valid, signature


def assert_same_parameter_signature(name: str, reference, candidate):
    """Fail closed on silently mixed parameter/level/grid inside one logical RUC product."""
    if reference is not None and tuple(reference) != tuple(candidate):
        raise MeteoIntegrityError(
            f'{name}: GRIB discipline/category/number, level or grid differs '
            f'within a product sequence: expected {reference}, received {candidate}'
        )
    return tuple(candidate)

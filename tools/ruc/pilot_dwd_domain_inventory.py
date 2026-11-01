#!/usr/bin/env python3
"""Read-only multi-run DWD ICON-D2 grid/bitmap inventory; never publishes.

Use source-provided GRIB files and a pinned SHA manifest, not HTTP fallbacks.
The result is source *evidence*, not a renderer or full-domain admission gate.
"""
from __future__ import annotations
import argparse,bz2,hashlib,json,re,tempfile
from pathlib import Path
from datetime import datetime, timedelta
import numpy as np

SCHEMA='mid.dwd.domain-inventory.v1'
MODELS={'icon-d2','icon-d2-ruc'}
GRIDS={'regular_ll','rotated_ll','unstructured_grid'}
MAX_FILE_BYTES=80_000_000


def field_statistics(lats,lons,values,grid_type,*,bitmap_present,number_of_points):
    """Compute independent geographic/valid-value coverage, keeping real zeros."""
    lat=np.asarray(lats,dtype=np.float64).reshape(-1)
    lon=np.asarray(lons,dtype=np.float64).reshape(-1)
    val=np.asarray(values,dtype=np.float64).reshape(-1)
    if grid_type not in GRIDS or not (0<len(lat)==len(lon)==len(val)==number_of_points):
        raise ValueError('Unverified grid type or point count')
    if not np.all(np.isfinite(lat)) or not np.all(np.isfinite(lon)):
        raise ValueError('Invalid native coordinates; CLAT/CLON verification required')
    if np.any((lat < -90)|(lat > 90)|(lon < -180)|(lon > 360)):
        raise ValueError('Invalid geographic coordinate range')
    valid=np.isfinite(val)
    if not np.any(valid):raise ValueError('No covered meteorological cells')
    if bitmap_present not in (0,1):raise ValueError('Unverified bitmap indicator')
    lon=((lon+180)%360)-180
    def ext(a):return [round(float(np.min(a)),6),round(float(np.max(a)),6)]
    return {'gridType':grid_type,'points':int(len(val)),'validPoints':int(valid.sum()),
            'missingPoints':int((~valid).sum()),'realZeroPoints':int(np.count_nonzero(valid&(val==0))),
            'coordinateLatitudeRange':ext(lat),'coordinateLongitudeRange':ext(lon),
            'validLatitudeRange':ext(lat[valid]),'validLongitudeRange':ext(lon[valid]),
            'valueRange':ext(val[valid]),'bitmapPresent':int(bitmap_present)}


def assert_bitmap_decoding(values,bitmap_present,bits=None):
    """Require the ecCodes decoded missing mask to equal GRIB Section 6."""
    v=np.asarray(values,dtype=np.float64).reshape(-1)
    if bitmap_present==0:
        if bits is not None or not np.isfinite(v).all():
            raise ValueError('Unmasked GRIB contains missing or non-finite cells')
    elif bitmap_present==1:
        b=np.asarray(bits).reshape(-1)
        if b.shape!=v.shape or not np.all((b==0)|(b==1)):
            raise ValueError('Invalid GRIB Section-6 bitmap')
        if np.any(np.isfinite(v)!=(b==1)):
            raise ValueError('GRIB bitmap and decoded valid values differ')
    else:raise ValueError('Unsupported GRIB Section-6 bitmap indicator')


def assert_grib_identity(actual,record,step_type):
    expected=record.get('wmoParameter')
    if (not isinstance(expected,list) or len(expected)!=3 or
            any(type(v) is not int or not 0<=v<=255 for v in expected)):
        raise ValueError('Missing pinned WMO parameter identity')
    if list(actual)!=expected or step_type!=record.get('stepType'):
        raise ValueError('GRIB parameter or statistical processing identity drift: '+json.dumps({'model':record.get('model'),'field':record.get('parameter'),'run':record.get('run'),'leadHours':record.get('leadHours'),'actual':list(actual),'expected':expected,'actualStepType':step_type,'expectedStepType':record.get('stepType')},sort_keys=True))


def assert_dwd_native_total_precipitation(record,centre,unit,statistical_processing,start_step,end_step):
    """DWD ICON-D2 TOT_PREC: WMO 0/1/52 + statistical accumulation.

    WMO 0/1/52 by itself denotes a rate. Only the DWD local total
    precipitation product with accumulation operator 1, cumulative 0..lead
    and mass-per-area units is admitted, never a raw precipitation rate.
    """
    if record.get('model')!='icon-d2' or record.get('parameter')!='tot_prec' or record.get('wmoParameter')!=[0,1,52]:
        raise ValueError('DWD native total precipitation source/parameter mismatch')
    lead=record.get('leadHours')
    actual={'centre':centre,'units':str(unit),'statisticalProcessing':statistical_processing,'startStep':start_step,'endStep':end_step}
    if (type(centre) is not int or centre!=78 or type(statistical_processing) is not int or statistical_processing!=1
            or type(start_step) is not int or start_step!=0 or type(end_step) is not int or end_step!=lead
            or str(unit).replace(' ','').lower() not in {'kgm**-2','kgm-2'}):
        raise ValueError('DWD native precipitation accumulation semantics drift: '+
                         json.dumps({'field':'tot_prec','run':record.get('run'),'leadHours':lead,'actual':actual,
                                     'expected':{'centre':78,'units':'kg m^-2','statisticalProcessing':1,
                                                 'startStep':0,'endStep':lead}},sort_keys=True))


def native_coordinates(record, root, gid):
    """Bind original DWD CLAT/CLON by hashes and native grid identity.

    Native point indices are preserved. No nearest-cell sampling or regridding.
    Coordinate fields are time-constant; UUID/point-order identity, not forecast
    validity, is the authority for attaching them to an original scalar field.
    """
    from eccodes import codes_grib_new_from_file, codes_get, codes_get_array, codes_get_long, codes_release
    bindings = record.get('nativeCoordinates')
    if not isinstance(bindings, dict) or set(bindings) != {'latitude', 'longitude'}:
        raise ValueError('Native GRIB requires SHA-pinned CLAT/CLON bindings')
    keys = ('uuidOfHGrid', 'numberOfGridUsed', 'numberOfGridInReference', 'numberOfPoints')
    identity = tuple(str(codes_get(gid, key)).lower() for key in keys)
    arrays = []
    provenance = {}
    for axis, parameter in (('latitude', 1), ('longitude', 2)):
        entry = bindings[axis]
        if not isinstance(entry, dict) or set(entry) != {'path', 'sha256'}:
            raise ValueError('Incomplete native coordinate binding')
        path = (root / entry['path']).resolve(strict=True)
        if not path.is_relative_to(root.resolve()) or not 0 < path.stat().st_size <= MAX_FILE_BYTES:
            raise ValueError('Native coordinate path or byte budget invalid')
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if not re.fullmatch('[a-f0-9]{64}', str(entry['sha256'])) or digest != entry['sha256']:
            raise ValueError('Native coordinate SHA drift')
        # Coordinate binaries have the same bounded file/decompression contract.
        with tempfile.TemporaryFile() as stream:
            with (bz2.BZ2File(path) if path.name.endswith('.bz2') else path.open('rb')) as source:
                total = 0
                for chunk in iter(lambda: source.read(1_048_576), b''):
                    total += len(chunk)
                    if total > MAX_FILE_BYTES * 8:
                        raise ValueError('Native coordinate decoded byte budget exceeded')
                    stream.write(chunk)
            stream.seek(0)
            handle = codes_grib_new_from_file(stream)
            if handle is None:
                raise ValueError('Empty native coordinate GRIB')
            try:
                actual = tuple(str(codes_get(handle, key)).lower() for key in keys)
                signature = tuple(int(codes_get_long(handle, key)) for key in
                                  ('centre', 'discipline', 'parameterCategory', 'parameterNumber'))
                if (actual != identity or codes_get(handle, 'gridType') != 'unstructured_grid'
                        or int(codes_get_long(handle, 'edition')) != 2
                        or signature != (78, 0, 191, parameter)):
                    raise ValueError('Native CLAT/CLON grid or WMO identity mismatch')
                values = np.asarray(codes_get_array(handle, 'values'), dtype=np.float64)
                units = str(codes_get(handle, 'units'))
                if units in ('rad', 'radian', 'radians'):
                    values = np.rad2deg(values)
                elif units not in ('degree', 'degrees', *({'latitude': ('degrees_north', 'Degree N'), 'longitude': ('degrees_east', 'Degree E')}[axis])):
                    raise ValueError('Unverified native coordinate units')
                if values.size != int(identity[-1]) or not np.isfinite(values).all():
                    raise ValueError('Incomplete native coordinate cells')
                if axis == 'latitude' and np.any(np.abs(values) > 90):
                    raise ValueError('Native latitude outside physical range')
                if axis == 'longitude' and np.any((values < -180) | (values > 360)):
                    raise ValueError('Native longitude outside physical range')
                arrays.append(values.copy())
                provenance[axis] = {'sha256': digest, 'gridIdentity': list(identity), 'units': units}
                extra = codes_grib_new_from_file(stream)
                if extra is not None:
                    codes_release(extra)
                    raise ValueError('Ambiguous native coordinate messages')
            finally:
                codes_release(handle)
    return arrays[0], arrays[1], provenance


def inventory_record(record,root):
    from eccodes import codes_grib_new_from_file,codes_get,codes_get_array,codes_get_long,codes_release,codes_set
    from grib_bitmap import decode_bitmap_values
    required={'path','sha256','model','parameter','run','leadHours','wmoParameter','stepType'}
    if not isinstance(record,dict) or not required <= record.keys():raise ValueError('Incomplete record identity')
    if record['model'] not in MODELS or not re.fullmatch('[a-z0-9_]+',record['parameter']):
        raise ValueError('Unrecognized model or parameter')
    if not isinstance(record['leadHours'],int) or not 0<=record['leadHours']<=48:
        raise ValueError('Invalid forecast lead')
    if not re.fullmatch('[a-f0-9]{64}',record['sha256']):raise ValueError('Unpinned GRIB SHA')
    path=(root/record['path']).resolve(strict=True)
    if not path.is_relative_to(root.resolve()):raise ValueError('GRIB path escapes pinned root')
    if not 0<path.stat().st_size<=MAX_FILE_BYTES:raise ValueError('Unexpected GRIB file budget')
    digest=hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda:source.read(1_048_576),b''):
            digest.update(chunk)
    if digest.hexdigest()!=record['sha256']:raise ValueError('GRIB SHA drift')
    with tempfile.TemporaryFile() as stream:
        with (bz2.BZ2File(path) if path.name.endswith('.bz2') else path.open('rb')) as source:
            total=0
            for chunk in iter(lambda:source.read(1_048_576),b''):
                total+=len(chunk)
                if total>MAX_FILE_BYTES*8:raise ValueError('Unexpected decoded GRIB budget')
                stream.write(chunk)
        stream.seek(0)
        gid=codes_grib_new_from_file(stream)
        if gid is None:raise ValueError('Empty GRIB')
        try:
            data_date=int(codes_get_long(gid,'dataDate'))
            data_time=int(codes_get_long(gid,'dataTime'))
            run=f'{data_date:08d}T{data_time:04d}'
            if run!=record['run']:raise ValueError('Mixed forecast run')
            codes_set(gid,'stepUnits',1)  # normalize GRIB time units to hours
            lead=int(codes_get_long(gid,'endStep'))
            if lead!=record['leadHours']:raise ValueError('Mixed validity lead')
            assert_grib_valid_time(run,lead,codes_get_long(gid,'validityDate'),codes_get_long(gid,'validityTime'))
            grid_type=str(codes_get(gid,'gridType'))
            points=int(codes_get_long(gid,'numberOfPoints'))
            bitmap=int(codes_get_long(gid,'bitmapPresent'))
            values=decode_bitmap_values(gid)
            bits=codes_get_array(gid,'bitmap') if bitmap==1 else None
            assert_bitmap_decoding(values,bitmap,bits)
            coordinate_provenance = None
            if grid_type == 'unstructured_grid':
                lat, lon, coordinate_provenance = native_coordinates(record, root, gid)
            else:
                lat=codes_get_array(gid,'latitudes')
                lon=codes_get_array(gid,'longitudes')
            stats=field_statistics(lat,lon,values,grid_type,bitmap_present=bitmap,number_of_points=points)
            if coordinate_provenance is not None:stats['nativeCoordinates']=coordinate_provenance
            stats['parameterIdentity']=[int(codes_get_long(gid,k)) for k in ('discipline','parameterCategory','parameterNumber')]
            stats['stepType']=str(codes_get(gid,'stepType'))
            assert_grib_identity(stats['parameterIdentity'],record,stats['stepType'])
            if record['model']=='icon-d2' and record['parameter']=='tot_prec':
                assert_dwd_native_total_precipitation(
                    record,int(codes_get_long(gid,'centre')),str(codes_get(gid,'units')),
                    int(codes_get_long(gid,'typeOfStatisticalProcessing')),
                    int(codes_get_long(gid,'startStep')),lead)

            next_gid=codes_grib_new_from_file(stream)
            if next_gid is not None:
                # Audit the exact offending original headers, never silently
                # take GRIB message 1 or convert another message's time window.
                extras=[]
                truncated=False
                try:
                    for i in range(4):
                        if next_gid is None:break
                        try:
                            extras.append({
                                'discipline':int(codes_get_long(next_gid,'discipline')),
                                'category':int(codes_get_long(next_gid,'parameterCategory')),
                                'parameter':int(codes_get_long(next_gid,'parameterNumber')),
                                'startStep':int(codes_get_long(next_gid,'startStep')),
                                'endStep':int(codes_get_long(next_gid,'endStep')),
                                'stepType':str(codes_get(next_gid,'stepType')),
                                'typeOfLevel':str(codes_get(next_gid,'typeOfLevel')),
                                'level':int(codes_get_long(next_gid,'level')),
                            })
                        finally:codes_release(next_gid)
                        next_gid=codes_grib_new_from_file(stream)
                finally:
                    truncated=next_gid is not None
                    if next_gid is not None:codes_release(next_gid)
                raise ValueError('Multiple original GRIB messages need field-specific selection: '+
                                 json.dumps({'model':record['model'],'field':record['parameter'],
                                             'run':record['run'],'leadHours':lead,
                                             'firstIdentity':stats['parameterIdentity'],
                                             'firstStepType':stats['stepType'],
                                             'additionalHeaders':extras,
                                             'moreThanFourExtraMessages':truncated},
                                            sort_keys=True))
            return {k:record[k] for k in ('model','parameter','run','leadHours')}|{'sourceSha256':record['sha256'],**stats}
        finally:codes_release(gid)


def assert_grib_valid_time(run, lead_hours, validity_date, validity_time):
    """Bind original GRIB validity UTC to the source model init and end lead."""
    if not isinstance(run,str) or not re.fullmatch(r'[0-9]{8}T[0-9]{4}',run):
        raise ValueError('Invalid original DWD UTC initialization')
    if type(lead_hours) is not int or not 0<=lead_hours<=48:
        raise ValueError('Invalid original forecast lead')
    try:
        initialized=datetime.strptime(run,'%Y%m%dT%H%M')
        valid=datetime.strptime(f'{int(validity_date):08d}T{int(validity_time):04d}','%Y%m%dT%H%M')
    except (TypeError,ValueError) as exc:
        raise ValueError('Invalid original GRIB validity timestamp') from exc
    if valid!=initialized+timedelta(hours=lead_hours):
        raise ValueError('GRIB validity differs from original init plus lead')


def assert_run_cadence(model, runs):
    """Require consecutive original UTC cycles, not just three arbitrary model runs."""
    if model not in MODELS or not isinstance(runs,(set,list,tuple)) or len(runs)<3:
        raise ValueError('Unqualified model run collection')
    if any(not isinstance(run,str) or not re.fullmatch(r'[0-9]{8}T[0-9]{4}',run) for run in runs):
        raise ValueError('Invalid original DWD UTC initialization')
    try:
        ordered=sorted(datetime.strptime(run,'%Y%m%dT%H%M') for run in runs)
    except (ValueError,TypeError) as exc:
        raise ValueError('Invalid original DWD UTC initialization') from exc
    cadence=timedelta(hours=1 if model=='icon-d2-ruc' else 3)
    if any(run.minute!=0 or run.second!=0 or (model=='icon-d2' and run.hour%3!=0) for run in ordered):
        raise ValueError('Original DWD UTC cycle misaligned')
    if any(right-left!=cadence for left,right in zip(ordered,ordered[1:])):
        raise ValueError('Original DWD runs are not consecutive')


def validate_collection(records,*,parameters,leads,required_runs=3):
    if not records or not isinstance(parameters,dict) or not parameters or not isinstance(leads,dict):
        raise ValueError('No complete parameter scope')
    expected={(model,parameter) for model,params in parameters.items() for parameter in params}
    if set(parameters)-MODELS or not expected or any(not isinstance(ps,list) or not ps for ps in parameters.values()):
        raise ValueError('Invalid expected parameter scope')
    if set(leads)!={f'{m}/{p}' for m,p in expected}:raise ValueError('Unspecified parameter/lead scope')
    for key,hours in leads.items():
        if not isinstance(hours,list) or not hours or any(type(h) is not int or not 0<=h<=48 for h in hours) or len(set(hours))!=len(hours):
            raise ValueError('Invalid expected forecast leads: '+key)
    seen=set();groups={key:set() for key in expected};coverage=[]
    for r in records:
        pair=(r['model'],r['parameter']);ident=pair+(r['run'],r['leadHours'])
        if pair not in expected or ident in seen:raise ValueError('Unknown or duplicate source run/parameter/lead')
        seen.add(ident);groups[pair].add(r['run']);coverage.append(r)
    insufficient={f'{m}/{p}':len(runs) for (m,p),runs in groups.items() if len(runs)<required_runs}
    if insufficient:raise ValueError('Insufficient distinct native runs: '+json.dumps(insufficient,sort_keys=True))
    for (model,_parameter),runs in groups.items():assert_run_cadence(model,runs)
    for model in parameters:
        parameter_sets=[groups[(model,p)] for p in parameters[model]]
        if any(runs!=parameter_sets[0] for runs in parameter_sets[1:]):raise ValueError('Mixed model cycles across parameters')
        for param in parameters[model]:
            expected_leads=set(leads[f'{model}/{param}'])
            for run in groups[(model,param)]:
                observed={ident[3] for ident in seen if ident[:3]==(model,param,run)}
                if observed!=expected_leads:
                    raise ValueError(f'Incomplete or unexpected forecast leads: {model}/{param}/{run}')
    return {'schema':SCHEMA,'requiredRuns':required_runs,'expectedParameters':parameters,'expectedLeads':leads,
            'records':coverage,'runCounts':{f'{m}/{p}':len(runs) for (m,p),runs in groups.items()},
            'fullDomainProductionApproved':False}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=Path,required=True)
    p.add_argument('--manifest',type=Path,required=True)
    args=p.parse_args()
    manifest=json.loads(args.manifest.read_bytes())
    if manifest.get('schema')!='mid.dwd.domain-inventory-input.v1':raise ValueError('Invalid pinned manifest schema')
    rows=[inventory_record(record,args.root) for record in manifest['records']]
    print(json.dumps(validate_collection(rows,parameters=manifest['expectedParameters'],leads=manifest['expectedLeads']),ensure_ascii=False,allow_nan=False,separators=(',',':')))

if __name__=='__main__':main()

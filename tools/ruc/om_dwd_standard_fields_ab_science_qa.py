#!/usr/bin/env python3
"""Same-run DWD RUC original vs processed Open-Meteo full-array base-map QA.

Science-only comparison, no production import or external GPL library shipping.
Actual native GRIB provenance/header, missing masks, intervals and units retained.
All comparison outputs are descriptive; no automatic numerical admission.
"""
from __future__ import annotations
from datetime import datetime,timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import numpy as np

from om_dwd_t2m_ab_science_qa import (
    RUN, VALID, OM_URL, NATIVE_CELLS, secure_download
)

FIELDS=(
    ('PMSL','pressure_msl','Pa','instant',None),
    ('U_10M','wind_u_component_10m','m/s','instant',10),
    ('V_10M','wind_v_component_10m','m/s','instant',10),
    ('VMAX_10M','wind_gusts_10m','m/s','max',10),
    ('CLCT','cloud_cover','fraction-or-percent','instant',None),
)
BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/'


def decode_field(filepath,parameter,kind,expected_level):
    from eccodes import codes_get,codes_get_array,codes_grib_new_from_file,codes_release,codes_set
    with open(filepath,'rb') as stream:
        gid=codes_grib_new_from_file(stream)
        if gid is None:raise ValueError('empty GRIB '+parameter)
        try:
            codes_set(gid,'stepUnits',1)
            get=lambda key:codes_get(gid,key)
            meta={
                'parameter':parameter,
                'run':f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}',
                'valid':f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}',
                'gridType':str(get('gridType')),'units':str(get('units')),
                'shortName':str(get('shortName')),'paramId':int(get('paramId')),
                'stepType':str(get('stepType')),'startStep':int(get('startStep')),
                'endStep':int(get('endStep')),'pointCount':int(get('numberOfPoints')),
                'typeOfLevel':str(get('typeOfLevel')),'level':int(get('level')),
                'bitmapPresent':int(get('bitmapPresent')),
                'missingValue':float(get('missingValue'))}
            if (meta['run']!=RUN.strftime('%Y%m%d%H%M') or
                meta['valid']!=VALID.strftime('%Y%m%d%H%M') or
                meta['gridType']!='unstructured_grid' or
                meta['pointCount']!=NATIVE_CELLS or meta['endStep']!=1 or
                meta['stepType']!=kind or
                (kind=='max' and meta['startStep']>=meta['endStep'])):
                raise ValueError('unexpected original DWD native GRIB header '+str(meta))
            if (expected_level is not None and
                (meta['typeOfLevel']!='heightAboveGround' or
                 meta['level']!=expected_level)):
                raise ValueError('original DWD RUC height mismatch')
            raw=np.asarray(codes_get_array(gid,'values'),dtype=np.float64).reshape(-1)
            if raw.size!=NATIVE_CELLS:raise ValueError('original DWD points truncated')
            available=np.isfinite(raw)&(raw!=meta['missingValue'])
            if parameter=='PMSL':
                if meta['units']!='Pa':raise ValueError('pressure source not Pa')
                transformed=raw/100
                outputUnit='hPa'
            elif parameter=='CLCT':
                if meta['units'] not in ('%','1'):raise ValueError('cloud fraction unit')
                transformed=raw*100 if meta['units']=='1' else raw
                outputUnit='%'
            else:
                if meta['units'] not in ('m s**-1','m s-1'):raise ValueError('wind unit')
                transformed=raw
                outputUnit='m/s'
            return transformed,available,meta,outputUnit
        finally:codes_release(gid)


def run():
    from omfiles import OmFileReader
    reports=[]
    with TemporaryDirectory(prefix='mid-om-dwd-fields-qa-') as folder:
        om_path=Path(folder)/'ruc_om.om'
        om_source=secure_download(OM_URL,om_path,'om')
        with OmFileReader(str(om_path)) as root:
            if not root.is_group:raise ValueError('missing OM spatial group')
            for param,variable,expected,step_type,level in FIELDS:
                url=BASE+param+'/r/2026-11-03T07:00/s/PT001H00M.grib2'
                path=Path(folder)/(param+'.grib2')
                original_source=secure_download(url,path,'dwd')
                dwd,good,meta,unit=decode_field(path,param,step_type,level)
                obj=root.get_child_by_name(variable)
                if not obj.is_array or tuple(obj.shape)!=(1,NATIVE_CELLS):
                    raise ValueError('wrong processed OM field shape '+variable)
                om=np.asarray(obj.read_array((...)),dtype=np.float64).reshape(-1)
                om_good=np.isfinite(om)
                paired=good&om_good
                if paired.sum()<NATIVE_CELLS//2:
                    raise ValueError('too few valid cells '+variable)
                x=dwd[paired];y=om[paired];delta=y-x;absdiff=np.abs(delta)
                metrics={
                    'sourceField':param,'omVariable':variable,
                    'originalDwdGrib':meta,'comparisonUnits':unit,
                    'dwdBytes':original_source['bytes'],'dwdSha256':original_source['sha256'],
                    'omSha256':om_source['sha256'],
                    'comparedCells':int(paired.sum()),'DwdMissingCells':int((~good).sum()),
                    'OmMissingCells':int((~om_good).sum()),
                    'missingMismatchCells':int(np.count_nonzero(good!=om_good)),
                    'sourceMin':float(x.min()),'sourceMax':float(x.max()),
                    'omMin':float(y.min()),'omMax':float(y.max()),
                    'meanDifference':float(delta.mean()),'mae':float(absdiff.mean()),
                    'p95Abs':float(np.quantile(absdiff,.95)),
                    'p99Abs':float(np.quantile(absdiff,.99)),
                    'maxAbs':float(absdiff.max()),
                    'allFieldsProven':False,'nativeCoordinatesVerified':False,
                    'quantizationCalibrationApproved':False,'productionEligible':False
                }
                reports.append(metrics)
    print(json.dumps({'schema':'mid.ruc.dwd-vs-om.standard-fields-ab.v1',
        'observedAt':datetime.now(timezone.utc).isoformat(),
        'modelRun':RUN.isoformat(),'validTime':VALID.isoformat(),
        'fullGridCellCount':NATIVE_CELLS,'fields':reports,
        'licensedReaderDistributedInMID':False,
        'allNativeParametersProven':False,'eps20Proven':False,
        'fiveMinutePrecipProven':False,'productionEligible':False},indent=2,allow_nan=False))


if __name__=='__main__':
    run()

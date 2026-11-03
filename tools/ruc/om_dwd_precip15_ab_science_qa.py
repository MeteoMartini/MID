#!/usr/bin/env python3
"""Science-only native 15min DWD RUC accumulated TOT_PREC vs processed OM.

This script independently reads same-run DWD GRIB accumulated fields
T+15m, T+45m, T+60m and compares T+15 / T+60 interval amounts against OM.
No production consumers are changed. Missing remains missing; no 0 fill.
All metrics descriptive; no source promotion based on this comparison.
GPL omfiles reader stays in ephemeral branch-only CI scientific venv.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import numpy as np
from om_dwd_t2m_ab_science_qa import RUN, NATIVE_CELLS, secure_download

DWD_ROOT='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/TOT_PREC/r/2026-11-03T07:00/s/'
OM_ROOT='https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2_ruc_native_15min/2026/11/03/0700Z/'
STEPS=(15,45,60)
END_TIMES=(15,60)


def native_step_grib(path,minutes):
    from eccodes import codes_get, codes_get_array, codes_grib_new_from_file,codes_release
    with open(path,'rb') as stream:
        gid=codes_grib_new_from_file(stream)
        if gid is None:raise ValueError('empty original DWD rapid GRIB')
        try:
            get=lambda name:codes_get(gid,name)
            meta={
                'run':f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}',
                'valid':f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}',
                'stepType':str(get('stepType')),'stepUnits':str(get('stepUnits')),
                'startStep':float(get('startStep')),'endStep':float(get('endStep')),
                'gridType':str(get('gridType')),'units':str(get('units')),
                'shortName':str(get('shortName')),'paramId':int(get('paramId')),
                'bitmapPresent':int(get('bitmapPresent')),
                'pointCount':int(get('numberOfPoints')),
                'missingValue':float(get('missingValue'))}
            target=(RUN+timedelta(minutes=minutes)).strftime('%Y%m%d%H%M')
            if (meta['run']!=RUN.strftime('%Y%m%d%H%M') or
                meta['valid']!=target or
                meta['gridType']!='unstructured_grid' or
                meta['pointCount']!=NATIVE_CELLS or
                meta['stepType']!='accum' or
                meta['units'] not in ('kg m**-2','kg m-2','mm') or
                meta['startStep']!=0):
                raise ValueError('original DWD rapid GRIB run/grid/accumulation unit contract: '+str(meta))
            values=np.asarray(codes_get_array(gid,'values'),dtype=np.float64).reshape(-1)
            if values.size!=NATIVE_CELLS:raise ValueError('native precip grid points drift')
            present=np.isfinite(values)&(values!=meta['missingValue'])
            if np.any((values[present]<-.02)|(values[present]>1000)):
                raise ValueError('physical range failure for cumulative source')
            return values,present,meta
        finally:codes_release(gid)


def processed_om_rain(path):
    from omfiles import OmFileReader
    with OmFileReader(str(path)) as root:
        if not root.is_group:raise ValueError('not spatial OM group')
        node=root.get_child_by_name('precipitation')
        if not node.is_array or tuple(node.shape)!=(1,NATIVE_CELLS):
            raise ValueError('non-native processed precipitation shape')
        values=np.asarray(node.read_array((...)),dtype=np.float64).reshape(-1)
        available=np.isfinite(values)
        if np.any((values[available]<-.02)|(values[available]>1000)):
            raise ValueError('nonphysical processed precipitation amount')
        return values,available


def main():
    data={};sources={};results=[]
    with TemporaryDirectory(prefix='mid-dwd-om-precip-qa-') as root:
        for minutes in STEPS:
            path=Path(root)/(f'P{minutes}.grib2')
            src=DWD_ROOT+f'PT{minutes//60:03d}H{minutes%60:02d}M.grib2'
            sources[minutes]=secure_download(src,path,'dwd')
            data[minutes]=native_step_grib(path,minutes)
        for minutes in END_TIMES:
            valid=RUN+timedelta(minutes=minutes)
            source=OM_ROOT+valid.strftime('%Y-%m-%dT%H%M.om')
            path=Path(root)/(f'O{minutes}.om')
            sourceOm=secure_download(source,path,'om')
            observed,exists=processed_om_rain(path)
            if minutes==15:
                cumulative,good,meta=data[minutes]
                originalInterval=cumulative
                start=0
            else:
                cumulative,good,meta=data[minutes]
                previous,previous_good,previous_meta=data[minutes-15]
                originalInterval=cumulative-previous
                good=good&previous_good
                start=minutes-15
            paired=good&exists
            if paired.sum()<NATIVE_CELLS//2:raise ValueError('too few paired precip cells')
            original=originalInterval[paired];processed=observed[paired]
            negatives=int(np.count_nonzero(original<-.02))
            if negatives: raise ValueError('negative source increment / reset (not clamped)')
            delta=processed-original;absdiff=np.abs(delta)
            results.append({
                'intervalStartMinutes':start,
                'intervalEndMinutes':minutes,
                'DwdIsCumulativeSinceInit':True,
                'DwdOriginalCurrentGrib':meta,
                'DwdSourceCurrent':sources[minutes],
                'DwdSourcePrevious':sources.get(start),
                'OmSource':sourceOm,
                'pairedCells':int(paired.sum()),
                'DwdMissingCells':int(np.count_nonzero(~good)),
                'OmMissingCells':int(np.count_nonzero(~exists)),
                'maskMismatch':int(np.count_nonzero(good!=exists)),
                'DwdAmountMinMm':float(original.min()),
                'DwdAmountMaxMm':float(original.max()),
                'OmAmountMin':float(processed.min()),
                'OmAmountMax':float(processed.max()),
                'mae':float(absdiff.mean()),
                'p95Abs':float(np.quantile(absdiff,.95)),
                'p99Abs':float(np.quantile(absdiff,.99)),
                'maxAbs':float(absdiff.max()),
                'dryDwdCells':int(np.count_nonzero(original==0)),
                'dryOmCells':int(np.count_nonzero(processed==0)),
                'semanticsVerifiedForThisRunOnly':True,
                'fiveMinuteCadenceCovered':False,
                'productionEligible':False,
            })
    print(json.dumps({'schema':'mid.ruc.dwd-original-vs-om.15min-precip-shadow.v1',
        'sourceRun':RUN.isoformat(),'observedAt':datetime.now(timezone.utc).isoformat(),
        'results':results,'nativeDwdGridCoordinatesProven':False,
        'eps20Proven':False,'omPrecipAccumulationEveryHourVerified':False,
        'productionEligible':False},indent=2,allow_nan=False))


if __name__=='__main__':
    main()

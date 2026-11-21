#!/usr/bin/env python3
"""Pinned same-run ICON-D2-RUC T2M DWD-GRIB vs processed OM numeric A/B.

READ-ONLY SCIENTIFIC QA on one historical available source run.
Genuine same run/time and 542,040 cells are required; no coercion of Missing
to zero and no claim of native coordinate/bitmap/value equivalence.
OmFileReader GPL-2.0 and ecCodes are ephemeral CI-only science tools,
NOT linked, installed, shipped or used in MID production.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import math
import urllib.parse
import urllib.request
import numpy as np

RUN = datetime(2026, 11, 3, 7, 0, tzinfo=timezone.utc)
VALID = RUN + timedelta(hours=1)
HOSTS = {
  'dwd': 'opendata.dwd.de',
  'om': 'openmeteo.s3.amazonaws.com',
}
DWD_URL = ('https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/'
  '2026-11-03T07:00/s/PT001H00M.grib2')
OM_URL = ('https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2_ruc_native/'
  '2026/11/03/0700Z/2026-11-03T0800.om')
NATIVE_CELLS = 542040
MAX_SIZES = {'dwd': 5_000_000, 'om': 20_000_000}


def secure_download(url, path, origin):
    host=HOSTS[origin];parsed=urllib.parse.urlparse(url)
    if parsed.scheme!='https' or parsed.hostname!=host or parsed.query or parsed.fragment:
        raise ValueError('unapproved original source URL')
    total=0;hashing=hashlib.sha256()
    req=urllib.request.Request(url,headers={'Accept':'application/octet-stream'})
    with urllib.request.urlopen(req,timeout=30) as response:
        if response.status!=200 or urllib.parse.urlparse(response.geturl()).hostname!=host:
            raise ValueError('unexpected original source redirect or status')
        limit=MAX_SIZES[origin]
        if int(response.headers.get('Content-Length','0') or 0)>limit:
            raise ValueError('original source length over budget')
        with open(path,'wb') as out:
            while True:
                data=response.read(min(1_048_576,limit-total+1))
                if not data:break
                total+=len(data)
                if total>limit:raise ValueError('oversized original source stream')
                hashing.update(data);out.write(data)
    if total<64:raise ValueError('incomplete original source')
    return {'url':url,'bytes':total,'sha256':hashing.hexdigest()}


def original_dwd_t2m(grib):
    from eccodes import codes_get, codes_get_array, codes_grib_new_from_file, codes_release, codes_set
    with open(grib,'rb') as stream:
        gid=codes_grib_new_from_file(stream)
        if gid is None:raise ValueError('empty DWD GRIB')
        try:
            codes_set(gid,'stepUnits',1)
            get=lambda key:codes_get(gid,key)
            reference=f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}'
            validity=f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}'
            expected_reference=RUN.strftime('%Y%m%d%H%M')
            expected_valid=VALID.strftime('%Y%m%d%H%M')
            props={'run':reference,'valid':validity,'endStep':int(get('endStep')),
                 'stepType':str(get('stepType')),'gridType':str(get('gridType')),
                 'units':str(get('units')),'shortName':str(get('shortName')),
                 'parameterId':int(get('paramId')),
                 'numberOfPoints':int(get('numberOfPoints')),
                 'levelType':str(get('typeOfLevel')),'level':int(get('level'))}
            if (reference!=expected_reference or validity!=expected_valid or
                props['endStep']!=1 or props['stepType']!='instant' or
                props['gridType']!='unstructured_grid' or
                props['units']!='K' or props['numberOfPoints']!=NATIVE_CELLS or
                props['levelType']!='heightAboveGround' or props['level']!=2):
                raise ValueError('DWD native T2M metadata differs from pinned scientific target: '+str(props))
            values=np.asarray(codes_get_array(gid,'values'),dtype=np.float64).reshape(-1)
            if values.size!=NATIVE_CELLS:raise ValueError('DWD decoded wrong native cell count')
            missing_value=float(get('missingValue'))
            finite=np.isfinite(values)&(values!=missing_value)
            props['missingValueSentinel']=missing_value
            props['bitmapPresent']=int(get('bitmapPresent'))
            props['finiteCount']=int(finite.sum())
            return values,finite,props
        finally:codes_release(gid)


def processed_om_t2m(file):
    from omfiles import OmFileReader
    with OmFileReader(str(file)) as root:
        if not root.is_group:raise ValueError('not OM spatial group')
        node=root.get_child_by_name('temperature_2m')
        if not node.is_array:raise ValueError('temperature missing in OM object')
        shape=tuple(int(x) for x in node.shape)
        if shape!=(1,NATIVE_CELLS):raise ValueError('OM spatial T2M unexpected 542040-cell shape')
        values=np.asarray(node.read_array((...)),dtype=np.float64).reshape(-1)
        if values.size!=NATIVE_CELLS:raise ValueError('OM spatial array truncated')
        return values,np.isfinite(values),shape


def numerical_report(raw_values,raw_good,om_values,om_good,props,shape,sources):
    both=raw_good & om_good
    if int(both.sum())<NATIVE_CELLS//2:raise ValueError('insufficient paired source cells')
    original_c=raw_values[both]-273.15
    processed_c=om_values[both]
    if np.any((original_c<-110)|(original_c>75)) or np.any((processed_c<-110)|(processed_c>75)):
        raise ValueError('nonphysical source temperature')
    deviations=processed_c-original_c
    absdiff=np.abs(deviations)
    report={
      'schema':'mid.ruc.dwd-original-vs-om-processed.t2m-shadow.v1',
      'observedAt':datetime.now(timezone.utc).isoformat(),
      'sourceRun':RUN.isoformat(),'validTime':VALID.isoformat(),
      'DwdNativeCells':NATIVE_CELLS,'omShape':list(shape),
      'DwdMetadata':props,
      'sourceObjects':sources,
      'nativeIndexPairedCells':int(both.sum()),
      'dwdMissingCells':int((~raw_good).sum()),
      'omMissingCells':int((~om_good).sum()),
      'missingMaskDisagreementCells':int(np.count_nonzero(raw_good!=om_good)),
      'sourceOriginalDwdTempC':{'min':float(original_c.min()),'max':float(original_c.max())},
      'sourceProcessedOmTempC':{'min':float(processed_c.min()),'max':float(processed_c.max())},
      'numericDifferenceOmMinusDwdC':{
        'mean':float(deviations.mean()),
        'mae':float(absdiff.mean()),
        'rmse':float(np.sqrt(np.mean(np.square(deviations)))),
        'p50Abs':float(np.quantile(absdiff,.5)),
        'p95Abs':float(np.quantile(absdiff,.95)),
        'p99Abs':float(np.quantile(absdiff,.99)),
        'maxAbs':float(absdiff.max()),
        'within0p1C':int(np.count_nonzero(absdiff<=.1)),
        'within0p2C':int(np.count_nonzero(absdiff<=.2)),
      },
      'fieldCadenceProven':False,'nativeCoordinateOrderingProven':False,
      'originalBitmapEquivalenceProven':False,'allFieldsProven':False,
      'originalValueBitIdentityProven':False,'productionEligible':False
    }
    return report


def main():
    with TemporaryDirectory(prefix='mid-om-dwd-t2m-qa-') as folder:
        dwd=Path(folder)/'original_t2m.grib2';om=Path(folder)/'processed_t2m.om'
        sources={'DWD':secure_download(DWD_URL,dwd,'dwd'),
                 'OpenMeteo':secure_download(OM_URL,om,'om')}
        original,ogood,props=original_dwd_t2m(dwd)
        processed,pgood,shape=processed_om_t2m(om)
        report=numerical_report(original,ogood,processed,pgood,props,shape,sources)
        print(json.dumps(report,indent=2,allow_nan=False))


if __name__=='__main__':
    main()

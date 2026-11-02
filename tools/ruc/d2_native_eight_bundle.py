#!/usr/bin/env python3
"""One-lead full eight-kind ICON-D2 original native read-only candidate.

Only consume the strict three-cycle SHA-pinned DWD GRIB inventory. No fallback
to Germany cropped regular grid, no Pages/Worker/latest.json writes. The full
eight-kind pilot intentionally fails if an original previous-hour TOT_PREC or
a single native parameter is unavailable, rather than inventing precipitation.
"""
from __future__ import annotations
import argparse,bz2,gzip,hashlib,json,math,os,shutil,sys,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
from d2_native_full_fields import derive_eight,sample_native,PRODUCT_UNITS,NATIVE_POINTS
MAX_FRAME_BYTES=12_000_000
NODATA=np.uint32(0xffffffff)


def packing_quantum(meta):
    """Diagnostic only: GRIB2 simple-packing decoded quantum in mm, never a repair."""
    if (meta.get('packingType')!='grid_simple'
            or type(meta.get('binaryScaleFactor')) is not int
            or type(meta.get('decimalScaleFactor')) is not int):
        return None
    e=meta['binaryScaleFactor'];d=meta['decimalScaleFactor']
    if not -100<=e<=100 or not -30<=d<=30:
        return None
    quantum=2.0**e*10.0**(-d)
    return quantum if math.isfinite(quantum) and quantum>0 else None

def original_packing_diagnostic(row,root):
    """Inspect only SHA-verified original first GRIB message; never modify values."""
    from eccodes import codes_grib_new_from_file,codes_get,codes_release
    path=(root/row['path']).resolve(strict=True)
    if not path.is_relative_to(root) or hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:
        raise ValueError('Original TOT_PREC source changed before packing diagnostic')
    with tempfile.TemporaryFile() as stream:
        with (bz2.BZ2File(path) if path.name.endswith('.bz2') else path.open('rb')) as source:
            total=0
            for chunk in iter(lambda:source.read(1048576),b''):
                total+=len(chunk)
                if total>640_000_000:
                    raise ValueError('Original packing diagnostic decompression over budget')
                stream.write(chunk)
        stream.seek(0)
        handle=codes_grib_new_from_file(stream)
        if handle is None:
            raise ValueError('Missing original TOT_PREC GRIB message')
        try:
            result={}
            for key in ('packingType','binaryScaleFactor','decimalScaleFactor','bitsPerValue',
                        'referenceValue','bitmapPresent'):
                try:
                    value=codes_get(handle,key)
                    result[key]=str(value) if key=='packingType' else (
                        float(value) if key=='referenceValue' else int(value))
                except Exception:
                    result[key]=None
            result['decodedQuantumMm']=packing_quantum(result)
            return result
        finally:
            codes_release(handle)

def checked_source(records,run,field,lead):
    found=[r for r in records if r.get('model')=='icon-d2' and r.get('run')==run
           and r.get('parameter')==field and r.get('leadHours')==lead]
    if len(found)!=1:
        raise ValueError(f'Original native source missing/duplicated: {run} {field} +{lead}')
    return found[0]

def build_original_eight(root:Path,manifest:Path,out:Path,lead:int=6):
    # Missing T+(lead-1) is not a request to manufacture one-hour rainfall
    # from cumulative 6/12/24/48-hour totals.
    if type(lead) is not int or not 1<=lead<=48:
        raise ValueError('Invalid D2 forecast lead')
    root=root.resolve(strict=True);manifest=manifest.resolve(strict=True);out=out.resolve()
    if not manifest.is_relative_to(root) or out.exists() or out.is_relative_to(root) or root.is_relative_to(out):
        raise ValueError('Original inventory / immutable disjoint output contract')
    raw=manifest.read_bytes()
    doc=json.loads(raw)
    if doc.get('schema')!='mid.dwd.domain-inventory-input.v1' or doc.get('productionApproved') is True:
        raise ValueError('Unqualified DWD native original inventory')
    records=doc.get('records')
    if not isinstance(records,list) or not records:
        raise ValueError('No SHA-bound native original records')
    from pilot_dwd_domain_inventory import inventory_record,validate_collection
    from pilot_icon_d2_native_scalar import read_original
    from build_ruc_bundle import build_lookup
    verified=[inventory_record(row,root) for row in records]
    scope=validate_collection(verified,parameters=doc['expectedParameters'],
                              leads=doc['expectedLeads'],required_runs=3)
    if scope.get('fullDomainProductionApproved') is True:
        raise ValueError('Read-only pilot cannot use production approved flag')
    runs=sorted({row['run'] for row in verified if row['model']=='icon-d2'})
    if len(runs)!=3:
        raise ValueError('Three distinct native original model cycles required')
    run=runs[-1]
    from d2_native_full_fields import SOURCE_FIELDS
    components={}
    units={}
    provenance={}
    lat0=lon0=None
    for field in (*SOURCE_FIELDS,'previous_tot_prec'):
        origin='tot_prec' if field=='previous_tot_prec' else field
        hour=lead-1 if field=='previous_tot_prec' else lead
        row=checked_source(records,run,origin,hour)
        values,lats,lons,unit=read_original(row,root)
        if values.size!=NATIVE_POINTS or lats.size!=NATIVE_POINTS or lons.size!=NATIVE_POINTS:
            raise ValueError('Original 542040-cell native grid/geometry incomplete')
        if lat0 is None:
            lat0=lats;lon0=lons
        elif not np.array_equal(lat0,lats) or not np.array_equal(lon0,lons):
            raise ValueError('Original native D2 CLAT/CLON cell-order drift')
        components[field]=values
        units[field]=unit
        provenance[field]={'sourceSha256':row['sha256'],'run':run,'leadHours':hour,
                           'parameter':origin}
    try:
        products=derive_eight({key:components[key] for key in SOURCE_FIELDS},
                              {key:units[key] for key in SOURCE_FIELDS},
                              components['previous_tot_prec'],units['previous_tot_prec'],
                              points=NATIVE_POINTS)
    except ValueError as exc:
        # Preserve the strict rejection. Gather original packing evidence only
        # for the actual same-run cumulative precipitation discrepancy.
        if 'Original cumulative TOT_PREC reset or wrong same-run interval' in str(exc):
            delta=components['tot_prec']-components['previous_tot_prec']
            negative=delta[np.isfinite(delta)&(delta<0)]
            current=checked_source(records,run,'tot_prec',lead)
            previous=checked_source(records,run,'tot_prec',lead-1)
            report={'stage':'original-tot-prec-negative-delta-diagnostic',
                    'productionApproved':False,'sourceRun':run,'leadHours':lead,
                    'negativeCells':int(negative.size),
                    'negativeMinMm':float(np.min(negative)),
                    'negativeMaxMm':float(np.max(negative)),
                    'negativeDistinctMm':np.unique(negative).tolist()[:12],
                    'currentSourceSha256':current['sha256'],
                    'previousSourceSha256':previous['sha256'],
                    'currentPacking':original_packing_diagnostic(current,root),
                    'previousPacking':original_packing_diagnostic(previous,root)}
            print(json.dumps(report,sort_keys=True),file=sys.stderr,flush=True)
        raise
    out.parent.mkdir(parents=True,exist_ok=True)
    temp=Path(tempfile.mkdtemp(prefix='.d2-eight-original-',dir=out.parent))
    try:
        geom=build_lookup(lat0,lon0,temp,step=.025,max_distance_km=5)
        lookup=np.fromfile(temp/'lookup.bin',dtype='<u4').reshape(geom['ny'],geom['nx'])
        entries={}
        for name,value in products.items():
            selected=sample_native(value,lookup)
            vals=selected.pop('values')
            # The 0.1 unit quantization matches the established D2 map wire
            # and retains the original native extrema in the QA metadata.
            scaled=[]
            for v in vals.ravel():
                scaled.append(None if not math.isfinite(v) else int(np.rint(v*10)))
            valid_native=int(np.count_nonzero(np.isfinite(value)))
            field_data={'schema':'mid.dwd.native-eight-field-pilot.v1',
                        'productionApproved':False,'run':run,'leadHours':lead,
                        'time':(datetime.strptime(run,'%Y%m%dT%H%M').replace(tzinfo=timezone.utc)
                                +timedelta(hours=lead)).isoformat(),
                        'kind':name,'unit':PRODUCT_UNITS[name],'scale':.1,
                        'sourceInventorySha256':hashlib.sha256(raw).hexdigest(),
                        'grid':'original DWD unstructured R19B07; verified 0.025 degree nearest-native display',
                        'nativePoints':NATIVE_POINTS,'validNativePoints':valid_native,
                        'lats':(geom['latMin']+np.arange(geom['ny'])*geom['dy']).round(6).tolist(),
                        'lons':(geom['lonMin']+np.arange(geom['nx'])*geom['dx']).round(6).tolist(),
                        'values':scaled,'originalExtrema':selected}
            encoded=json.dumps(field_data,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode()
            if len(encoded)>MAX_FRAME_BYTES:
                raise ValueError(f'Original native {name} display exceeds immutable 12 MB decoded limit')
            wire=gzip.compress(encoded,mtime=0)
            target=f'{name}-{lead:03d}.json.gz'
            (temp/target).write_bytes(wire)
            entries[name]={'file':target,'sha256':hashlib.sha256(wire).hexdigest(),
                           'bytes':len(wire),'decodedBytes':len(encoded),
                           'validNativePoints':valid_native,'nativeExtremeNotSampled':selected['nativeExtremeNotSampled'],
                           'originalMin':selected['nativeMin'],'originalMax':selected['nativeMax'],
                           'displayMissing':selected['displayMissing']}
        (temp/'lookup.bin').unlink()
        index={'schema':'mid.dwd.native-eight-pilot.v1','productionApproved':False,'run':run,
               'leadHours':lead,'sourceInventorySha256':hashlib.sha256(raw).hexdigest(),
               'nativePoints':NATIVE_POINTS,'sample':'nearest-native-cell','maxNearestKm':5,
               'sourceObjects':provenance,'products':entries}
        (temp/'pilot-index.json').write_text(json.dumps(index,sort_keys=True)+'\n')
        os.rename(temp,out)
    finally:
        if temp.exists():shutil.rmtree(temp)
    return {'schema':index['schema'],'productionApproved':False,'run':run,
            'leadHours':lead,'products':sorted(entries),'nativePoints':NATIVE_POINTS,
            'sourceInventorySha256':index['sourceInventorySha256']}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',required=True,type=Path)
    p.add_argument('--manifest',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    p.add_argument('--lead',type=int,default=6)
    a=p.parse_args()
    print(json.dumps(build_original_eight(a.root,a.manifest,a.output,a.lead),sort_keys=True))

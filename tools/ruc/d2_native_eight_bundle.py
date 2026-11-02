#!/usr/bin/env python3
"""One-lead full eight-kind ICON-D2 original native read-only candidate.

Only consume the strict three-cycle SHA-pinned DWD GRIB inventory. No fallback
to Germany cropped regular grid, no Pages/Worker/latest.json writes. The full
eight-kind pilot intentionally fails if an original previous-hour TOT_PREC or
a single native parameter is unavailable, rather than inventing precipitation.
"""
from __future__ import annotations
import argparse,gzip,hashlib,json,math,os,shutil,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
from d2_native_full_fields import derive_eight,sample_native,PRODUCT_UNITS,NATIVE_POINTS
MAX_FRAME_BYTES=12_000_000
NODATA=np.uint32(0xffffffff)

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
    products=derive_eight({key:components[key] for key in SOURCE_FIELDS},
                          {key:units[key] for key in SOURCE_FIELDS},
                          components['previous_tot_prec'],units['previous_tot_prec'],
                          points=NATIVE_POINTS)
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

#!/usr/bin/env python3
"""Create a complete, immutable, SHA-audited 72-field native ICON-D2 *staging* site.

Source: exclusively 9 x 8 original DWD/GRIB pilot packages, all read-only.
Never publish under RUC/latest.json. Every output is productionApproved=false.
No guessing missing values; packing-unresolved precipitation stays JSON null.
"""
from __future__ import annotations
import argparse,gzip,hashlib,json,math,os,shutil,tempfile
from datetime import datetime,timedelta,timezone
from pathlib import Path
LEADS=(1,2,3,4,5,6,12,24,48)
KINDS=('temperature','pressure','wind','gust','cloud','thetae','sigwx','precipitation')
UNITS=dict(zip(KINDS,('°C','hPa','km/h','km/h','%','K','WMO','mm/1 h')))
NATIVE_POINTS=542040
FRAME_LIMIT=12_000_000
D2_BUDGET=350_000_000
def sha(raw:bytes)->str:return hashlib.sha256(raw).hexdigest()
def read_json(path:Path,limit:int):
    raw=path.read_bytes()
    if not raw or len(raw)>limit:raise ValueError('Invalid immutable file byte budget '+path.name)
    return raw,json.loads(raw)
def qualified_one(root:Path,lead:int,kind:str,expected_run:str|None=None,inventory:str|None=None):
    if lead not in LEADS or kind not in KINDS:raise ValueError('Unknown native frame identity')
    folder=root/f'd2-native-eight-{lead}'
    raw,index=read_json(folder/'pilot-index.json',3_000_000)
    if(index.get('schema')!='mid.dwd.native-eight-pilot.v1' or index.get('productionApproved') is not False
       or index.get('leadHours')!=lead or index.get('nativePoints')!=NATIVE_POINTS):
        raise ValueError('Native pilot provenance/type admission failed')
    run=index.get('run');origin=index.get('sourceInventorySha256')
    if(not isinstance(run,str) or not isinstance(origin,str) or len(origin)!=64
       or expected_run and run!=expected_run or inventory and origin!=inventory):
        raise ValueError('Native pilot run/inventory drift')
    datetime.strptime(run,'%Y%m%dT%H%M')
    frame=index.get('products',{}).get(kind)
    if(not isinstance(frame,dict) or frame.get('decodedBytes',0)>FRAME_LIMIT
       or frame.get('file')!=f'{kind}-{lead:03d}.json.gz'):
        raise ValueError('Unexpected native pilot frame')
    source=folder/frame['file']
    binary=source.read_bytes()
    if(len(binary)!=frame.get('bytes') or sha(binary)!=frame.get('sha256')):
        raise ValueError('Original D2 pilot frame SHA mismatch')
    decoded=gzip.decompress(binary)
    if(not decoded or len(decoded)!=frame['decodedBytes'] or len(decoded)>FRAME_LIMIT):
        raise ValueError('Invalid D2 decoded field budget')
    payload=json.loads(decoded)
    epoch=datetime.strptime(run,'%Y%m%dT%H%M').replace(tzinfo=timezone.utc)
    validity=(epoch+timedelta(hours=lead)).isoformat()
    if(payload.get('schema')!='mid.dwd.native-eight-field-pilot.v1'
       or payload.get('productionApproved') is not False
       or payload.get('kind')!=kind or payload.get('unit')!=UNITS[kind]
       or payload.get('run')!=run or payload.get('leadHours')!=lead
       or payload.get('time')!=validity or payload.get('sourceInventorySha256')!=origin
       or payload.get('nativePoints')!=NATIVE_POINTS
       or payload.get('scale')!=.1):
        raise ValueError('Original D2 source period/units/physics mismatch')
    y=payload.get('lats');x=payload.get('lons');values=payload.get('values')
    if(not isinstance(x,list) or not isinstance(y,list) or len(x)<2 or len(y)<2
       or len(x)>1600 or len(y)>1600 or not isinstance(values,list)
       or len(values)!=len(x)*len(y)):
        raise ValueError('Native full domain geometry invalid')
    for axis in (x,y):
        if(not all(isinstance(v,(int,float)) and math.isfinite(v) for v in axis)
           or any(axis[i]<=axis[i-1] for i in range(1,len(axis)))
           or any(abs(axis[i]-axis[i-1]-(axis[1]-axis[0]))>1e-5 for i in range(2,len(axis)))):
            raise ValueError('Non-native monotone regular display geometry')
    if(not 35<=y[0]<50 or not 49<y[-1]<=65 or not -5<x[0]<16 or not 15<x[-1]<35):
        raise ValueError('Full ICON-D2 region missing; prohibited Germany-only crop')
    if(any(v is not None and (type(v) is not int or abs(v)>=100000) for v in values)):
        raise ValueError('Invalid original integer/NoData display cell')
    if(not any(v is not None for v in values)):
        raise ValueError('No valid native D2 field samples')
    uncertain=payload.get('negativePackingUncertainNoDataCells')
    if(type(uncertain) is not int or uncertain<0 or (kind!='precipitation' and uncertain!=0)):
        raise ValueError('Native GRIB packing uncertainty provenance missing')
    if(kind=='precipitation' and uncertain>sum(v is None for v in values)):
        raise ValueError('Native precipitation uncertainty not transparently missing')
    if(kind=='precipitation' and uncertain>int(.15*NATIVE_POINTS)):
        raise ValueError('Native precipitation uncertainty over budget')
    if(kind=='sigwx' and any(v is not None and v%10!=0 for v in values)):
        raise ValueError('WMO categorical weather codes not integral')
    return run,origin,payload,frame,sha(raw)
def stage_native_site(root:Path,output:Path):
    root=root.resolve(strict=True);output=output.resolve()
    if(output.exists() or root.is_relative_to(output) or any(output.is_relative_to(root/f'd2-native-eight-{h}') for h in LEADS)):
        raise ValueError('Immutable disjoint staged site required')
    run=inventory=None;axis=None;items={k:{'unit':UNITS[k],'frames':[]} for k in KINDS}
    state=[]
    for lead in LEADS:
        one_index=None
        for kind in KINDS:
            current,origin,data,frame,index_sha=qualified_one(root,lead,kind,run,inventory)
            if run is None:run=current;inventory=origin
            if one_index is None:one_index=index_sha
            if index_sha!=one_index:raise ValueError('Mixed per-hour D2 source pilot index')
            here=(tuple(data['lats']),tuple(data['lons']))
            if axis is None:axis=here
            if here!=axis:raise ValueError('Full-area D2 geometry differs across fields or hours')
            state.append((lead,kind,data,frame))
    if len(state)!=72 or any(len(items[k]['frames']) for k in KINDS):
        raise ValueError('Full native 72-field matrix incomplete')
    output.parent.mkdir(parents=True,exist_ok=True)
    temp=Path(tempfile.mkdtemp(prefix='.native-d2-site-',dir=output.parent))
    try:
        budget=0
        for lead,kind,data,frame in state:
            outgoing={k:v for k,v in data.items() if k not in ('schema','productionApproved','time','run','kind','unit','scale','leadHours','values')}
            contours=[];centers=[]
            if kind=='pressure':
                import numpy as np
                from native_d2_contours import contours as original_grid_contours
                from pressure_centers import pressure_centers
                p=np.asarray([np.nan if v is None else v*.1 for v in data['values']],
                             dtype=np.float64).reshape(len(data['lats']),len(data['lons']))
                finite=p[np.isfinite(p)]
                if not finite.size or np.any((finite<800)|(finite>1100)):
                    raise ValueError('Full original pressure values outside physical contract')
                # 1-hPa contours are generated on the same nearest-native grid.
                # MID H/T centre symbols follow the established 20-km method;
                # original unsmoothed extrema remain recorded independently.
                contours=original_grid_contours(p,np.asarray(data['lats']),np.asarray(data['lons']))
                centers=pressure_centers(p,np.asarray(data['lats']),np.asarray(data['lons']))
            outgoing.update({'schema':'mid.icon-d2.native-field.v2','productionApproved':False,
                             'modelId':'icon-d2','sampling':'nearest-native-cell',
                             'run':datetime.strptime(run,'%Y%m%dT%H%M').replace(tzinfo=timezone.utc).isoformat(),
                             'time':data['time'],'kind':kind,'unit':UNITS[kind],'scale':.1,
                             'leadHours':lead,'values':data['values'],'isobars':contours,'centers':centers})
            decoded=(json.dumps(outgoing,separators=(',',':'),ensure_ascii=False,allow_nan=False)+'\n').encode()
            if len(decoded)>FRAME_LIMIT:raise ValueError('Native transport decoded D2 frame over 12MB')
            name=f'{kind}-{lead:03d}.bin'
            binary=gzip.compress(decoded,compresslevel=6,mtime=0)
            (temp/name).write_bytes(binary);budget+=len(binary)
            items[kind]['frames'].append({'hour':lead,'time':data['time'],'file':name,
              'encoding':'gzip-json','decodedBytes':len(decoded),'sha256':sha(binary),
              'bytes':len(binary),'intervalHours':1 if kind=='precipitation' else 0,
              'unresolvedPrecipitationNoDataCells':data['negativePackingUncertainNoDataCells'] if kind=='precipitation' else 0})
        if budget>=D2_BUDGET:raise ValueError('Original D2 transport exceeds 350 MB total')
        index={'schema':'mid.icon-d2.native-fields.v2','productionApproved':False,
               'run':datetime.strptime(run,'%Y%m%dT%H%M').replace(tzinfo=timezone.utc).isoformat(),
               'modelId':'icon-d2','sampling':'nearest-native-cell',
               'nativePoints':NATIVE_POINTS,'sourceInventorySha256':inventory,
               'grid':'DWD original unstructured R19B07; nearest native cell at 0.025°; not Germany crop',
               'products':items,'decodedFrameLimitBytes':FRAME_LIMIT,
               'nativeFullDomainBytes':budget,'nativeD2LimitBytes':D2_BUDGET}
        (temp/'index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
        os.rename(temp,output)
    finally:
        if temp.exists():shutil.rmtree(temp)
    return {'schema':index['schema'],'productionApproved':False,'run':index['run'],
            'fields':len(state),'transportBytes':budget,'sourceInventorySha256':inventory}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    args=p.parse_args();print(json.dumps(stage_native_site(args.root,args.output),sort_keys=True))

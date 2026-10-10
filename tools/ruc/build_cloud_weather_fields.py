"""Independent cloud/WW terms: hourly through +12, coarser thereafter."""
import gzip,hashlib,json,re,time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta
import numpy as np
import requests
from build_synoptic_fields import decode,MODELS,GRID_CACHE

CLOUD_HOURS=tuple(range(13))+(15,18,21,24,30,36,42,48)

def cloud_hours(model,stamp):
    end=48 if model=='icon-d2' else 120 if model=='icon-eu' or stamp.hour in (6,18) else 180
    return CLOUD_HOURS+tuple(range(60,end+1,12))

def build_model(model,product,output,deadline):
    stamp=datetime.fromisoformat(product['run']);run=stamp.strftime('%Y%m%d%H');_,folder,resolution,grid=MODELS[model]
    root=f'https://opendata.dwd.de/weather/nwp/{folder}/grib/{stamp:%H}/';listings={};frames=[]
    for ref in product.get('cloudWeatherFrames',[]):
        path=output/ref['file']
        if ref['hour'] in cloud_hours(model,stamp) and path.is_file():
            content=path.read_bytes()
            if len(content)==ref['bytes'] and hashlib.sha256(content).hexdigest()==ref['sha256']:frames.append(ref)
    for name in ('clct','ww'):
        response=requests.get(root+name+'/',timeout=20);response.raise_for_status();listings[name]=re.findall(r'href="([^"/]+\.grib2.bz2)"',response.text)
    native=None
    if model=='icon':
        from icon_global_grid import load_icon_grid
        if run not in GRID_CACHE:GRID_CACHE[run]=load_icon_grid(root,run)
        native=GRID_CACHE[run][0]
    for hour in cloud_hours(model,stamp):
        if any(f['hour']==hour for f in frames):continue
        if time.monotonic()>=deadline:break
        try:
            fields={};axes=None;origins=[]
            for name in ('clct','ww'):
                candidates=[n for n in listings[name] if grid in n and f'_{run}_{hour:03d}_' in n and 'single-level' in n]
                if len(candidates)!=1:raise ValueError('no unique matching cloud/weather term')
                url=root+name+'/'+candidates[0];r=requests.get(url,timeout=20);r.raise_for_status()
                if len(r.content)>32_000_000:raise ValueError('cloud/weather source size')
                lat,lon,v=decode(r.content,run,hour,name,None,native)
                # D2 overview keeps real every-other grid points, never averages categories.
                if model=='icon-d2':lat,lon,v=lat[::2],lon[::2],v[::2,::2]
                if axes is not None and (not np.array_equal(axes[0],lat) or not np.array_equal(axes[1],lon)):raise ValueError('cloud/weather grid mismatch')
                axes=(lat,lon);fields[name]=v;origins.append({'url':url,'sha256':hashlib.sha256(r.content).hexdigest()})
            if np.mean(np.isfinite(fields['clct'])&np.isfinite(fields['ww']))<.4:raise ValueError('insufficient paired coverage')
            payload={'schema':'mid.cloud-weather.field.v1','model':model,'run':product['run'],'time':(stamp+timedelta(hours=hour)).isoformat(),'resolutionKm':resolution*2 if model=='icon-d2' else resolution,'lats':lat.tolist(),'lons':lon.tolist(),'cloudUnit':'%','weatherUnit':'WMO 4677','cloudScale':.1,'cloud':[int(round(v*10)) if np.isfinite(v) else None for v in fields['clct'].ravel()],'weather':[int(round(v)) if np.isfinite(v) else None for v in fields['ww'].ravel()],'origins':origins}
            raw=json.dumps(payload,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
            if len(raw)>12_000_000:raise ValueError('cloud/weather decoded size')
            data=gzip.compress(raw,mtime=0);name=f'{model}-cw-{hour:03d}.bin';(output/name).write_bytes(data)
            frames.append({'hour':hour,'time':payload['time'],'file':name,'bytes':len(data),'decodedBytes':len(raw),'encoding':'gzip-json','sha256':hashlib.sha256(data).hexdigest()})
        except (requests.RequestException,ValueError,RuntimeError) as e:print(f'::notice::{model} cloud/weather +{hour}h: {e}',flush=True)
    product['cloudWeatherFrames']=sorted(frames,key=lambda f:f['hour'])
    print(f'{model}: {len(frames)} independent cloud/weather terms; hourly {sum(f["hour"]<=12 for f in frames)}/13',flush=True)

def build(products,output,seconds=600):
    deadline=time.monotonic()+seconds
    def task(item):
        model,product=item
        try:build_model(model,product,output,deadline)
        except (requests.RequestException,ValueError,RuntimeError) as e:print(f'::notice::{model} cloud/weather unavailable: {e}',flush=True)
    with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(task,[(m,p) for m,p in products.items() if m in MODELS]))

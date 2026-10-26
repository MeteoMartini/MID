"""Project a byte-identical same-run 14h raw rollback from a qualified 27h core.

No GRIB reread, interpolation, compression, download, or publication. Rapid
products keep their native axes; the existing extreme summary is bounded to14h.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil
import numpy as np
from compare_core_prefix import checked, compare
from lossless_inventory import verify_inventory
from prepare_ruc_pages import prepare


def prepare_rollback(source, reference, output):
    source=Path(source).resolve(strict=True); reference=Path(reference).resolve(); output=Path(output).resolve()
    roots=(source,reference,output)
    if any(a.is_relative_to(b) or b.is_relative_to(a) for i,a in enumerate(roots) for b in roots[i+1:]):
        raise ValueError('rollback directories must be disjoint')
    if reference.exists() or output.exists():raise ValueError('rollback outputs must be new')
    original=(source/'latest.json').read_bytes(); meta=json.loads(original)
    if meta['schema']!='mid.dwd.ruc.grid.v2' or len(meta['deterministic']['times'])!=28 or not 0<meta['pointCount']<=10_000_000:
        raise ValueError('rollback requires qualified 28-term raw core')
    for name in meta['objects']:checked(source,meta,name)
    extreme=json.loads((source/Path(meta['rapidExtreme']['key']).name).read_text())
    if extreme.get('schema')!='mid.dwd.ruc.rapid-extreme.v4' or extreme.get('horizonHours')!=14 or extreme.get('run')!=meta['run'] or [(p['id'],p['startHour'],p['endHour']) for p in extreme['periods']]!=[('0-6',0,6),('6-12',6,12),('12-14',12,14)]:
        raise ValueError('legacy extreme summary must remain bounded to14h')
    result=copy.deepcopy(meta); reference.mkdir(parents=True)
    projected=set()
    try:
        specs=[result['deterministic'],result['epsSummary'],result['eps'],*result.get('rapid',{}).values()]
        for index,spec in enumerate(specs):
            times=spec.get('times',[])
            hourly=index<3 or spec.get('nativeResolutionSeconds')==3600
            if not hourly:continue
            if times!=meta['deterministic']['times'] or spec.get('dtype')!=('uint16-le' if index==2 else 'int16-le') or spec.get('layout') not in ('point-time-field','point-time-member'):
                raise ValueError('unexpected hourly rollback encoding/axis')
            width=int(spec['recordBytes'])
            if width<=0 or width%28:raise ValueError('invalid rollback record geometry')
            short=width//28*15; name=Path(spec['key']).name; path=checked(source,meta,name)
            if path.stat().st_size!=meta['pointCount']*width:raise ValueError('rollback dimensions')
            data=np.memmap(path,dtype=np.uint8,mode='r',shape=(meta['pointCount'],width))
            with (reference/name).open('wb') as target:
                for start in range(0,meta['pointCount'],4096):target.write(data[start:start+4096,:short].tobytes())
            spec['times']=times[:15];spec['recordBytes']=short
            if 'horizonHours' in spec:spec['horizonHours']=14
            projected.add(name)
        for name in meta['objects']:
            if name not in projected:shutil.copy2(checked(source,meta,name),reference/name)
        result['times']=result['deterministic']['times']
        result['objects']={name:{'bytes':(reference/name).stat().st_size,'sha256':digest(reference/name)} for name in meta['objects']}
        (reference/'latest.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
        prefix=compare(reference,source)
        # Sidecar maps and observed sums have independent validated axes. Never
        # replace core objects or refetch sources while building the rollback.
        for child in source.iterdir():
            if child.name in set(meta['objects'])|{'latest.json'}:continue
            if child.is_symlink() or (child.is_dir() and any(p.is_symlink() for p in child.rglob('*'))):raise ValueError('rollback sidecar symlink')
            if child.is_dir():shutil.copytree(child,reference/child.name)
            elif child.is_file():shutil.copy2(child,reference/child.name)
            else:raise ValueError('unsupported rollback sidecar')
        raw=prepare(reference,output);root=output/'ruc';verify_inventory(raw,root)
        for name in meta['objects']:checked(source,meta,name)
        if (source/'latest.json').read_bytes()!=original:raise ValueError('source manifest changed')
        physical=sum(row['bytes'] for row in raw['pages']['objects'])+(root/'latest.json').stat().st_size
        if raw['storageProfile']!='pages-free-v1' or raw['pages'].get('stagingOnly') or physical>=900_000_000:raise ValueError('invalid legacy rollback profile/budget')
        return {'schema':'mid.ruc.legacy-prefix-rollback.v1','run':meta['run'],'prefix':prefix,'storageProfile':raw['storageProfile'],'manifestSha256':digest(root/'latest.json'),'physicalBytes':physical,'budgetBytes':900_000_000,'published':False}
    except BaseException:
        shutil.rmtree(reference,ignore_errors=True);shutil.rmtree(output,ignore_errors=True);raise


def digest(path):
    value=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):value.update(block)
    return value.hexdigest()


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('source','reference','output'):p.add_argument(name,type=Path)
    a=p.parse_args();print(json.dumps(prepare_rollback(a.source,a.reference,a.output),indent=2))

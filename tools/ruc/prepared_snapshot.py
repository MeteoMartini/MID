"""Immutable RUC handoff: conservative compatibility, full bytes, no recalculation.

Trust comes from the authenticated main-workflow producer and immutable artifact
ID/digest, not from a self-declared receipt alone. A changed contract fails closed.
"""
from __future__ import annotations
import argparse,shutil,urllib.error,datetime as dt,hashlib,json,os,re,subprocess,urllib.request
from pathlib import Path
from check_ruc_schedule_guard import valid_pages_meta,run_time,DEFAULT_MAX_AGE_MINUTES,published_meta
from lossless_inventory import safe_file,digest_file
from lossless_codec_pilot import decode_candidate

SCHEMA='mid.ruc.prepared-snapshot.v1'
RECEIPT='prepared-snapshot-proof.json'
REPOSITORY='MeteoMartini/MID'
SHA=re.compile(r'^[a-f0-9]{40}$')

def packed(value):return (json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode()
def digest(data):return hashlib.sha256(data).hexdigest()
# Files that cannot affect the sealed GRIB/data/decoder contract. Tests still
# execute under the normal CI gates; this only scopes *snapshot reuse* hashing.
# P3 native log audit reads existing logs and never feeds the producer.
_NON_RUNTIME_RUC_TOOLS = frozenset({'ruc_p3_native_log_audit.py'})


def _snapshot_read_only_tool(root, path):
    relative = path.relative_to(root).as_posix()
    if not relative.startswith('tools/ruc/'):
        return False
    return ((path.name.startswith('test_') and path.suffix in ('.py', '.mjs'))
            or path.name in _NON_RUNTIME_RUC_TOOLS)


def compatibility(root):
    root=Path(root)
    paths=set(root.glob('tools/ruc/*.py'))|set(root.glob('tools/ruc/*.mjs'))|set(root.glob('tools/ruc/requirements*.txt'))|set(root.glob('worker-src/*.js'))|set(root.glob('src/ruc*.ts'))
    # A new or changed test/read-only audit does not invalidate verified data.
    # All runtime helpers, formats, dependencies, worker decoding and canonical
    # preprocessing workflow remain included by default (fail-closed).
    paths={path for path in paths if not _snapshot_read_only_tool(root, path)}
    paths|={root/p for p in ('src/forecastFusion.ts','ci/github/workflows/mid-ruc-preprocess.yml','MID_DWD_RUC_PIPELINE_CONTRACT.md')}
    rows={}
    for path in sorted(paths):
        if path.is_symlink() or not path.is_file():raise ValueError('unsafe/missing compatibility source')
        data=path.read_bytes()
        if path.name=='00-core-observations.js':
            text,n=re.subn(r"const WORKER_VERSION='[^']+';","const WORKER_VERSION='__RELEASE__';",data.decode())
            if n!=1:raise ValueError('worker version normalization ambiguous')
            data=text.encode()
        rows[path.relative_to(root).as_posix()]=digest(data)
    lock=json.loads((root/'package-lock.json').read_text());lock.pop('version',None)
    if '' in lock.get('packages',{}):lock['packages'][''].pop('version',None)
    rows['package-lock.json:without-release-version']=digest(packed(lock))
    return digest(packed(rows))

def identity(repo=Path('.')):
    source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
    value={'repository':os.environ.get('GITHUB_REPOSITORY',REPOSITORY),'sourceSha':source,
           'eventSha':os.environ.get('GITHUB_SHA',source),'runId':int(os.environ['GITHUB_RUN_ID']),
           'runAttempt':int(os.environ.get('GITHUB_RUN_ATTEMPT','1'))}
    if value['repository']!=REPOSITORY or any(not SHA.fullmatch(value[k]) for k in ('sourceSha','eventSha')):raise ValueError('invalid producer identity')
    return value

def verify_bytes(root,*,now=None):
    root=Path(root).resolve(strict=True);raw=(root/'latest.json').read_bytes();meta=json.loads(raw)
    if not valid_pages_meta(meta) or meta['storageProfile']!='pages-lossless-v1':raise ValueError('unsupported prepared snapshot')
    stamp=run_time(meta['run']);now=now or dt.datetime.now(dt.timezone.utc)
    age=(now-stamp).total_seconds()
    if age < -300 or age>DEFAULT_MAX_AGE_MINUTES*60:raise ValueError('prepared snapshot outside established freshness window')
    expected=[(stamp+dt.timedelta(hours=h)).replace(tzinfo=None).isoformat(timespec='minutes') for h in range(28)]
    for key in ('deterministic','epsSummary'):
        actual=[run_time(t).replace(tzinfo=None).isoformat(timespec='minutes') for t in meta[key]['times']]
        if actual!=expected:raise ValueError('qualified 27h axis changed: '+key)
    total=0;seen=set()
    for row in meta['pages']['objects']:
        key=row['key'];path=safe_file(root,key)
        if key in seen or path.is_symlink() or not path.is_file() or path.stat().st_size!=row['bytes'] or digest_file(path)!=row['sha256']:raise ValueError('prepared object integrity: '+key)
        seen.add(key);total+=row['bytes']
    if total!=meta['pages']['publishedBytes'] or meta['pages']['budgetBytes']!=900000000 or total+len(raw)>=900000000:raise ValueError('prepared inventory/budget mismatch')
    parts=0
    for spec in [meta['deterministic'],meta['epsSummary'],*meta.get('rapid',{}).values()]:
        if spec.get('dtype')!='int16-le':continue
        page=spec['compressedPages'];cursor=0
        for part in page['parts']:
            if part['key'] not in seen or part['firstRecord']!=cursor:raise ValueError('compressed chain mismatch')
            decoded=decode_candidate(part['manifest'],safe_file(root,part['key']).read_bytes())
            if len(decoded)!=part['recordCount']*page['recordBytes']:raise ValueError('decoded geometry mismatch')
            cursor+=part['recordCount'];parts+=1
        if cursor!=page['records']:raise ValueError('incomplete compressed product')
    allowed=seen|{'latest.json',RECEIPT}
    for path in root.rglob('*'):
        if path.is_symlink() or (path.is_file() and path.relative_to(root).as_posix() not in allowed):raise ValueError('unexpected prepared file')
    proof=meta['migration']['proof']
    if proof['fullyDecodedParts']!=parts or proof['recordComparisons']<parts:raise ValueError('original full JS/meteorological proof absent')
    return {'manifestSha256':digest(raw),'run':meta['run'],'objects':len(seen),'decodedParts':parts,'physicalBytes':total+len(raw)}

def seal(root,repo):
    root=Path(root);report=verify_bytes(root)
    receipt={'schema':SCHEMA,'producer':identity(repo),'compatibilitySha256':compatibility(repo),'snapshot':report}
    target=root/RECEIPT
    if target.exists():raise ValueError('receipt must be new')
    data=packed(receipt)
    if report['physicalBytes']+len(data)>=900000000:raise ValueError('receipt exceeds RUC budget')
    target.write_bytes(data);return receipt

def admit(root,repo,expected_run_id,*,lineage=True,now=None,published=None,expected_event_sha=None,expected_attempt=None):
    root=Path(root);receipt=json.loads((root/RECEIPT).read_text())
    if receipt.get('schema')!=SCHEMA or receipt.get('compatibilitySha256')!=compatibility(repo):raise ValueError('prepared data contract incompatible with current Stable')
    producer=receipt['producer']
    if producer.get('repository')!=REPOSITORY or producer.get('runId')!=int(expected_run_id):raise ValueError('artifact producer mismatch')
    if expected_attempt is not None and producer.get('runAttempt')!=int(expected_attempt):raise ValueError('authenticated producer attempt mismatch')
    if expected_event_sha is not None and producer.get('eventSha')!=expected_event_sha:raise ValueError('authenticated producer event SHA mismatch')
    for key in ('sourceSha','eventSha'):
        if not SHA.fullmatch(str(producer.get(key,''))):raise ValueError('producer SHA invalid')
        if lineage:subprocess.run(['git','merge-base','--is-ancestor',producer[key],'HEAD'],check=True,cwd=repo)
    report=verify_bytes(root,now=now)
    if report['physicalBytes']+(root/RECEIPT).stat().st_size>=900000000:raise ValueError('prepared proof exceeds budget')
    if receipt.get('snapshot')!=report:raise ValueError('prepared receipt/bytes mismatch')
    if published is not None:
        if not valid_pages_meta(published):raise ValueError('current published metadata invalid')
        if run_time(published['run'])>run_time(report['run']):raise ValueError('prepared snapshot would regress the published RUC run')
    return {'schema':'mid.ruc.snapshot-readmission.v1','producer':producer,'consumerSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'snapshot':report,'recalculated':False}

def stage_core_cache(root,staging):
    root=Path(root).resolve(strict=True);staging=Path(staging).resolve(strict=True)
    meta=json.loads((root/'latest.json').read_bytes());run=re.sub(r'[^0-9A-Za-z_-]','',meta['run'])
    target=root/'prepared-map-grib'
    if target.exists() or target.is_relative_to(staging):raise ValueError('map cache must be new/disjoint')
    sources=[staging/run/'deterministic'/p for p in ('PMSL','CLCT')]
    for source in sources:
        if source.is_symlink() or not source.is_dir() or not any(p.is_file() for p in source.rglob('*')) or any(p.is_symlink() for p in source.rglob('*')):raise ValueError('required verified map GRIB cache absent/unsafe')
    try:
        for source in sources:shutil.copytree(source,target/run/'deterministic'/source.name)
        return {'files':len(cache_inventory(root))}
    except BaseException:
        shutil.rmtree(target,ignore_errors=True);raise

def cache_inventory(root):
    cache=Path(root)/'prepared-map-grib';rows=[]
    if cache.is_symlink():raise ValueError('unsafe cached GRIB root')
    if not cache.exists():return rows
    for path in sorted(cache.rglob('*')):
        if path.is_symlink():raise ValueError('unsafe cached GRIB symlink')
        if path.is_file():rows.append({'key':path.relative_to(cache).as_posix(),'bytes':path.stat().st_size,'sha256':digest_file(path)})
    return rows

def core_report(root):
    root=Path(root).resolve(strict=True);raw=(root/'latest.json').read_bytes();meta=json.loads(raw)
    if meta.get('schema')!='mid.dwd.ruc.grid.v2' or meta.get('pointCount',0)<=0:raise ValueError('invalid core checkpoint')
    stamp=run_time(meta['run']);expected=[(stamp+dt.timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(28)]
    for name in ('deterministic','epsSummary','eps'):
        if meta[name]['times']!=expected:raise ValueError('unqualified core checkpoint axis')
    total=0
    if not isinstance(meta.get('objects'),dict) or not meta['objects']:raise ValueError('empty core inventory')
    for name,row in meta['objects'].items():
        if not isinstance(name,str) or Path(name).name!=name or '\\' in name or name in ('.','..'):raise ValueError('unsafe core object')
        path=root/name
        if path.is_symlink() or path.resolve(strict=True).parent!=root or not path.is_file() or type(row.get('bytes')) is not int or path.stat().st_size!=row['bytes'] or digest_file(path)!=row['sha256']:raise ValueError('core object integrity: '+name)
        total+=path.stat().st_size
    cache=cache_inventory(root)
    if not 0<total+sum(r['bytes'] for r in cache)<3600000000:raise ValueError('core checkpoint exceeds existing staging ceiling')
    return {'manifestSha256':digest(raw),'run':meta['run'],'objects':len(meta['objects']),'bytes':total,'mapGribCache':cache}

def core_checkpoint(root,repo,create,expected_run_id=None):
    root=Path(root);report=core_report(root);path=root/'prepared-core-proof.json'
    if create:
        if path.exists():raise ValueError('core proof must be new')
        value={'schema':'mid.ruc.prepared-core.v1','producer':identity(repo),'compatibilitySha256':compatibility(repo),'core':report}
        path.write_bytes(packed(value));return value
    value=json.loads(path.read_bytes())
    source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
    if value.get('schema')!='mid.ruc.prepared-core.v1' or value.get('compatibilitySha256')!=compatibility(repo) or value.get('core')!=report or value.get('producer',{}).get('sourceSha')!=source or value['producer'].get('runId')!=int(expected_run_id):raise ValueError('core producer/contract/bytes mismatch')
    return report

def api(path):
    token=os.environ['GITHUB_TOKEN']
    request=urllib.request.Request('https://api.github.com/repos/'+REPOSITORY+'/'+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)

def resolve_reuse(run_id):
    if not re.fullmatch(r'[1-9][0-9]*',str(run_id)):raise ValueError('reuse_run_id must be an exact positive run ID')
    if os.environ.get('MID_RUC_FORCE_REBUILD')=='true':raise ValueError('force and reuse_run_id are mutually exclusive')
    run=api('actions/runs/'+str(run_id))
    if not SHA.fullmatch(str(run.get('head_sha',''))):raise ValueError('invalid authenticated producer SHA')
    if run['head_branch']!='main' or run['head_repository']['full_name']!=REPOSITORY or run['path']!='.github/workflows/mid-ruc-preprocess.yml' or run['event'] not in ('schedule','workflow_dispatch'):raise ValueError('untrusted producer workflow')
    jobs=api(f'actions/runs/{run_id}/jobs?filter=latest&per_page=100')['jobs']
    prepared=[j for j in jobs if j['name']=='prepare' and j['conclusion']=='success']
    if len(prepared)!=1:raise ValueError('producer preparation did not succeed')
    attempt=prepared[0]['run_attempt'];artifacts=api(f'actions/runs/{run_id}/artifacts?per_page=100')['artifacts']
    out={'producer_run_id':str(run_id),'producer_event_sha':run['head_sha'],'producer_run_attempt':str(attempt)}
    for label in ('data','rollback'):
        matches=[a for a in artifacts if a['name']==f'mid-ruc-{label}-{run_id}-{attempt}' and not a['expired'] and str(a.get('digest','')).startswith('sha256:')]
        if len(matches)!=1:raise ValueError('missing/ambiguous immutable '+label+' artifact')
        out[label+'_artifact_id']=str(matches[0]['id'])
    with open(os.environ['GITHUB_OUTPUT'],'a') as output:
        for key,value in out.items():output.write(key+'='+value+'\n')
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('mode',choices=['seal','admit','resolve','seal-core','admit-core','stage-core-cache']);p.add_argument('--snapshot',type=Path);p.add_argument('--repo',type=Path,default=Path('.'));p.add_argument('--run-id');p.add_argument('--pages-base');p.add_argument('--event-sha');p.add_argument('--attempt');p.add_argument('--grib-source',type=Path);a=p.parse_args()
    if a.mode=='admit' and (not a.event_sha or not a.attempt):p.error('authenticated --event-sha and --attempt required for admission')
    published=None
    if a.pages_base:
        try:published=published_meta(a.pages_base)
        except urllib.error.HTTPError as error:
            if error.code!=404:raise
    result=resolve_reuse(a.run_id) if a.mode=='resolve' else stage_core_cache(a.snapshot,a.grib_source) if a.mode=='stage-core-cache' else core_checkpoint(a.snapshot,a.repo,a.mode=='seal-core',a.run_id) if a.mode.endswith('-core') else seal(a.snapshot,a.repo) if a.mode=='seal' else admit(a.snapshot,a.repo,a.run_id,published=published,expected_event_sha=a.event_sha,expected_attempt=a.attempt)
    print(json.dumps(result,indent=2))

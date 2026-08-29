#!/usr/bin/env python3
from __future__ import annotations
import json,os,shutil,subprocess,tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PUBLISHER=ROOT/'tools/ruc/publish_ruc_r2.sh'

def main():
  with tempfile.TemporaryDirectory(prefix='mid-ruc-publish-') as td:
    t=Path(td);out=t/'out';remote=t/'remote';bin_dir=t/'bin';out.mkdir();remote.mkdir();bin_dir.mkdir();log=t/'aws.log'
    run='202608282200';prefix=f'runs/{run}'
    payloads={'deterministic.bin':b'det'*20,'eps-summary.bin':b'sum'*18,'eps-members.bin':b'eps'*30,'lookup.bin':b'look'*12}
    for name,data in payloads.items():(out/name).write_bytes(data)
    meta={'schema':'mid.dwd.ruc.grid.v2','run':run,'times':['2026-08-28T21:00'],'pointCount':1,'lookup':{'key':f'{prefix}/lookup.bin'},'deterministic':{'key':f'{prefix}/deterministic.bin'},'epsSummary':{'key':f'{prefix}/eps-summary.bin'},'eps':{'key':f'{prefix}/eps-members.bin'},'objects':{name:{'bytes':len(data),'sha256':'0'*64} for name,data in payloads.items()}}
    (out/'latest.json').write_text(json.dumps(meta),encoding='utf-8')
    fallback='202608281700'
    for old in [fallback,'202608281800','202608281900','202608282000','202608282100']:
      p=remote/'mid-ruc-data'/'runs'/old;p.mkdir(parents=True);(p/'dummy').write_text('x')
    bucket=remote/'mid-ruc-data';bucket.mkdir(parents=True,exist_ok=True)
    (bucket/'latest.json').write_text(json.dumps({'schema':'mid.dwd.ruc.grid.v2','run':fallback}),encoding='utf-8')
    fake=bin_dir/'aws';fake.write_text(r'''#!/usr/bin/env python3
import os,sys,shutil
from pathlib import Path
args=sys.argv[1:];root=Path(os.environ['FAKE_R2_ROOT']);log=Path(os.environ['FAKE_AWS_LOG'])
def path(uri):
 assert uri.startswith('s3://'); rest=uri[5:]; bucket,_,key=rest.partition('/'); return root/bucket/key
def add(line):
 with log.open('a') as f:f.write(line+'\n')
if args[:2]==['s3api','head-object']:
 bucket=args[args.index('--bucket')+1];key=args[args.index('--key')+1];p=root/bucket/key
 if not p.is_file():sys.exit(1)
 print(p.stat().st_size);sys.exit(0)
if args[:2]==['s3','cp']:
 src,dst=args[2],args[3]
 if src.startswith('s3://'):
  p=path(src)
  if not p.is_file():sys.exit(1)
  shutil.copyfile(p,dst);add('GET '+src[5:])
 else:
  p=path(dst);p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,p);add('PUT '+dst[5:])
 sys.exit(0)
if args[:2]==['s3','ls']:
 p=path(args[2]);
 if p.is_dir():
  for child in sorted(p.iterdir()):
   if child.is_dir():print('                           PRE '+child.name+'/')
 sys.exit(0)
if args[:2]==['s3','rm']:
 p=path(args[2]);shutil.rmtree(p,ignore_errors=True);add('RM '+args[2][5:]);sys.exit(0)
print('unsupported fake aws call',args,file=sys.stderr);sys.exit(2)
''',encoding='utf-8');fake.chmod(0o755)
    env={**os.environ,'PATH':str(bin_dir)+os.pathsep+os.environ.get('PATH',''),'MID_RUC_OUTPUT_DIR':str(out),'MID_RUC_R2_BUCKET':'mid-ruc-data','CLOUDFLARE_ACCOUNT_ID':'acct','AWS_ACCESS_KEY_ID':'x','AWS_SECRET_ACCESS_KEY':'y','FAKE_R2_ROOT':str(remote),'FAKE_AWS_LOG':str(log),'MID_RUC_RETAIN_RUNS':'4'}
    first=subprocess.run([str(PUBLISHER)],cwd=ROOT,env=env,text=True,capture_output=True,check=True)
    lines=log.read_text().splitlines();puts=[x for x in lines if x.startswith('PUT ')]
    assert puts[-1]=='PUT mid-ruc-data/latest.json',lines
    assert all(f'PUT mid-ruc-data/{prefix}/{name}' in lines for name in payloads),lines
    latest_index=lines.index('PUT mid-ruc-data/latest.json');rm_indices=[i for i,x in enumerate(lines) if x.startswith('RM ')]
    assert rm_indices,lines
    # Preflight may remove orphan/stale runs, but it must preserve the run currently
    # referenced by remote latest.json until the new complete pointer has switched.
    fallback_rm=[i for i,x in enumerate(lines) if x==f'RM mid-ruc-data/runs/{fallback}/']
    assert fallback_rm and min(fallback_rm)>latest_index,lines
    runs=sorted(p.name for p in (remote/'mid-ruc-data'/'runs').iterdir() if p.is_dir());assert len(runs)==4 and run in runs,runs
    before=list(lines)
    second=subprocess.run([str(PUBLISHER)],cwd=ROOT,env=env,text=True,capture_output=True,check=True)
    after=log.read_text().splitlines();assert not any(x.startswith('PUT ') for x in after[len(before):]),after[len(before):]
    assert 'already complete; no upload needed' in second.stdout
    print('RUC R2 publisher runtime contract OK')
if __name__=='__main__':main()

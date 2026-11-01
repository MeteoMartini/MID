#!/usr/bin/env python3
"""Build the newest complete DWD ICON-D2-RUC/RUC-EPS run.

The downloader is deliberately fail-safe:
- discover common run directories for every required deterministic parameter + EPS,
- try newest to older candidates until one *fully* decodes/builds,
- isolate staging/output per candidate so an incomplete newest run cannot contaminate a fallback,
- publish nothing here; CI uploads immutable objects and latest.json separately/last.
"""
from __future__ import annotations
import argparse,concurrent.futures,html.parser,os,random,re,shutil,ssl,subprocess,sys,time
from datetime import datetime,timedelta,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse,unquote
import requests
import threading
from run_progress import report_run
from native_cadence import is_native_at
from grib_stream import open_grib_stream
from grib_metadata import inspect_grib_header
from optional_stage_parallel import run_optional_downloads

UA='MID-weather-dashboard/RUC-preprocessor'
DET_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p'
EPS_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p'
FORECAST_REQUIRED=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')
GRID_REQUIRED=('CLAT','CLON')
RAPID_REQUIRED=('TOT_PREC','CAPE_ML','CIN_ML')
# Keep 15-minute ingestion limited to fields whose native DWD cadence is
# actually 15 minutes. CAPE_MU/CIN_MU are hourly in ICON-D2-RUC and therefore
# must never be requested through this path.
RAPID_OPTIONAL_15=('DBZ_CMAX','LPI','LPI_MAX','UH_MAX','UH_MAX_LOW','UH_MAX_MED','ECHOTOPinM','HAIL_GSP','LAPSE_RATE','W_CTMAX','VORW_CTMAX','RAIN_GSP','SNOW_GSP','GRAU_GSP')
# Native 15-min-Zustandsgrößen werden nur dort gehalten, wo die höhere
# Kadenz fachlich einen echten Mehrwert für die unmittelbare Kurzfrist hat.
# Der aktuelle DWD-Feed liefert VIS/CEILING nativ viertelstündlich. Temperatur,
# Wind, Druck und Bewölkung liegen im operativen RUC-Verzeichnis für 0..+6 h
# dagegen stündlich vor; HZEROCL/SNOWLMT bleiben bewusst stündlich, weil ihre
# Änderung langsamer ist und die Niederschlagsphase separat 15-minütig vorliegt.
# Wir etikettieren keine interpolierten Stundenwerte als native 15-min-Daten.
RAPID_STATE_OPTIONAL_15=('VIS','CEILING')
for _parameter in RAPID_STATE_OPTIONAL_15:
    if not is_native_at(_parameter,900): raise RuntimeError(f'{_parameter}: RUC cadence contract is not 15 min')
for _parameter in ('CAPE_MU','CIN_MU','T_2M','U_10M','V_10M','VMAX_10M','CLCT','CLCL'):
    if not is_native_at(_parameter,3600): raise RuntimeError(f'{_parameter}: RUC cadence contract is not hourly')
SPECIALIST_HOURLY_OPTIONAL=('CAPE_MU','CIN_MU','VIS','CEILING','HZEROCL','SNOWLMT','CLCM','CLCH','T_G','H_SNOW')
REQUIRED=FORECAST_REQUIRED+GRID_REQUIRED
RUN_RE=re.compile(r'^20\d\d-\d\d-\d\dT\d\d:\d\d/$')
GRIB_RE=re.compile(r'\.(?:grib2|grb2)(?:\.bz2)?$',re.I)
LEAD_RE=re.compile(r'PT(?P<hours>\d{3})H(?P<minutes>\d{2})M',re.I)
DEFAULT_DOWNLOAD_WORKERS=8
NETWORK_ATTEMPTS=4
# A requests.Session contains mutable headers/cookies and must never be
# shared across concurrent worker threads. Each pool worker owns one.
_RUC_HTTP_WORKER=threading.local()

def transient_tls_eof(error):
 # Requests/urllib3 wrap the actual SSL exception in args/reason/cause.
 # A text mentioning EOF is not proof, and certificate errors always win.
 pending=[error];seen=set();eof=False
 while pending:
  item=pending.pop()
  if id(item) in seen:continue
  seen.add(id(item))
  if isinstance(item,ssl.SSLCertVerificationError) or (isinstance(item,ssl.SSLError) and getattr(item,'reason',None)=='CERTIFICATE_VERIFY_FAILED'):return False
  if isinstance(item,ssl.SSLEOFError):eof=True
  elif isinstance(item,ssl.SSLError):return False
  for nested in (getattr(item,'reason',None),item.__cause__,item.__context__,*item.args):
   if isinstance(nested,BaseException):pending.append(nested)
 return eof

def retry_network(operation,label):
 for attempt in range(NETWORK_ATTEMPTS):
  try:return operation()
  except (requests.ConnectionError,requests.Timeout,requests.exceptions.ChunkedEncodingError,requests.HTTPError) as exc:
   status=exc.response.status_code if isinstance(exc,requests.HTTPError) and exc.response is not None else None
   if status is not None and status not in (408,429,500,502,503,504):raise
   # Only a typed abrupt transport EOF is retryable. No TLS setting changes.
   if isinstance(exc,requests.exceptions.SSLError) and not transient_tls_eof(exc):raise
   if attempt+1==NETWORK_ATTEMPTS:raise
   delay=min(16,2**(attempt+1))+random.uniform(0,.5)
   print(f'{label}: transient {type(exc).__name__}; retry {attempt+2}/{NETWORK_ATTEMPTS} in {delay:.1f}s',flush=True)
   time.sleep(delay)

class Links(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.href=[]
 def handle_starttag(self,tag,attrs):
  if tag.lower()=='a':
   value=dict(attrs).get('href')
   if value:self.href.append(__import__('html').unescape(value))

def session():
 s=requests.Session();s.headers.update({'User-Agent':UA,'Accept':'text/html,application/octet-stream;q=0.9,*/*;q=0.5'});return s

def index(s,url):
 def request():
  with s.get(url,timeout=25) as r:
   r.raise_for_status();p=Links();p.feed(r.text);return p.href
 return retry_network(request,'DWD directory')

def runs(s,base,param):
 out=set()
 for href in index(s,f'{base}/{param}/r/'):
  decoded=unquote(href)
  if RUN_RE.match(decoded):out.add(decoded[:-1])
 return out

def common_runs(s):
 common=None
 for param in REQUIRED:
  values=runs(s,DET_BASE,param);common=values if common is None else common&values
 eps=runs(s,EPS_BASE,'TOT_PREC');common=(common or set())&eps
 return sorted(common or set(),reverse=True)

def crawl_files(s,root,max_depth=7):
 root=root if root.endswith('/') else root+'/';todo=[(root,0)];seen=set();files=[]
 while todo:
  url,depth=todo.pop()
  if url in seen:continue
  seen.add(url)
  for href in index(s,url):
   if href in ('../','./') or href.startswith('?') or href.startswith('#'):continue
   absolute=urljoin(url,href)
   if not absolute.startswith(root):continue
   if href.endswith('/'):
    if depth<max_depth:todo.append((absolute,depth+1))
   elif GRIB_RE.search(urlparse(absolute).path):files.append(absolute)
 return sorted(set(files))

def forecast_lead_minutes(url):
 path=unquote(urlparse(url).path);match=LEAD_RE.search(path)
 if not match:return None
 return int(match.group('hours'))*60+int(match.group('minutes'))

def select_requested_files(files,hours,mode='hourly',rapid_hours=6):
 limit=max(0,int(hours))*60
 rapid_limit=min(limit,max(0,int(rapid_hours))*60)
 selected=[]
 for url in files:
  lead=forecast_lead_minutes(url)
  if lead is None:selected.append(url);continue
  if lead>limit:continue
  keep=False
  if mode=='hourly':keep=lead%60==0
  elif mode=='rapid-precip':keep=lead<=rapid_limit and lead%5==0
  elif mode=='rapid15':keep=lead<=rapid_limit and lead%15==0
  elif mode=='rapid5':keep=lead<=rapid_limit and lead%5==0
  elif mode=='native6h':keep=lead<=rapid_limit
  else:raise ValueError(f'unknown cadence mode {mode}')
  if keep:selected.append(url)
 return selected

def download_one(url,target):
 target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and target.stat().st_size>100:return
 tmp=target.with_suffix(target.suffix+'.part')
 def request():
  try:
   worker_http=getattr(_RUC_HTTP_WORKER,'client',None)
   getter=worker_http.get if worker_http is not None else requests.get
   with getter(url,headers={'User-Agent':UA},stream=True,timeout=90) as r:
    r.raise_for_status()
    with tmp.open('wb') as f:
     for chunk in r.iter_content(1024*1024):
      if chunk:f.write(chunk)
   if not tmp.exists() or tmp.stat().st_size<80:raise RuntimeError(f'suspiciously small DWD file {url}')
   tmp.replace(target)
  finally:
   # A failed stream must never become a reusable completed GRIB.
   tmp.unlink(missing_ok=True)
 retry_network(request,'DWD GRIB download')

def grib_valid_times(path,expected_run=None):
 from eccodes import codes_grib_new_from_file,codes_get,codes_release
 with open_grib_stream(path) as f:
  while True:
   gid=codes_grib_new_from_file(f)
   if gid is None:break
   try:
    valid,_signature=inspect_grib_header(gid,expected_run)
    yield valid
   finally:codes_release(gid)

def validate_hourly_coverage(paths,run,hours,param):
 base=datetime.fromisoformat(run.replace('Z','+00:00'))
 if base.tzinfo is None:base=base.replace(tzinfo=timezone.utc)
 targets={base+timedelta(hours=h) for h in range(hours+1)}
 found=[valid for path in paths for valid in grib_valid_times(path,expected_run=base)]
 if len(found)!=len(set(found)):
  raise RuntimeError(f'data-incomplete: {param}: duplicate deterministic GRIB validity timestamps')
 missing=sorted(targets-set(found))
 if missing:raise RuntimeError(f'data-incomplete: {param}: missing hourly targets: '+','.join(t.isoformat() for t in missing[:4]))

def eps_grib_headers(path,expected_run):
  """Scan genuine ecCodes validity and member headers without decoding values."""
  from eccodes import codes_grib_new_from_file,codes_get,codes_release
  with open_grib_stream(path) as source:
   while True:
    gid=codes_grib_new_from_file(source)
    if gid is None:break
    try:
     valid,_=inspect_grib_header(gid,expected_run,expected_parameter='precipitation_acc')
     member=None
     for key in ('perturbationNumber','number'):
      try:member=int(codes_get(gid,key));break
      except Exception:pass
     if member is None:raise RuntimeError('data-incomplete: RUC-EPS member metadata missing')
     yield valid,member
    finally:codes_release(gid)


def validate_eps_header_coverage(paths,run,hours,expected_members=range(1,21)):
  """Only an early filter, not permission to skip full value/bitmap/grid checks."""
  base=datetime.fromisoformat(run.replace('Z','+00:00'))
  if base.tzinfo is None:base=base.replace(tzinfo=timezone.utc)
  targets={base+timedelta(hours=h):set() for h in range(hours+1)}
  required=set(expected_members)
  if not required or any(type(member) is not int or member<1 for member in required):
   raise ValueError('invalid RUC-EPS preflight member contract')
  observed=0
  for path in paths:
   for valid,member in eps_grib_headers(path,base):
    if valid not in targets:continue
    if member not in required:raise RuntimeError(f'data-incomplete: RUC-EPS unexpected member {member} at {valid.isoformat()}')
    if member in targets[valid]:raise RuntimeError(f'data-incomplete: RUC-EPS duplicate member {member} at {valid.isoformat()}')
    targets[valid].add(member);observed+=1
  for valid,found in targets.items():
   missing=sorted(required-found)
   if missing:raise RuntimeError(f'data-incomplete: RUC-EPS missing members {missing[:20]} at {valid.isoformat()}')
  print(f'RUC_EPS_HEADER_PREFLIGHT complete run={run} hours={hours} members={len(required)} records={observed}; full values/bitmap/grid checks still required',flush=True)


def stage_tree(s,url,target,hours,label,*,mode='hourly',max_download_workers=None):
 discovered=crawl_files(s,url)
 if not discovered:raise RuntimeError(f'No GRIB2 files under {url}')
 files=select_requested_files(discovered,hours,mode=mode)
 if not files:raise RuntimeError(f'No requested GRIB2 files under {url}')
 root=url if url.endswith('/') else url+'/'
 configured=int(os.getenv('MID_RUC_DOWNLOAD_WORKERS',str(DEFAULT_DOWNLOAD_WORKERS)))
 if max_download_workers is not None:
  if type(max_download_workers) is not int or not 1<=max_download_workers<=12:raise ValueError('invalid optional per-field worker bound')
  configured=min(configured,max_download_workers)
 workers=max(1,min(12,configured,len(files)))
 grid_label={'hourly':f'hourly 0..{hours}h','rapid-precip':'5 min 0..6h','rapid15':'15 min 0..6h','rapid5':'5 min 0..6h','native6h':'native cadence 0..6h'}.get(mode,mode)
 print(f'{label}: selected {len(files)}/{len(discovered)} GRIB files for {grid_label}; {workers} download workers',flush=True)
 def job(file_url):
  rel=unquote(urlparse(file_url).path[len(urlparse(root).path):]).lstrip('/');download_one(file_url,target/rel);return rel
 rows=[];completed=0;report_every=max(1,min(10,len(files)//3 or 1))
 clients=[];client_lock=threading.Lock()
 def initialize_worker():
  client=session()
  _RUC_HTTP_WORKER.client=client
  with client_lock:
   clients.append(client)
 try:
  with concurrent.futures.ThreadPoolExecutor(max_workers=workers,initializer=initialize_worker) as pool:
   futures=[pool.submit(job,file_url) for file_url in files]
   for future in concurrent.futures.as_completed(futures):
    rows.append(future.result());completed+=1
    if completed==len(files) or completed%report_every==0:print(f'{label}: downloaded {completed}/{len(files)}',flush=True)
 finally:
  # All futures have completed before closing; never leak open sockets.
  for client in clients:client.close()
 return sorted(rows)



def stage_coordinate(s,url,target,label):
 discovered=crawl_files(s,url)
 if not discovered:raise RuntimeError(f'No GRIB2 coordinate files under {url}')
 # CLAT/CLON are time-constant native ICON cell coordinates. Prefer analysis lead 0;
 # fall back to the first advertised file if DWD changes the filename convention.
 zero=[file_url for file_url in discovered if forecast_lead_minutes(file_url)==0]
 selected=(zero or discovered)[:1]
 print(f'{label}: selected 1/{len(discovered)} native-grid coordinate GRIB file',flush=True)
 root=url if url.endswith('/') else url+'/'
 file_url=selected[0]
 rel=unquote(urlparse(file_url).path[len(urlparse(root).path):]).lstrip('/')
 download_one(file_url,target/rel)
 return [rel]

def stage_optional_parameters(run,stage,hours):
 """Fetch independent *optional* parameter trees with bounded total DWD concurrency.

 Existing strict GRIB parsing, native cadence and SHA/bitmap/NoData checks run in
 build_ruc_bundle unchanged; required deterministic and EPS paths are serial.
 Two independent directory sessions and at most the same total download slots
 as the former one-at-a-time 8-worker stage are used, never more.
 """
 optional_start=time.monotonic()
 global_limit=max(1,min(12,int(os.getenv('MID_RUC_DOWNLOAD_WORKERS',str(DEFAULT_DOWNLOAD_WORKERS)))))
 fields_in_flight=2 if global_limit>=2 else 1
 per_field_limit=max(1,global_limit//fields_in_flight)
 specs=([(param,'rapid-optional','rapid15','optional') for param in RAPID_OPTIONAL_15]
       +[(param,'rapid-state','rapid15','rapid-state') for param in RAPID_STATE_OPTIONAL_15]
       +[(param,'specialist-hourly','hourly','specialist') for param in SPECIALIST_HOURLY_OPTIONAL])
 def task(spec):
  param,subdir,mode,label=spec
  # Requests sessions are not shared across concurrent directory crawls.
  with session() as independent:
   return stage_tree(independent,f'{DET_BASE}/{param}/r/{run}/',
                     stage/subdir/param,hours,f'{run} {label} {param}',
                     mode=mode,max_download_workers=per_field_limit)
 results=run_optional_downloads(specs,task,max_concurrent=fields_in_flight)
 for (param,subdir,mode,label),rows,error in results:
  if error is not None:
   # A failed optional fetch must not leave partial bytes for the builder.
   shutil.rmtree(stage/subdir/param,ignore_errors=True)
   print(f'{run} {label} {param}: unavailable/invalid ({type(error).__name__}: {error})',flush=True)
  else:
   print(f'{run} {label} {param}: {len(rows)} staged GRIB files',flush=True)
 print(f'RUC_OPTIONAL_STAGE run={run} seconds={time.monotonic()-optional_start:.3f} available={len([row for row in results if row[2] is None])} total={len(results)} workers={fields_in_flight}x{per_field_limit}',flush=True)
 return len([row for row in results if row[2] is None])


def build_candidate(s,run,stage_root,output,hours):
 started_at=time.monotonic()
 run_key=re.sub(r'[^0-9A-Za-z_-]','',run);stage=stage_root/run_key;tmp=output.parent/f'.{output.name}.{run_key}.tmp'
 shutil.rmtree(stage,ignore_errors=True);shutil.rmtree(tmp,ignore_errors=True);stage.mkdir(parents=True,exist_ok=True);tmp.mkdir(parents=True,exist_ok=True)
 # The newest RUC-EPS directory can advertise a partially published cycle.
 # Reject missing native members and hours before expensive deterministic downloads.
 eps_rows=stage_tree(s,f'{EPS_BASE}/TOT_PREC/r/{run}/',stage/'eps'/'TOT_PREC',hours,f'{run} RUC-EPS TOT_PREC',mode='hourly')
 print(f'{run} RUC-EPS TOT_PREC: {len(eps_rows)} staged GRIB files',flush=True)
 validate_eps_header_coverage([stage/'eps'/'TOT_PREC'/row for row in eps_rows],run,hours)
 for param in FORECAST_REQUIRED:
  rows=stage_tree(s,f'{DET_BASE}/{param}/r/{run}/',stage/'deterministic'/param,hours,f'{run} {param}',mode='hourly');print(f'{run} {param}: {len(rows)} staged GRIB files',flush=True)
  # Read headers only, before expensive optional/EPS downloads. The builder
  # still performs its full grid/value/member checks independently.
  validate_hourly_coverage([stage/'deterministic'/param/row for row in rows],run,hours,param)
 for param in RAPID_REQUIRED:
  mode='rapid-precip' if param=='TOT_PREC' else 'rapid15'
  rows=stage_tree(s,f'{DET_BASE}/{param}/r/{run}/',stage/'rapid'/param,hours,f'{run} rapid {param}',mode=mode);print(f'{run} rapid {param}: {len(rows)} staged GRIB files',flush=True)
 stage_optional_parameters(run,stage,hours)
 for param in GRID_REQUIRED:
  rows=stage_coordinate(s,f'{DET_BASE}/{param}/r/{run}/',stage/'grid'/param,f'{run} {param}');print(f'{run} {param}: {len(rows)} staged coordinate GRIB file',flush=True)
 download_seconds=time.monotonic()-started_at
 builder_start=time.monotonic()
 builder=Path(__file__).with_name('build_ruc_bundle.py');subprocess.run([sys.executable,str(builder),'--staging',str(stage),'--output',str(tmp),'--run',run,'--hours',str(hours)],check=True)
 print(f'RUC_P3_PHASES run={run} download_stage_seconds={download_seconds:.3f} native_builder_seconds={time.monotonic()-builder_start:.3f}',flush=True)
 required=('deterministic.bin','eps-summary.bin','eps-members.bin','lookup.bin','latest.json')
 missing=[name for name in required if not (tmp/name).is_file() or (tmp/name).stat().st_size<2]
 if missing:raise RuntimeError('builder output incomplete: '+','.join(missing))
 shutil.rmtree(output,ignore_errors=True);os.replace(tmp,output);return run

def main():
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--stage',type=Path,default=Path('.ruc-stage'));p.add_argument('--run');p.add_argument('--candidate-count',type=int,default=4);p.add_argument('--hours',type=int,default=int(os.getenv('MID_RUC_FORECAST_HOURS','14')));a=p.parse_args();s=session()
 candidates=[a.run] if a.run else common_runs(s)[:max(1,a.candidate_count)]
 if not candidates:raise SystemExit('No common DWD RUC/RUC-EPS run directories found')
 errors=[]
 for run in candidates:
  report_run('wird geprüft und aufbereitet',run);print(f'Trying DWD common RUC/RUC-EPS run: {run}',flush=True)
  try:
   selected=build_candidate(s,run,a.stage,a.output,a.hours);print(f'Selected complete DWD RUC/RUC-EPS run: {selected}',flush=True);report_run('vollständig aufbereitet · noch nicht veröffentlicht',selected);return
  except Exception as exc:
   report_run('Kandidat verworfen',run)
   category='download-failed' if isinstance(exc,requests.RequestException) else 'data-or-build-failed'
   errors.append(f'{run}: {type(exc).__name__}: {exc}');print(f'Candidate {run} incomplete/unusable [{category}]: {exc}',file=sys.stderr,flush=True)
 raise SystemExit('No complete buildable RUC/RUC-EPS run. '+' | '.join(errors))
if __name__=='__main__':main()

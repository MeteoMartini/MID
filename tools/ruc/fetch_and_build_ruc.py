#!/usr/bin/env python3
"""Build the newest complete DWD ICON-D2-RUC/RUC-EPS run.

The downloader is deliberately fail-safe:
- discover common run directories for every required deterministic parameter + EPS,
- try newest to older candidates until one *fully* decodes/builds,
- isolate staging/output per candidate so an incomplete newest run cannot contaminate a fallback,
- publish nothing here; CI uploads immutable objects and latest.json separately/last.
"""
from __future__ import annotations
import argparse,concurrent.futures,html.parser,os,re,shutil,subprocess,sys
from pathlib import Path
from urllib.parse import urljoin,urlparse,unquote
import requests

UA='MID-weather-dashboard/RUC-preprocessor'
DET_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p'
EPS_BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc-eps/p'
FORECAST_REQUIRED=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML')
GRID_REQUIRED=('CLAT','CLON')
REQUIRED=FORECAST_REQUIRED+GRID_REQUIRED
RUN_RE=re.compile(r'^20\d\d-\d\d-\d\dT\d\d:\d\d/$')
GRIB_RE=re.compile(r'\.(?:grib2|grb2)(?:\.bz2)?$',re.I)
LEAD_RE=re.compile(r'PT(?P<hours>\d{3})H(?P<minutes>\d{2})M',re.I)
DEFAULT_DOWNLOAD_WORKERS=8

class Links(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.href=[]
 def handle_starttag(self,tag,attrs):
  if tag.lower()=='a':
   value=dict(attrs).get('href')
   if value:self.href.append(__import__('html').unescape(value))

def session():
 s=requests.Session();s.headers.update({'User-Agent':UA,'Accept':'text/html,application/octet-stream;q=0.9,*/*;q=0.5'});return s

def index(s,url):
 r=s.get(url,timeout=25);r.raise_for_status();p=Links();p.feed(r.text);return p.href

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

def select_requested_files(files,hours,rapid_hours=6,hourly_only=False):
 limit=max(0,int(hours))*60
 rapid_limit=min(limit,max(0,int(rapid_hours))*60)
 # Deterministic RUC keeps native 15-minute leads in the nowcasting-near 0..6 h
 # window, then hourly leads through +14 h. RUC-EPS remains hourly. Unknown
 # legacy filenames are retained fail-safe instead of being silently discarded.
 selected=[]
 for url in files:
  lead=forecast_lead_minutes(url)
  if lead is None:selected.append(url);continue
  if lead>limit:continue
  if hourly_only or lead>rapid_limit:
   if lead%60==0:selected.append(url)
  elif lead%15==0:selected.append(url)
 return selected

def download_one(url,target):
 target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and target.stat().st_size>100:return
 tmp=target.with_suffix(target.suffix+'.part')
 with requests.get(url,headers={'User-Agent':UA},stream=True,timeout=90) as r:
  r.raise_for_status()
  with tmp.open('wb') as f:
   for chunk in r.iter_content(1024*1024):
    if chunk:f.write(chunk)
 if not tmp.exists() or tmp.stat().st_size<80:raise RuntimeError(f'suspiciously small DWD file {url}')
 tmp.replace(target)

def stage_tree(s,url,target,hours,label,*,hourly_only=False):
 discovered=crawl_files(s,url)
 if not discovered:raise RuntimeError(f'No GRIB2 files under {url}')
 files=select_requested_files(discovered,hours,hourly_only=hourly_only)
 if not files:raise RuntimeError(f'No requested GRIB2 files under {url}')
 root=url if url.endswith('/') else url+'/'
 workers=max(1,min(12,int(os.getenv('MID_RUC_DOWNLOAD_WORKERS',str(DEFAULT_DOWNLOAD_WORKERS))),len(files)))
 grid_label=f'hourly 0..{hours}h' if hourly_only else f'15 min 0..6h + hourly ..{hours}h'
 print(f'{label}: selected {len(files)}/{len(discovered)} GRIB files for {grid_label}; {workers} download workers',flush=True)
 def job(file_url):
  rel=unquote(urlparse(file_url).path[len(urlparse(root).path):]).lstrip('/');download_one(file_url,target/rel);return rel
 rows=[];completed=0;report_every=max(1,min(10,len(files)//3 or 1))
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
  futures=[pool.submit(job,file_url) for file_url in files]
  for future in concurrent.futures.as_completed(futures):
   rows.append(future.result());completed+=1
   if completed==len(files) or completed%report_every==0:print(f'{label}: downloaded {completed}/{len(files)}',flush=True)
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

def build_candidate(s,run,stage_root,output,hours):
 run_key=re.sub(r'[^0-9A-Za-z_-]','',run);stage=stage_root/run_key;tmp=output.parent/f'.{output.name}.{run_key}.tmp'
 shutil.rmtree(stage,ignore_errors=True);shutil.rmtree(tmp,ignore_errors=True);stage.mkdir(parents=True,exist_ok=True);tmp.mkdir(parents=True,exist_ok=True)
 for param in FORECAST_REQUIRED:
  rows=stage_tree(s,f'{DET_BASE}/{param}/r/{run}/',stage/'deterministic'/param,hours,f'{run} {param}');print(f'{run} {param}: {len(rows)} staged GRIB files',flush=True)
 for param in GRID_REQUIRED:
  rows=stage_coordinate(s,f'{DET_BASE}/{param}/r/{run}/',stage/'grid'/param,f'{run} {param}');print(f'{run} {param}: {len(rows)} staged coordinate GRIB file',flush=True)
 eps_rows=stage_tree(s,f'{EPS_BASE}/TOT_PREC/r/{run}/',stage/'eps'/'TOT_PREC',hours,f'{run} RUC-EPS TOT_PREC',hourly_only=True);print(f'{run} RUC-EPS TOT_PREC: {len(eps_rows)} staged GRIB files',flush=True)
 builder=Path(__file__).with_name('build_ruc_bundle.py');subprocess.run([sys.executable,str(builder),'--staging',str(stage),'--output',str(tmp),'--run',run,'--hours',str(hours)],check=True)
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
  print(f'Trying DWD common RUC/RUC-EPS run: {run}',flush=True)
  try:
   selected=build_candidate(s,run,a.stage,a.output,a.hours);print(f'Selected complete DWD RUC/RUC-EPS run: {selected}',flush=True);return
  except Exception as exc:
   errors.append(f'{run}: {type(exc).__name__}: {exc}');print(f'Candidate {run} incomplete/unusable: {exc}',file=sys.stderr,flush=True)
 raise SystemExit('No complete buildable RUC/RUC-EPS run. '+' | '.join(errors))
if __name__=='__main__':main()

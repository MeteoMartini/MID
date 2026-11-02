"""Reproduce a map candidate from a SHA-bound RUC Actions archive, read-only.

The supplied archive SHA must come from verified GitHub artifact metadata.
Only fixed output names are written; archive entries are never extracted.
"""
from __future__ import annotations
import argparse,copy,hashlib,json,re,tempfile,shutil,os,zipfile
from pathlib import Path
from lossless_codec_pilot import decode_candidate
from ruc_map_candidate import build_candidate
from audit_model_domain_coverage import inspect as audit_full_domain

def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  while data:=f.read(1024*1024):h.update(data)
 return h.hexdigest()

def replay(archive:Path,expected_sha:str,output:Path):
 archive=Path(archive).resolve(strict=True);output=Path(output).resolve()
 if not re.fullmatch('[a-f0-9]{64}',expected_sha) or digest(archive)!=expected_sha:raise ValueError('archive SHA mismatch')
 if output.exists() or archive.is_relative_to(output):raise ValueError('archive probe output must be new and disjoint')
 output.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='.ruc-archive-probe-',dir=output.parent) as tmp:
  work=Path(tmp);source=work/'source';source.mkdir();objects={}
  with zipfile.ZipFile(archive) as z:
   if len(z.namelist())!=len(set(z.namelist())):raise ValueError('duplicate archive entries')
   if z.getinfo('latest.json').file_size>8_000_000:raise ValueError('manifest budget')
   original=z.read('latest.json');m=json.loads(original)
   if m.get('schema')!='mid.dwd.ruc.grid.v2' or m.get('storageProfile')!='pages-lossless-v1':raise ValueError('not a released lossless RUC profile')
   page=m['deterministic']['compressedPages'];cursor=0
   if page.get('schema')!='mid.ruc.compressed-pages.v1' or page.get('recordBytes')!=m['deterministic']['recordBytes'] or not 0<page.get('records',0)<=1_000_000:raise ValueError('invalid compressed geometry')
   if not isinstance(page.get('parts'),list) or not 1<=len(page['parts'])<=8192:raise ValueError('invalid compressed parts')
   with (source/'deterministic.bin').open('wb') as f:
    for part in page['parts']:
     if part['firstRecord']!=cursor or type(part['recordCount']) is not int or part['recordCount']<=0:raise ValueError('noncontiguous compressed records')
     manifest=part['manifest']
     if manifest['decodedBytes']!=part['recordCount']*page['recordBytes'] or manifest['decodedBytes']>524288:raise ValueError('decoded part geometry/budget')
     if z.getinfo(part['key']).file_size!=manifest['encodedBytes']:raise ValueError('wire part size')
     raw=decode_candidate(manifest,z.read(part['key']));f.write(raw);cursor+=part['recordCount']
   if cursor!=page['records'] or cursor!=m['pointCount']:raise ValueError('point coverage mismatch')
   objects['deterministic.bin']={'bytes':(source/'deterministic.bin').stat().st_size,'sha256':digest(source/'deterministic.bin')}
   lookup=m['lookup']['pages'];bykey={r['key']:r for r in m['pages']['objects']}
   if lookup['recordBytes']!=4 or not 1<=lookup['chunkCount']<=8192:raise ValueError('invalid lookup geometry')
   with (source/'lookup.bin').open('wb') as f:
    for i in range(lookup['chunkCount']):
     key=lookup['prefix']+'/'+str(i).zfill(4)+'.bin';desc=bykey[key]
     if not 0<desc['bytes']<=524288 or z.getinfo(key).file_size!=desc['bytes']:raise ValueError('lookup size/budget')
     raw=z.read(key)
     if hashlib.sha256(raw).hexdigest()!=desc['sha256']:raise ValueError('lookup SHA')
     f.write(raw)
   if (source/'lookup.bin').stat().st_size!=lookup['records']*4:raise ValueError('lookup record coverage')
   objects['lookup.bin']={'bytes':(source/'lookup.bin').stat().st_size,'sha256':digest(source/'lookup.bin')}
  meta={k:copy.deepcopy(m[k]) for k in ['schema','run','pointCount','grid','deterministic','lookup']}
  meta['deterministic'].pop('compressedPages');meta['lookup'].pop('pages');meta['objects']=objects
  (source/'latest.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
  (work/'original-latest.json').write_bytes(original)
  candidate=build_candidate(source,work/'maps')
  full=audit_full_domain(source,work/'maps')
  if not full['allFramesCoverKnownNativeLookup'] or not full['allPublishedFrameValuesMatchNativeSource'] or not full['allSourceForecastHoursPresent'] or len(full['products'])!=6:
   raise ValueError('Original archive cannot reproduce complete native map lookup')
  report={'schema':'mid.ruc.archive-map-probe.v1','archiveSha256':expected_sha,'originalManifestSha256':hashlib.sha256(original).hexdigest(),'reconstructedObjects':objects,'sourceRun':m['run'],'nativePoints':m['pointCount'],'mapBytes':candidate['candidateBytes'],'candidateIndexSha256':digest(work/'maps'/'index.json'),'fullNativeLookupVerified':True,'full27HourSourceAxis':full['full27HourSourceAxis'],'nativeLookupCoveredCells':full['nativeLookupCoveredCells'],'partCount':len(page['parts']),'products':{k:len(p['frames']) for k,p in candidate['products'].items()},'productionEnabled':False,'readyForProduction':False}
  (work/'report.json').write_text(json.dumps(report,indent=2)+'\n')
  if output.exists():raise ValueError('output appeared during archive replay')
  os.rename(work,output)
 return report

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--archive',type=Path,required=True);p.add_argument('--sha256',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 print(json.dumps(replay(a.archive,a.sha256,a.output)))

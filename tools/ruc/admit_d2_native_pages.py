"""Only admit already separately release-qualified DWD native full-region data.

Never promotes a pilot index; every field + source transport must explicitly
have productionApproved=true from a different SHA-bound original source gate.
Atomic staging is handled by prepare_ruc_pages; this file only verifies/copies
into its pre-existing temporary output, with the canonical Pages budget.
"""
from __future__ import annotations
import gzip,hashlib,json,re,shutil
from datetime import datetime,timedelta,timezone
from pathlib import Path
KINDS=('temperature','pressure','wind','gust','cloud','thetae','sigwx','precipitation')
LEADS=(1,2,3,4,5,6,12,24,48)
UNITS=dict(zip(KINDS,('°C','hPa','km/h','km/h','%','K','WMO','mm/1 h')))
DIGEST=re.compile(r'[a-f0-9]{64}')
def sha(p:Path):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''):h.update(c)
 return h.hexdigest()
def admit(root:Path,out:Path,run_slug:str,existing_objects:list[dict],budget:int=900_000_000):
 root=root.resolve(strict=True);out=out.resolve(strict=True)
 source=root/'model-fields-native';index_file=source/'index.json'
 if not index_file.is_file():return None
 index=json.loads(index_file.read_bytes())
 if (index.get('schema')!='mid.icon-d2.native-fields.v2'
     or index.get('productionApproved') is not True
     or index.get('modelId')!='icon-d2'
     or index.get('sampling')!='nearest-native-cell'
     or index.get('nativePoints')!=542040
     or not isinstance(index.get('sourceInventorySha256'),str)
     or not DIGEST.fullmatch(index['sourceInventorySha256'])):
  raise ValueError('Only SHA-qualified, already approved native D2 source can enter Pages')
 run_time=datetime.fromisoformat(index.get('run',''))
 if run_time.tzinfo is None or run_time.utcoffset()!=timedelta(0):
  raise ValueError('Original D2 model run must be timestamped UTC')
 products=index.get('products')
 if not isinstance(products,dict) or set(products)!=set(KINDS):
  raise ValueError('Native original D2 eight-kind matrix incomplete')
 entries=[(index_file,'index.json')];size=index_file.stat().st_size
 for kind in KINDS:
  product=products[kind]
  if not isinstance(product,dict) or product.get('unit')!=UNITS[kind]:
   raise ValueError('DWD native product units invalid')
  frames=product.get('frames')
  if not isinstance(frames,list) or len(frames)!=9:
   raise ValueError('DWD native original nine hours missing')
  hours=set()
  for frame in frames:
   if not isinstance(frame,dict) or frame.get('hour') not in LEADS or frame['hour'] in hours:
    raise ValueError('Duplicated or unknown DWD native forecast lead')
   h=frame['hour'];hours.add(h)
   name=f'{kind}-{h:03d}.bin';file=source/name
   if(frame.get('file')!=name or frame.get('encoding')!='gzip-json'
       or frame.get('intervalHours')!=(1 if kind=='precipitation' else 0)
       or not isinstance(frame.get('sha256'),str) or not DIGEST.fullmatch(frame['sha256'])
       or not isinstance(frame.get('bytes'),int) or not 1<=frame['bytes']<=12_000_000
       or not isinstance(frame.get('decodedBytes'),int) or not 1<=frame['decodedBytes']<=12_000_000
       or not file.is_file() or file.stat().st_size!=frame['bytes'] or sha(file)!=frame['sha256']):
    raise ValueError('Native DWD field missing, untrusted or not SHA-bound')
   # Check payload bytes, not just the index: a manifest must not promote a pilot.
   if not file.resolve(strict=True).is_relative_to(source.resolve(strict=True)):
    raise ValueError('Native D2 input escapes immutable candidate directory')
   with gzip.open(file,'rb') as zipped:
    actual=zipped.read(frame['decodedBytes']+1)
   if len(actual)!=frame['decodedBytes']:raise ValueError('Original DWD decoded bytes exceed verified budget')
   field=json.loads(actual)
   expected=(run_time+timedelta(hours=h)).timestamp()
   field_time=datetime.fromisoformat(field.get('time',''))
   if(field.get('schema')!='mid.icon-d2.native-field.v2'
      or field.get('productionApproved') is not True
      or field.get('sourceInventorySha256')!=index['sourceInventorySha256']
      or field.get('nativePoints')!=542040 or field.get('modelId')!='icon-d2'
      or field.get('sampling')!='nearest-native-cell'
      or field.get('run')!=index['run'] or field.get('kind')!=kind
      or field.get('unit')!=UNITS[kind] or field.get('leadHours')!=h
      or field.get('scale')!=.1 or field_time.tzinfo is None
      or abs(field_time.timestamp()-expected)>1
      or not isinstance(field.get('values'),list)
      or not isinstance(field.get('isobars'),list)
      or not isinstance(field.get('centers'),list)):
    raise ValueError('Original DWD 72-field model/source provenance mismatch')
   if kind=='pressure' and not field['isobars']:
    raise ValueError('Native full-domain pressure isolines missing from released field')
   size+=frame['bytes'];entries.append((file,name))
  if hours!=set(LEADS):raise ValueError('Incomplete native DWD forecast axis')
 if size>=350_000_000:raise ValueError('Original D2 map candidate exceeds standalone 350MB budget')
 if(size+sum(obj['bytes'] for obj in existing_objects)+1_000_000>=budget):
  raise ValueError('Complete native D2 map conflicts with 900MB RUC/Pages budget')
 index_hash=sha(index_file);prefix=f'runs/{run_slug}__fields_native_{index_hash[:16]}/model-fields-native/'
 output=[]
 for file,name in entries:
  key=prefix+name;destination=out/key
  if destination.exists():raise ValueError('Immutable DWD native target collision')
  destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,destination)
  output.append({'key':key,'bytes':destination.stat().st_size,'sha256':sha(destination)})
 existing_objects.extend(output)
 return {'key':prefix+'index.json','schema':index['schema'],'run':index['run'],
         'sourceInventorySha256':index['sourceInventorySha256'],'productionApproved':True,
         'nativePoints':542040,'frameCount':72,'bytes':size}

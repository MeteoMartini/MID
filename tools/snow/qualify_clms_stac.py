#!/usr/bin/env python3
"""Read-only CLMS FSC/GFSC *real* Alpine product discovery via public CDSE STAC.

Only original STAC catalogue metadata is admitted, NOT original GeoTIFF pixels.
Never opens provider Product/S3/download assets, no credentials or state writes.
A successful catalogue lookup NEVER sets productionApproved or QAFLAGS decoded.
"""
from __future__ import annotations
import argparse,datetime as dt,hashlib,json,re,urllib.parse,urllib.request
from typing import Any

HOST='stac.opensearch.dataspace.copernicus.eu'
COLLECTIONS={
 'FSC':'clms_wsi_fractional-snow-cover_europe_utm_20m_daily_v2',
 'GFSC':'clms_wsi_gap-filled-fractional-snow-cover_europe_utm_60m_daily_v1',
}
BANDS={'FSC':('FSCOG','FSCOG-QA','FSCTOC','FSCTOC-QA','QAFLAGS','CLD'),
       'GFSC':('GF','GF-QA','QAFLAGS','AT')}
BBOX=(9.,45.,13.,48.)
LIMIT=25
MAX_RESPONSE=1_500_000
AGE=dt.timedelta(days=5)
def parse_utc(value:str)->dt.datetime:
 if not isinstance(value,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z',value):
  raise ValueError('CLMS source timestamp is not exact UTC')
 parsed=dt.datetime.fromisoformat(value.replace('Z','+00:00'))
 if parsed.utcoffset()!=dt.timedelta(0):raise ValueError('Non-UTC CLMS source time')
 return parsed
def overlap(box,area=BBOX)->bool:
 if not isinstance(box,list) or len(box)!=4 or any(type(v) not in (int,float) or not -180<=v<=180 for v in box):
  return False
 w,s,e,n=box;return w<e and s<n and e>area[0] and w<area[2] and n>area[1] and s<area[3]
def admit_item(item:dict,kind:str,at:dt.datetime)->dict:
 if kind not in COLLECTIONS or not isinstance(item,dict) or item.get('type')!='Feature':
  raise ValueError('Unknown original CLMS STAC entry')
 if item.get('collection')!=COLLECTIONS[kind] or not isinstance(item.get('id'),str):
  raise ValueError('Original CLMS collection/id mismatch')
 id=item['id']
 if (kind=='FSC' and not re.fullmatch(r'CLMS_WSI_FSC_020m_T\d{2}[A-Z]{3}_\d{8}T\d{6}_S2[A-Z]_V\d{3}',id)
     or kind=='GFSC' and not re.fullmatch(r'CLMS_WSI_GFSC_060m_T\d{2}[A-Z]{3}_\d{8}P7D_COMB_V\d{3}',id)):
  raise ValueError('Untrusted original CLMS product naming/version')
 if not overlap(item.get('bbox')):raise ValueError('CLMS product does not overlap requested Alpine area')
 p=item.get('properties') or {}
 time=parse_utc(p.get('datetime'))
 if time>at+dt.timedelta(minutes=5) or at-time>AGE:
  raise ValueError('Missing, future or stale original CLMS acquisition time')
 expected_date=time.strftime('%Y%m%d')
 # FSC identifies a single S2 acquisition to the second; GFSC is a seven-day
 # composite identified by its UTC product day, not an instantaneous pixel.
 if kind=='FSC':
  if time.strftime('%Y%m%dT%H%M%S') not in id:
   raise ValueError('Original FSC acquisition UTC timestamp differs from product identity')
 elif expected_date not in id:
  raise ValueError('Original GFSC UTC product day differs from product identity')
 assets=item.get('assets') or {}
 if not all(a in assets for a in BANDS[kind]):raise ValueError('Original CLMS quality/cloud or pixel age assets missing')
 prefix='s3://eodata/CLMS/bio-geophysical/snow_cover_extent/'+COLLECTIONS[kind]+'/'
 # A matching collection and band suffix alone is insufficient: that permits
 # splicing QAFLAGS, cloud or pixel-age rasters from a different product/tile.
 # Require the exact same immutable product/date directory for EVERY band.
 product_prefix=prefix+time.strftime('%Y/%m/%d/')+id+'/'+id+'_'
 for band in BANDS[kind]:
  asset=assets[band]
  href=asset.get('href') if isinstance(asset,dict) else None
  if not isinstance(href,str) or href!=product_prefix+band+'.tif':
   raise ValueError('Original CLMS band is not bound to this product, day and tile')
 if 'Product' in assets:
  href=assets['Product'].get('href') if isinstance(assets['Product'],dict) else None
  if not isinstance(href,str) or not href.startswith('https://zipper.dataspace.copernicus.eu/odata/v1/Products('):
   raise ValueError('Original CLMS archive identity invalid')
 if kind=='FSC':
  fraction='FSCOG';qa='FSCOG-QA';resolution=20;window=None
 else:
  fraction='GF';qa='GF-QA';resolution=60;window=7
 return {
  'schema':'mid.clms.alpine-stac-discovery.v1','productionApproved':False,
  'source':'Copernicus Data Space Ecosystem STAC / Copernicus Land Monitoring Service',
  'collectionId':COLLECTIONS[kind],'productId':id,'kind':kind,
  'datetimeUtc':p['datetime'],'bbox':item['bbox'],'resolutionM':resolution,
  'compositeWindowDays':window,'cloudPercent':p.get('eo:cloud_cover'),
  'requiredBands':list(BANDS[kind]),'fractionBand':fraction,'qualityBand':qa,
  'hasAcquisitionTimeRaster':kind=='GFSC',
  'pixelDataVerified':False,'qaFlagsDecoded':False,'actualMaskBytesVerified':False,
  'sourceAssetsSha256':None,'observationVsSnowDepth':'fractional-snow-cover-only'
 }
def parse_collection(raw:bytes,kind:str,at:dt.datetime)->dict:
 if not isinstance(raw,bytes) or not raw or len(raw)>MAX_RESPONSE:
  raise ValueError('Invalid public CLMS STAC JSON byte budget')
 doc=json.loads(raw)
 if doc.get('type')!='FeatureCollection' or not isinstance(doc.get('features'),list):
  raise ValueError('Invalid CLMS product collection')
 if len(doc['features'])>LIMIT:raise ValueError('Unbounded STAC search response')
 parsed=[admit_item(row,kind,at) for row in doc['features']]
 if not parsed:raise ValueError('No current original FSC/GFSC Alpine product metadata')
 ids=[row['productId'] for row in parsed]
 if len(ids)!=len(set(ids)):raise ValueError('Duplicate original CLMS product identity')
 matched=doc.get('numberMatched')
 if type(matched) is not int or matched<len(parsed):raise ValueError('Untrusted STAC product result count')
 return {'schema':'mid.clms.alpine-stac-search.v1','productionApproved':False,
         'kind':kind,'catalogueHost':HOST,'matchedOriginalProducts':matched,
         'returnedProducts':len(parsed),'partialCoverage':matched>len(parsed),
         'rawCatalogueResponseSha256':hashlib.sha256(raw).hexdigest(),
         'items':parsed,'pixelDataVerified':False,'qaFlagsDecoded':False}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,msg,headers,newurl):
  raise ValueError('Unexpected redirection from official CLMS STAC host')
def fetch(kind:str,at:dt.datetime):
 if kind not in COLLECTIONS:raise ValueError('Untrusted CLMS collection')
 begin=(at-dt.timedelta(days=4)).strftime('%Y-%m-%dT00:00:00Z')
 end=at.strftime('%Y-%m-%dT%H:%M:%SZ')
 args=urllib.parse.urlencode({'bbox':','.join(str(v) for v in BBOX),
  'datetime':begin+'/'+end,'limit':str(LIMIT)})
 url='https://'+HOST+'/v1/collections/'+COLLECTIONS[kind]+'/items?'+args
 req=urllib.request.Request(url,headers={'Accept':'application/geo+json','User-Agent':'MID-read-only-CLMS-STAC-verification/1.0'})
 opener=urllib.request.build_opener(NoRedirect)
 with opener.open(req,timeout=18) as r:
  if r.status!=200:raise ValueError('CLMS STAC not available with status 200')
  raw=r.read(MAX_RESPONSE+1)
 return parse_collection(raw,kind,at)
if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--live',action='store_true',help='Public metadata only; no files or authentication')
 a=p.parse_args()
 if not a.live:raise SystemExit('Explicit --live required; unit tests use in-memory fixtures')
 now=dt.datetime.now(dt.timezone.utc)
 for kind in ('FSC','GFSC'):
  report=fetch(kind,now)
  # Do not print URLs or large asset manifests: compact metadata-only proof.
  print(json.dumps({k:v for k,v in report.items() if k!='items'},sort_keys=True))

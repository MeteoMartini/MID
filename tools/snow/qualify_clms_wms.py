#!/usr/bin/env python3
"""Read-only availability discovery for official Copernicus FSC/GFSC WMS.

Never fetch image/pixel data or promote a product to MID. WMS layers, TIME,
geographic coverage and real status must be evidenced before any integration.
No CDSE credentials, no dynamic URLs, no files, no unbounded requests.
"""
from __future__ import annotations
import argparse,json,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from urllib.parse import urlparse

OFFICIAL={'FSC':'https://cryo.land.copernicus.eu/wms/FSC/',
          'GFSC':'https://cryo.land.copernicus.eu/wms/GFSC/'}
MAX_BYTES=2_000_000
def local(tag):return str(tag).split('}',1)[-1]
def parse_capabilities(payload:bytes,product:str):
 if product not in OFFICIAL:raise ValueError('Non-official WMS provider')
 if not isinstance(payload,bytes) or not payload or len(payload)>MAX_BYTES or b'<!DOCTYPE' in payload.upper() or b'<!ENTITY' in payload.upper():
  raise ValueError('Untrusted WMS capabilities bytes')
 root=ET.fromstring(payload)
 if local(root.tag) not in ('WMS_Capabilities','WMT_MS_Capabilities'):
  raise ValueError('No WMS capabilities root')
 version=root.get('version','')
 if version not in ('1.3.0','1.1.1'):raise ValueError('Unsupported WMS protocol')
 service_errors=[x for x in root.iter() if local(x.tag) in ('ServiceException','ExceptionText')]
 if service_errors:raise ValueError('Copernicus WMS provider returned exception')
 layers=[]
 def walk(node,inherited=()):
  dims=list(inherited)
  for item in node:
   if local(item.tag) in ('Dimension','Extent') and (item.get('name') or '').lower()=='time' and item.text:
    dims=[v.strip() for v in item.text.split(',') if v.strip()]
  name=next((v.text.strip() for v in node if local(v.tag)=='Name' and v.text and v.text.strip()),None)
  if name:
   layers.append({'name':name,'hasTimeDimension':bool(dims),'timeDimensionSamples':dims[:2]})
  for sub in node:
   if local(sub.tag)=='Layer':walk(sub,tuple(dims))
 for node in root.iter():
  if local(node.tag)=='Capability':
   for child in node:
    if local(child.tag)=='Layer':walk(child)
 if len(layers)>6000:raise ValueError('Unbounded WMS layer catalogue')
 # Never mistake GFSC for FSC merely because the substring "FSC" occurs.
 related=[p for p in layers if p['name'].casefold()==product.casefold()
          or p['name'].casefold().startswith(product.casefold()+':')
          or p['name'].casefold().startswith(product.casefold()+'_')]
 return {'schema':'mid.copernicus.wms-discovery.v1','productionApproved':False,
   'product':product,'endpoint':OFFICIAL[product],
   'wmsVersion':version,'catalogueLayers':len(layers),
   'matchingLayerNames':[p['name'] for p in related[:40]],
   'relatedTimeLayerCount':sum(bool(p['hasTimeDimension']) for p in related),
   'fullOriginalCOGQualityVerified':False,'realRasterVerified':False}
def discover(product:str):
 if product not in OFFICIAL:raise ValueError('Unsupported provider')
 params=urllib.parse.urlencode({'SERVICE':'WMS','REQUEST':'GetCapabilities','VERSION':'1.3.0'})
 url=OFFICIAL[product]+'?'+params
 with urllib.request.urlopen(url,timeout=15) as response:
  final=urlparse(response.geturl())
  if final.scheme!='https' or final.netloc!='cryo.land.copernicus.eu':
   raise ValueError('Copernicus WMS redirects outside official host')
  if response.status!=200:raise ValueError('Official WMS capabilities unavailable')
  raw=response.read(MAX_BYTES+1)
 return parse_capabilities(raw,product)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--product',choices=tuple(OFFICIAL),required=True)
 args=p.parse_args()
 print(json.dumps(discover(args.product),sort_keys=True))

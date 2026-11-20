import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import worker from '../../worker/metar-proxy.js';

const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64');
const base=new URL('https://mid.invalid/');
for(const [k,v] of Object.entries({
 mode:'composite-wms',provider:'dwd',service:'WMS',request:'GetMap',version:'1.1.1',
 layers:'dwd:Radar_rv_product_1x1km_ger',styles:'',format:'image/png',
 transparent:'true',srs:'EPSG:3857',bbox:'700000,6500000,800000,6600000',
 width:'512',height:'256'
}))base.searchParams.set(k,v);

async function probe(edits={},extra=[]){
 const url=new URL(base);
 for(const [key,value] of Object.entries(edits)){
  if(value===null)url.searchParams.delete(key);
  else url.searchParams.set(key,String(value));
 }
 for(const [key,value] of extra)url.searchParams.append(key,value);
 const originalFetch=globalThis.fetch,upstream=[];
 globalThis.fetch=async input=>{
  const request=new URL(typeof input==='string'?input:input.url);
  upstream.push(request.toString());
  return new Response(tinyPng,{status:200,headers:{'content-type':'image/png'}});
 };
 try{
  const response=await worker.fetch(new Request(url),{});
  return {status:response.status,upstream,body:await response.text()};
 }finally{globalThis.fetch=originalFetch}
}

describe('MID-Karten 1.19: bounded composite GetMap proxy, zero external calls on invalid geometry',()=>{
 it('keeps the existing compact radar path and larger desktop UHD map compatible',async()=>{
  for(const geometry of [
   {width:'512',height:'256'},
   {width:'256',height:'256'},
   {width:'4096',height:'2048'},
   {width:'3840',height:'2160'},
  ]){
   const result=await probe(geometry);
   expect(result.status).toBe(200);
   expect(result.upstream.length).toBeGreaterThan(0);
   expect(result.upstream.every(u=>u.includes('request=GetMap'))).toBe(true);
  }
 });
 it('accepts OGC 1.3.0 CRS with finite coordinates without changing source-time semantics',async()=>{
  const result=await probe({version:'1.3.0',srs:null,crs:'EPSG:3857',bbox:'-1000000,5000000,1500000,8000000'});
  expect(result.status).toBe(200);
  expect(result.upstream.length).toBeGreaterThan(0);
 });
 it('rejects invalid width and height BEFORE any provider fetch',async()=>{
  for(const change of [
   {width:'0'},{height:'0'},{width:'-1'},{width:'NaN'},{width:'Infinity'},
   {width:'0x100'},{width:'1e3'},{height:'2.5'}, {width:''},{height:null},
   {width:'4097'}, {height:'4097'}, {width:'4096',height:'4096'}
  ]){
   const result=await probe(change);
   expect(result.status,JSON.stringify(change)).toBe(400);
   expect(result.upstream,JSON.stringify(change)).toHaveLength(0);
  }
 });
 it('rejects malformed, non-finite, inverted and enormous BBOX without a network request',async()=>{
  for(const bbox of [
   '', '1,2,3', '1,2,3,4,5', '0,0,0,1', '0,2,1,1',
   '0,NaN,1,2','0,Infinity,1,2','1,,2,3','a,b,c,d',
   '-999999999,0,1,10','1,2,3,1e309',
  ]){
   const result=await probe({bbox});
   expect(result.status,bbox).toBe(400);
   expect(result.upstream,bbox).toHaveLength(0);
  }
 });
 it('rejects case-folded duplicate query keys, preventing first-value validation and last-value forwarding',async()=>{
  for(const added of [['WIDTH','9000'],['height','8000'],['BBOX','0,0,999,999'],['LAYERS','dwd:other'],['Time','garbage'],['REQUEST','GetCapabilities'],['STYLES','unexpected'],['TRANSPARENT','false'],['FORMAT','image/jpeg']]){
   const result=await probe({},[added]);
   expect(result.status,added[0]).toBe(400);
   expect(result.upstream,added[0]).toHaveLength(0);
  }
 });
 it('rejects duplicate WMS dimension/style forwarding keys even if the original key was absent',async()=>{
  for(const [key,value] of [['dim_reference_time','2026-11-20T14:00Z'],['elevation','850'],['tiled','true'],['exceptions','application/vnd.ogc.se_xml'],['bgcolor','0xFFFFFF']]){
   const result=await probe({},[[key,value],[key.toUpperCase(),value]]);
   expect(result.status,key).toBe(400);
   expect(result.upstream,key).toHaveLength(0);
  }
 });
 it('does not permit non-GetMap operations or non-WMS services through the image proxy',async()=>{
  for(const changes of [{request:'GetCapabilities'},{request:'GetFeatureInfo'},{service:'WFS'},{version:'0.1.0'}]){
   const result=await probe(changes);
   expect(result.status).toBe(400);
   expect(result.upstream).toHaveLength(0);
  }
 });
 it('retains source worker parity and original DWD workspace fallback rules',()=>{
  const source=readFileSync('worker-src/20-composite-models.js','utf8');
  const canonical=readFileSync('worker.js','utf8');
  const mirror=readFileSync('worker/metar-proxy.js','utf8');
  expect(canonical).toBe(mirror);
  for(const token of [
   'function compositeWmsRequestGeometryError(url)',
   'width*height>8388608',
   'requestGeometryError=compositeWmsRequestGeometryError(url)',
   "if(requestGeometryError)return json({error:requestGeometryError",
   "String(value).split(',').map(layer=>dwdLayerForEndpoint(layer,base)).join(',')",
  ]){
   expect(source).toContain(token);
   expect(canonical).toContain(token);
  }
  const begin=canonical.indexOf('async function compositeWmsResponse(request)');
  expect(canonical.indexOf('requestGeometryError=compositeWmsRequestGeometryError(url)',begin))
   .toBeLessThan(canonical.indexOf('const attempt=async base=>',begin));
 });
});

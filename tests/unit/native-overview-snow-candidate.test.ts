import {describe,expect,it,vi} from 'vitest';
import type {NativeField,NativeIndex} from '../../src/nativeModelFields';
const evidence=vi.hoisted(()=>new WeakMap<object,string>());
vi.mock('../../src/nativeModelFields',async(importOriginal)=>{
 const actual=await importOriginal<typeof import('../../src/nativeModelFields')>();
 return {...actual,nativeVerifiedFrameIdentity:(field:object)=>evidence.get(field)};
});
import {nativeFrameIdentity} from '../../src/nativeModelFields';
import {nativeOverviewPlan,prepareNativeOverview,nativeOverviewCell,nativeOverviewRaster} from '../../src/nativeOverviewFrame';
import {dwdSnowIntervalSwe,geometricSnowDepthCm,type SnowSourceField} from '../../src/nativeSnowMapValues';
import {overviewEndpointWeather,nativeOverviewAt,overviewPressureFeatures,overviewPlaceFeatures,createNativeOverviewPresentation} from '../../src/nativeOverviewPresentation';
import {nativeOverviewSvg} from '../../src/nativeOverviewExport';
const run='2026-11-27T00:00:00Z',time='2026-11-27T01:00:00Z';
const specs=[['cloud','%',20],['precipitation','mm/1 h',0],['pressure','hPa',1010],['temperature','°C',-2],['sigwx','WMO',71]] as const;
function fixture(){
 const index:NativeIndex={schema:'mid.icon-d2.fields.v1',run,products:{}};
 const fields:NativeField[]=specs.map(([kind,unit,value],i)=>{
  const ref={hour:1,time,file:kind+'.json',sha256:String(i+1).repeat(64),bytes:100,intervalHours:kind==='precipitation'?1:0};
  index.products[kind]={unit,frames:[ref]};
  const field:NativeField={schema:'mid.icon-d2.field.v1',kind,unit,run,time,scale:.1,lats:[50,51],lons:[7,8],values:[value*10,value*10,NaN,value*10],isobars:[]};
  evidence.set(field,nativeFrameIdentity(index,ref,kind));return field;
 });
 return {index,fields};
}
describe('original overview core – candidate, no UI admission',()=>{
 it('requires all five exact original identities and preserves values and arrays',()=>{
  const {index,fields}=fixture(),frame=prepareNativeOverview(index,time,fields)!;
  expect(frame.cloud).toBe(fields[0]);expect(frame.precipitation.values).toBe(fields[1].values);
  expect(nativeOverviewCell(frame,0)).toMatchObject({cloud:20,precipitation:0,pressure:1010,temperature:-2,weatherCode:71,time,model:'icon-d2'});
  expect(nativeOverviewCell(frame,2)).toBeNull();expect(nativeOverviewCell(frame,-1)).toBeNull();
  expect(nativeOverviewCell(frame,4)).toBeNull();
 });
 it('renders exact mask, dry cloud and original rain intensity in one raster',()=>{
  const {index,fields}=fixture();
  fields[1].values[3]=100;
  const frame=prepareNativeOverview(index,time,fields)!;
  const pixels=new Uint8ClampedArray(16),put=vi.fn();
  const canvas={width:0,height:0,getContext:()=>({createImageData:()=>({data:pixels}),putImageData:put}),toDataURL:()=> 'data:image/png;base64,fixture'};
  vi.stubGlobal('document',{createElement:()=>canvas});
  try{
   expect(nativeOverviewRaster(frame)).toBe('data:image/png;base64,fixture');
   expect([canvas.width,canvas.height]).toEqual([2,2]);expect(put).toHaveBeenCalledTimes(1);
   expect(Array.from(pixels)).toEqual([0,0,0,0,20,90,145,215,142,142,142,34,142,142,142,34]);
   expect(nativeOverviewCell(frame,0)?.precipitation).toBe(0);
  }finally{vi.unstubAllGlobals()}
 });
 it('rejects stale/duplicate/missing refs, unsupported RUC and wrong interval',()=>{
  const {index,fields}=fixture();
  expect(nativeOverviewPlan({...index,schema:'mid.ruc.map-fields.v1',modelId:'icon-d2-ruc'},time)).toBeNull();
  expect(nativeOverviewPlan({...index,schema:'mid.icon-d2.native-fields.v2'},time)).toBeNull();
  expect(prepareNativeOverview(index,time,fields.slice(0,4))).toBeNull();
  const temp=index.products.temperature!;
  expect(nativeOverviewPlan({...index,products:{...index.products,temperature:{...temp,frames:[...temp.frames,...temp.frames]}}},time)).toBeNull();
  expect(nativeOverviewPlan(index,'2026-11-27T02:00:00Z')).toBeNull();
  index.products.precipitation!.frames[0].intervalHours=0;
  expect(nativeOverviewPlan(index,time)).toBeNull();
 });
 it('rejects an unverified clone, wrong grid and disjoint masks',()=>{
  const {index,fields}=fixture();
  expect(prepareNativeOverview(index,time,[...fields.slice(0,4),{...fields[4]}])).toBeNull();
  fields[4].lons=[7,9];expect(prepareNativeOverview(index,time,fields)).toBeNull();
  fields[4].lons=[7,8];fields[4].values=[NaN,NaN,71,NaN];
  expect(prepareNativeOverview(index,time,fields)).toBeNull();
 });
});
const end='2026-11-27T03:00:00Z';
function snow(model:SnowSourceField['model']='icon-d2'){
 const mk=(parameter:SnowSourceField['parameter'],t:string,hash:string,values:number[]):SnowSourceField=>({model,run,time:t,startTime:run,parameter,unit:'kg/m²',gridSha256:'a'.repeat(64),sourceSha256:hash.repeat(64),values:Float64Array.from(values)});
 return [mk('snow_gsp',time,'1',[2,0,NaN,10]),mk('snow_gsp',end,'2',[4,0,3,13]),mk('snow_con',time,'3',[1,0,0,1]),mk('snow_con',end,'4',[2,0,2,4])] as const;
}
describe('isolated original DWD snow arithmetic',()=>{
 it.each(['icon-d2','icon-eu','icon'] as const)('keeps interval SWE and true zero for %s',model=>{
  const f=snow(model),result=dwdSnowIntervalSwe(...f);
  expect(Array.from(result.values)).toEqual([3,0,NaN,6]);
  expect(result).toMatchObject({model,run,start:time,end,unit:'mm SWE'});
  expect(f[0].values[0]).toBe(2);
 });
 it('rejects reset even when another component grows or is missing',()=>{
  const f=snow();f[1].values[0]=1;f[3].values[0]=20;
  expect(()=>dwdSnowIntervalSwe(...f)).toThrow('negative Differenz');
  f[2].values[0]=NaN;expect(()=>dwdSnowIntervalSwe(...f)).toThrow('negative Differenz');
 });
 it('rejects different model/grid/units, invalid values and duplicate source identity',()=>{
  const f=snow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],model:'icon'},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],gridSha256:'b'.repeat(64)},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],unit:'m'},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],sourceSha256:f[0].sourceSha256},f[2],f[3])).toThrow();
  f[1].values[0]=Infinity;expect(()=>dwdSnowIntervalSwe(...f)).toThrow();
 });
 it('rejects invalid UTC and normalized calendar dates',()=>{
  const f=snow();
  for(const time of ['2026-02-30T01:00:00Z','2026-11-27T01:00:00','2026-11-27T01:00:00+01:00','2026-11-27T01:00:00.500Z']){
   expect(()=>dwdSnowIntervalSwe({...f[0],time},f[1],{...f[2],time},f[3])).toThrow();
  }
 });
 it('converts only geometric depth, preserving small values and missing',()=>{
  const f=snow()[0],depth:SnowSourceField={...f,parameter:'h_snow',unit:'m',startTime:f.time,values:Float64Array.from([0,.004,.12345,NaN])};
  const values=geometricSnowDepthCm(depth);
  expect(values[0]).toBe(0);expect(values[1]).toBeCloseTo(.4,12);
  expect(values[2]).toBeCloseTo(12.345,12);expect(Number.isNaN(values[3])).toBe(true);
  expect(()=>geometricSnowDepthCm(f)).toThrow();
 });
});

describe('Overview presentation preparation',()=>{
 it('keeps canonical WMO phase evidence distinct from the hourly amount',()=>{
  for(let code=0;code<=99;code++)expect(overviewEndpointWeather(code)?.code).toBe(code);
  for(const code of [20,29,93,94,95,97,98])expect(overviewEndpointWeather(code)?.phase).toBe('unbestimmt');
  expect(overviewEndpointWeather(56)?.label).toBe('Gefr. Sprühregen');
  expect(overviewEndpointWeather(76)?.label).toBe('Eisnadeln');
  expect(overviewEndpointWeather(77)?.label).toBe('Schneegriesel');
  expect(overviewEndpointWeather(78)?.label).toBe('Schneesterne');
  expect(overviewEndpointWeather(79)?.label).toBe('Eiskörner');
  expect(overviewEndpointWeather(96)?.phase).toBe('Graupel/Hagel');
  expect(overviewEndpointWeather(91)?.label).toBe('Regenschauer nach Gewitter');
  for(const code of [NaN,-1,100,71.5])expect(overviewEndpointWeather(code)).toBeNull();
 });
 it('samples the shared nearest cell, preserves zero and rejects missing and outside points',()=>{
  const {index,fields}=fixture(),frame=prepareNativeOverview(index,time,fields)!;
  expect(nativeOverviewAt(frame,50,7)).toMatchObject({precipitation:0,temperature:-2,endpointWeather:{label:'Schnee'}});
  expect(nativeOverviewAt(frame,51,7)).toBeNull();expect(nativeOverviewAt(frame,49.999,7)).toBeNull();
 });
 it('keeps exact original pressure segments with a complete common mask',()=>{
  const {index,fields}=fixture();
  fields[2].isobars=[{level:1010,paths:[[[50,7],[50,8]],[[50,7],[51,8]],[[51,7],[51,8]]]}];
  const result=overviewPressureFeatures(prepareNativeOverview(index,time,fields)!);
  expect(result.omittedSegments).toBe(2);expect(result.data.features).toHaveLength(1);
  expect(result.data.features[0].geometry.coordinates).toEqual([[7,50],[8,50]]);
  expect(fields[2].isobars[0].paths).toHaveLength(3);
 });
 it('deduplicates named locations on the same cell and keeps winter labels independent of quantity',()=>{
  const {index,fields}=fixture(),frame=prepareNativeOverview(index,time,fields)!;
  const places=[{name:'A',latitude:50,longitude:7},{name:'Duplicate',latitude:50.1,longitude:7.1},{name:'Missing',latitude:51,longitude:7},{name:'B',latitude:51,longitude:8}];
  const winter=overviewPlaceFeatures(frame,places,'winter-overview');
  expect(winter.features.map(f=>f.properties.name)).toEqual(['A','B']);
  expect(winter.features[0].properties.label).toContain('Schnee');
  expect(overviewPlaceFeatures(frame,places,'overview').features[0].properties.label).not.toContain('Schnee');
 });
});

describe('Overview shared temporal scene and export',()=>{
 it('reuses one raster across variants and preserves original pressure/labels in one frame',()=>{
  const {index,fields}=fixture();
  fields[2].isobars=[{level:1010,paths:[[[50,7],[50,8]]]}];
  const frame=prepareNativeOverview(index,time,fields)!;
  const pixels=new Uint8ClampedArray(16),put=vi.fn(),canvas={width:0,height:0,getContext:()=>({createImageData:()=>({data:pixels}),putImageData:put}),toDataURL:()=> 'data:image/png;base64,fixture'};
  vi.stubGlobal('document',{createElement:()=>canvas});
  try{
   const places=[{name:'A & Tal',latitude:50,longitude:7},{name:'Keine Daten',latitude:51,longitude:7}];
   const a=createNativeOverviewPresentation(frame,places,'overview'),b=createNativeOverviewPresentation(frame,places,'winter-overview');
   expect(put).toHaveBeenCalledTimes(1);expect(a.pressure).toBe(b.pressure);
   expect(a.mapFrame.raster?.resampling).toBe('nearest');expect(a.mapFrame.groups.map(g=>g.id)).toEqual(['isobars','temperature-and-weather']);
   expect(b.mapFrame.key).not.toBe(a.mapFrame.key);
   const svg=nativeOverviewSvg(b,places);
   expect(svg).toContain('Winter Overview');expect(svg).toContain('image-rendering:pixelated');
   expect(svg).toContain('A &amp; Tal');expect(svg).toContain('0 mm/1 h');expect(svg).toContain('WW 71 · Schnee');
   expect(svg).toContain('Keine gemeinsame Rasterabdeckung');expect(svg).toContain('keine Aussage über die Phase der gesamten Stunde');
   expect(svg).toContain('2026-11-27 00:00 UTC');expect(svg).toContain('2026-11-27 01:00 UTC');
   expect(svg).not.toContain('A & Tal');
   expect(()=>nativeOverviewSvg({...b,mapFrame:{...b.mapFrame,raster:undefined}},places)).toThrow('Raster fehlt');
  }finally{vi.unstubAllGlobals()}
 });
});

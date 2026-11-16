import {describe,expect,it} from 'vitest';
import {planSurroundingsViewportRaster,type SurroundingsGeoBounds} from '../../src/surroundingsViewportRaster';

const focus:SurroundingsGeoBounds={west:5.7,south:50.17,east:8.5,north:51.47};
const viewports=[
 {width:320,height:220},
 {width:390,height:220},
 {width:430,height:220},
 {width:768,height:276},
 {width:1024,height:285}
] as const;

describe('MID Karten #853: map-visible viewport raster footprint – QA-only',()=>{
 it.each(viewports)('covers all four real camera bounds with overscan at $width × $height',size=>{
  // The input represents actual map.getBounds(), not the fixed 2.8°×1.3° camera target.
  const plan=planSurroundingsViewportRaster(focus,size);
  expect(plan).toBeDefined();
  expect(plan!.bounds.west).toBeLessThan(focus.west);
  expect(plan!.bounds.east).toBeGreaterThan(focus.east);
  expect(plan!.bounds.south).toBeLessThan(focus.south);
  expect(plan!.bounds.north).toBeGreaterThan(focus.north);
  expect(plan!.bbox).toBe([
   plan!.bounds.west,plan!.bounds.south,plan!.bounds.east,plan!.bounds.north
  ].join(','));
  expect(plan!.width).toBeLessThanOrEqual(512);
  expect(plan!.height).toBeLessThanOrEqual(256);
  expect(plan!.width*plan!.height).toBeLessThanOrEqual(512*256);
  // WMS 1.1.1 image pixel shape corresponds to degree BBOX, not CSS/WebMercator.
  const degrees=(plan!.bounds.east-plan!.bounds.west)/(plan!.bounds.north-plan!.bounds.south);
  expect(Math.abs(plan!.width/plan!.height-degrees)/degrees).toBeLessThan(.01);
 });

 it('uses the newly visible MapLibre camera rectangle rather than recycling a stale one',()=>{
  const narrow=planSurroundingsViewportRaster(focus,{width:390,height:220});
  const widerCamera={...focus,west:4.2,east:10};
  const wide=planSurroundingsViewportRaster(widerCamera,{width:1024,height:285});
  expect(wide).toBeDefined();
  expect(narrow).toBeDefined();
  expect(wide!.bounds.west).toBeLessThan(narrow!.bounds.west);
  expect(wide!.bounds.east).toBeGreaterThan(narrow!.bounds.east);
  expect(wide!.bbox).not.toBe(narrow!.bbox);
 });

 it('retains precise finite georeferencing at equator, central Europe, and 65° latitude',()=>{
  for(const latitude of [0,50.82,65,-45]){
   const bounds={west:7,south:latitude-.65,east:9,north:latitude+.65};
   const plan=planSurroundingsViewportRaster(bounds,{width:1024,height:285});
   expect(plan).toBeDefined();
   expect(plan!.bounds.north).toBeGreaterThan(bounds.north);
   expect(plan!.bounds.south).toBeLessThan(bounds.south);
   expect(plan!.bounds.east-plan!.bounds.west).toBeGreaterThan(bounds.east-bounds.west);
  }
 });

 it('never increases the existing WMS 512×256 pixel budget even on desktop',()=>{
  for(const width of [320,390,768,1024,1920,4096]){
   const plan=planSurroundingsViewportRaster(focus,{width,height:285});
   expect(plan).toBeDefined();
   expect(plan!.width*plan!.height).toBeLessThanOrEqual(131072);
  }
 });

 it('returns stable identity for same camera and rejects dimensions/overscan errors',()=>{
  const before=planSurroundingsViewportRaster(focus,{width:390,height:220});
  const same=planSurroundingsViewportRaster({...focus},{width:390,height:220});
  expect(same).toEqual(before);
  expect(planSurroundingsViewportRaster(focus,{width:390,height:220},0)).toBeDefined();
  for(const invalidSize of [{width:0,height:220},{width:390,height:0},
   {width:4097,height:220},{width:NaN,height:220},{width:390,height:Infinity}]){
   expect(planSurroundingsViewportRaster(focus,invalidSize)).toBeUndefined();
  }
  for(const invalidOverscan of [-1,33,Infinity,NaN])
   expect(planSurroundingsViewportRaster(focus,{width:390,height:220},invalidOverscan)).toBeUndefined();
 });

 it('fails closed on dateline seams, polar bounds, inverted and non-finite geography',()=>{
  const invalid:SurroundingsGeoBounds[]=[
   {west:179.5,south:50,east:179.99,north:51}, // overscan crosses +180
   {west:-179.99,south:50,east:-179.5,north:51}, // overscan crosses -180
   {west:170,south:40,east:-170,north:41}, // wrapped antimeridian
   {west:-180,south:-85,east:180,north:85}, // overscan reaches invalid coordinates
   {west:7,south:85,east:8,north:86},
   {west:7,south:-86,east:8,north:-85},
   {west:9,south:50,east:8,north:51},
   {west:7,south:51,east:8,north:50},
   {west:NaN,south:50,east:8,north:51}
  ];
  for(const bounds of invalid)
   expect(planSurroundingsViewportRaster(bounds,{width:390,height:220})).toBeUndefined();
 });

 it('is purely geometric: cannot manufacture weather fields, original times or NoData decisions',()=>{
  const plan=planSurroundingsViewportRaster(focus,{width:390,height:220});
  expect(plan).toBeDefined();
  expect(Object.keys(plan!).sort()).toEqual(['bbox','bounds','height','width']);
  expect((plan as unknown as Record<string,unknown>).source).toBeUndefined();
  expect((plan as unknown as Record<string,unknown>).time).toBeUndefined();
  expect((plan as unknown as Record<string,unknown>).weatherCode).toBeUndefined();
 });
});

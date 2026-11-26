import {describe,expect,it} from 'vitest';
import {planSurroundingsViewportRaster,mercatorLatitudeAtImageFraction} from '../../src/surroundingsViewportRaster';
import {planSurroundingsMercatorWmsRaster} from '../../src/surroundingsMercatorWmsRaster';

const R=6378137;
const rad=(value:number)=>value*Math.PI/180;
const x=(longitude:number)=>R*rad(longitude);
const y=(latitude:number)=>R*Math.log(Math.tan(Math.PI/4+rad(latitude)/2));
const focus={west:5.7,south:50.17,east:8.5,north:51.47};
const screenSizes=[
 {width:320,height:220},
 {width:390,height:220},
 {width:430,height:220},
 {width:768,height:276},
 {width:1024,height:285},
 {width:1440,height:410}
];

describe('MID-Karten 1.20: DWD RV native EPSG:3857 is georeferenced inside MapLibre Quad',()=>{
 it.each(screenSizes)('preserves the same post-fit corners with native Mercator WMS at $width px',size=>{
  const geographic=planSurroundingsViewportRaster(focus,size)!;
  const projected=planSurroundingsMercatorWmsRaster(geographic)!;
  expect(projected.srs).toBe('EPSG:3857');
  const [west,south,east,north]=projected.bbox.split(',').map(Number);
  expect(west).toBeLessThanOrEqual(x(geographic.bounds.west));
  expect(east).toBeGreaterThanOrEqual(x(geographic.bounds.east));
  expect(south).toBeLessThanOrEqual(y(geographic.bounds.south));
  expect(north).toBeGreaterThanOrEqual(y(geographic.bounds.north));
  expect(x(geographic.bounds.west)-west).toBeLessThan(.002);
  expect(east-x(geographic.bounds.east)).toBeLessThan(.002);
  expect(projected.width).toBeGreaterThanOrEqual(16);
  expect(projected.height).toBeGreaterThanOrEqual(16);
  expect(projected.width).toBeLessThanOrEqual(512);
  expect(projected.height).toBeLessThanOrEqual(256);
  expect(projected.width*projected.height).toBeLessThanOrEqual(131072);
  const metresAspect=(east-west)/(north-south);
  expect(Math.abs(projected.width/projected.height-metresAspect)/metresAspect).toBeLessThan(.01);
 });
 it('projects the same image-inner latitude as MapLibre at 10%, 25%, 50%, 75%, 90%',()=>{
  const geographic=planSurroundingsViewportRaster(focus,{width:390,height:220})!;
  const projected=planSurroundingsMercatorWmsRaster(geographic)!;
  const [west,south,east,north]=projected.bbox.split(',').map(Number);
  const unproject=(my:number)=>180/Math.PI*(2*Math.atan(Math.exp(my/R))-Math.PI/2);
  for(const f of [.1,.25,.5,.75,.9]){
   const geoLat=mercatorLatitudeAtImageFraction(geographic.bounds.north,geographic.bounds.south,f);
   const sourceLat=unproject(north+(south-north)*f);
   expect(Math.abs(geoLat-sourceLat)).toBeLessThan(1e-7);
  }
  expect(east).toBeGreaterThan(west);
 });
 it('quantifies why EPSG:4326 cannot be stretched as WebMercator imagery at mid-latitudes',()=>{
  const geographic=planSurroundingsViewportRaster(focus,{width:390,height:220})!;
  const linearMid=(geographic.bounds.north+geographic.bounds.south)/2;
  const mercatorMid=mercatorLatitudeAtImageFraction(geographic.bounds.north,geographic.bounds.south,.5);
  expect(Math.abs(mercatorMid-linearMid)).toBeGreaterThan(.003);
  expect(Math.abs(mercatorMid-linearMid)).toBeLessThan(.01);
  expect(planSurroundingsMercatorWmsRaster(geographic)?.srs).toBe('EPSG:3857');
 });
 it('does not widen the 512x256 budget on tall or wide high-resolution displays',()=>{
  for(const latitude of [0,50.82,65,-45]){
   const area={west:7,south:latitude-.65,east:9,north:latitude+.65};
   for(const w of [320,390,768,1024,1920,4096]){
    const geo=planSurroundingsViewportRaster(area,{width:w,height:285})!;
    const projected=planSurroundingsMercatorWmsRaster(geo)!;
    expect(projected.width*projected.height).toBeLessThanOrEqual(131072);
   }
  }
 });
 it('refuses missing/invalid/polar/cross-dateline geometry rather than inventing a raster',()=>{
  expect(planSurroundingsMercatorWmsRaster(undefined)).toBeUndefined();
  const geo=planSurroundingsViewportRaster(focus,{width:390,height:220})!;
  for(const bounds of [
   {...geo.bounds,west:NaN},
   {...geo.bounds,east:181},
   {...geo.bounds,south:-90},
   {...geo.bounds,north:85.0511287798066},
   {...geo.bounds,north:geo.bounds.south},
   {...geo.bounds,west:geo.bounds.east},
  ])expect(planSurroundingsMercatorWmsRaster({...geo,bounds})).toBeUndefined();
  const result=planSurroundingsMercatorWmsRaster(geo)!;
  expect(Object.keys(result).sort()).toEqual(['bbox','height','srs','width']);
  expect((result as unknown as Record<string,unknown>).time).toBeUndefined();
  expect((result as unknown as Record<string,unknown>).sourceValidity).toBeUndefined();
 });
});

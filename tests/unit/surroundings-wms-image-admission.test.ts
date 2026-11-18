import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {admitSurroundingsWmsDecodedImage} from '../../src/surroundingsWmsImageAdmission';
import {planSurroundingsViewportRaster} from '../../src/surroundingsViewportRaster';

const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
const admitted=planSurroundingsViewportRaster(
 {west:5.7,south:50.17,east:8.5,north:51.47},
 {width:390,height:220}
)!;

describe('MID-Karten 1.17 #853: WMS decoded image is not source coverage',()=>{
 it('admits matching decoded WMS dimensions without weather observations',()=>{
  const result=admitSurroundingsWmsDecodedImage(admitted,admitted.width,admitted.height);
  expect(result).toEqual({
   kind:'decoded-wms-image',
   width:admitted.width,height:admitted.height,
   meteorologicalCoverage:null,precipitationRate:null,
   sourceValidity:'unverified'
  });
  expect(Object.keys(result!)).not.toContain('dryWeather');
  expect(Object.keys(result!)).not.toContain('covered');
  expect(result!.precipitationRate).not.toBe(0);
 });
 it('uses only decoded dimensions: all-transparent, opaque and partial images are NOT classified as weather',()=>{
  // No pixel buffer is passed into the policy. Valid echo/undetect/NoData
  // distinctions require independent source cells or coverage metadata.
  const evidence=admitSurroundingsWmsDecodedImage(admitted,admitted.width,admitted.height);
  for(const displayedAlpha of [0,1,127,254,255]){
   expect(displayedAlpha).toBeGreaterThanOrEqual(0);
   expect(evidence?.meteorologicalCoverage).toBeNull();
   expect(evidence?.sourceValidity).toBe('unverified');
  }
 });
 it('rejects missing/foreign, truncated, oversized and mismatched WMS images fail-closed',()=>{
  const invalid=[
   [0,admitted.height],[admitted.width,0],[admitted.width+1,admitted.height],
   [admitted.width,admitted.height+1],[1,1],[NaN,admitted.height],
   [Infinity,admitted.height],[admitted.width+.5,admitted.height],[-1,10]
  ];
  for(const [width,height] of invalid)
   expect(admitSurroundingsWmsDecodedImage(admitted,width,height)).toBeUndefined();
  expect(admitSurroundingsWmsDecodedImage(undefined,admitted.width,admitted.height)).toBeUndefined();
 });
 it('rejects pathological request plans and preserves original pixel budget',()=>{
  for(const plan of [
   {width:0,height:256},{width:513,height:256},{width:512,height:257},
   {width:512,height:256.5},{width:NaN,height:256},
   {width:0,height:0},{width:15,height:16},{width:16,height:15},
  ])expect(admitSurroundingsWmsDecodedImage(plan,plan.width,plan.height)).toBeUndefined();
  expect(admitSurroundingsWmsDecodedImage({width:512,height:256},512,256)?.kind)
   .toBe('decoded-wms-image');
 });
 it('wires dimension-only admission to the current request identity and retains decode errors',()=>{
  expect(ui).toContain('admitSurroundingsWmsDecodedImage(admittedRasterPlan,img.naturalWidth,img.naturalHeight)');
  expect(ui).toContain('radarOriginal?.time===target');
  expect(ui).toContain('img.onerror=()=>{if(active)setImageError(radar)}');
  expect(ui).toContain('return ()=>{active=false;img.onload=null;img.onerror=null}');
  expect(ui).toContain('WMS-Bild geladen, Quellabdeckung nicht bestätigt');
  expect(ui).not.toContain('willReadFrequently:true');
  expect(ui).not.toContain('context.getImageData(0,0,canvas.width,canvas.height)');
  expect(ui).not.toContain('getImageData(0,0,canvas.width,canvas.height).data.some');
  expect(ui).toContain('selectVerifiedSurroundingsRadarFrame(loaded,radar,radarOriginal)');
 });
});

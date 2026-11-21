import {describe,expect,it} from 'vitest';
import {hasFreshRadarObservation} from '../../src/CompositeTimeline';
import {rainViewerPastObservations} from '../../src/rainViewerFallbackLifecycle';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const source=readFileSync(root+'src/RadarPanel.tsx','utf8');

describe('Sölden and Alpine map observation source fallback',()=>{
 it('requires a recent observation, including at the exact age limit',()=>{
  const now=10_000;
  expect(hasFreshRadarObservation([{time:now-45*60}],now)).toBe(true);
  expect(hasFreshRadarObservation([{time:now-45*60-1}],now)).toBe(false);
  expect(hasFreshRadarObservation([{time:now+91}],now)).toBe(false);
  expect(hasFreshRadarObservation([{time:now,future:true}],now)).toBe(false);
  expect(hasFreshRadarObservation([],now)).toBe(false);
 });
 it('uses the local DWD product timeline and one freshness rule to select and fetch fallback sources',()=>{
  expect(source).toContain('dwdProductChecked&&Array.isArray(productTimes.dwdRadar)');
  expect(source).toContain('hasFreshRadarObservation(dwdTimeline,referenceSeconds)');
  expect(source).toContain("operaUsable=operaLocation===observationLocation&&operaStatus==='ready'&&hasFreshRadarObservation");
  expect(source).toContain('const fallbackNeeded=!dwdUsable&&!operaUsable');
 });
 it('keeps RainViewer frames distinct from DWD timestamps and renders verified fallback in the unified map',()=>{
  expect(source).toContain('[rainViewerFrames,setRainViewerFrames]=useState<RadarFrame[]>([])');
  expect(source).toContain('createRainViewerFallbackLifecycle({');
  expect(source).toContain('rainViewerPastObservations(data,Date.now()/1000)');
  expect(source).not.toContain('setRainViewerFrames([...(data.radar?.past??[])');
  expect(source).not.toContain("...(data.radar?.nowcast??[]).map(item=>({...item,future:true}))");
  const now=2_000_000;
  expect(rainViewerPastObservations({radar:{
   past:[{time:now-600,path:'/v2/radar/1'}],
   nowcast:[{time:now+600,path:'/v2/radar/2'}],
  }},now)).toEqual([{time:now-600,path:'/v2/radar/1'}]);
  expect(source).toContain('rainViewerUsable=Boolean(host&&hasFreshRadarObservation');
  expect(source).toContain("activeSource==='rainviewer'?'RainViewer Radar · Fallback':'Radar nicht verfügbar'");
  expect(source).toContain('const rainBlend=blendTimedFrames(rainViewerFrames,targetSeconds');
  expect(source).toContain("activeSource==='rainviewer'&&rainRenderBlend.map");
  expect(source).not.toContain("{!unified&&!rasterZooming&&showRadar&&!highResolution&&activeSource==='rainviewer'");
  expect(source).not.toContain("if(unified||!fallbackNeeded");
 });
 it('prioritizes timestamped RGB and recovers from failed tiles during day or night',()=>{
  expect(source.indexOf('productTimes.satelliteRgbProduct,')).toBeLessThan(source.indexOf('productTimes.satelliteIrProduct||legacyIr,'));
  expect(source).toContain("productTimes.dwdReferenceSatelliteProduct?.provider==='dwd'");
  expect(source).toContain('normalisedIsoTimes(product.times,referenceMs).length>0');
  expect(source).toContain('if(failures>=2)setSatelliteFailures');
  expect(source).toContain('satelliteFailures[`${product.provider}:${product.layer}`]');
  expect(source).toContain("satelliteProvider==='dwd'?'Satellit &copy; DWD':'Satellit &copy; EUMETSAT'");
 });
});

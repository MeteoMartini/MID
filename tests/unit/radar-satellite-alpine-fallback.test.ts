import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const source=readFileSync(root+'src/RadarPanel.tsx','utf8');

describe('Sölden and Alpine map observation source fallback',()=>{
 it('never treats a verified empty DWD radar product timeline as local coverage',()=>{
  expect(source).toContain('productTimes.checkedAt&&productTimes.dwdRadar?.length===0?[]');
  expect(source).toContain('dwdUnavailable=dwdTemporarilyBlocked||!dwdTimeline.length');
 });
 it('does not advertise archived OPERA frames as a currently usable radar',()=>{
  expect(source).toContain("operaUsable=operaStatus==='ready'&&operaTimeline.some");
  expect(source).toContain("frame.time>=referenceSeconds-45*60");
  expect(source).toContain("const freshOpera=operaStatus==='ready'&&operaFrames.some");
  expect(source).toContain("stamp>=Date.now()-90*60000");
  expect(source).toContain("rainViewerUsable=Boolean(host&&rainViewerFrames.length)");
 });
 it('keeps RainViewer frames distinct from DWD timestamps and renders verified fallback in the unified map',()=>{
  expect(source).toContain('[rainViewerFrames,setRainViewerFrames]=useState<RadarFrame[]>([])');
  expect(source).toContain('setRainViewerFrames([...(data.radar?.past??[])');
  expect(source).toContain('rainViewerUsable=Boolean(host&&rainViewerFrames.some');
  expect(source).toContain("activeSource==='rainviewer'?'RainViewer Radar · Fallback':'Radar nicht verfügbar'");
  expect(source).toContain('const rainBlend=blendTimedFrames(rainViewerFrames,targetSeconds');
  expect(source).toContain("activeSource==='rainviewer'&&rainRenderBlend.map");
  expect(source).not.toContain("{!unified&&!rasterZooming&&showRadar&&!highResolution&&activeSource==='rainviewer'");
  expect(source).not.toContain("if(unified||!fallbackNeeded");
 });
 it('falls back from unavailable daytime VIS to sourced IR without inventing a satellite timestamp',()=>{
  expect(source).toContain("const candidateSatellite:CompositeProduct|undefined=(isDay&&!satelliteFallback&&");
  expect(source).toContain("(productTimes.satelliteIrProduct||legacyIr)");
  expect(source).toContain("setSatelliteTileError(message);if(isDay&&!satelliteFallback&&");
  expect(source).toContain('setSatelliteFallback(true)');
  expect(source).toContain("satelliteProvider==='dwd'?'Satellit &copy; DWD':'Satellit &copy; EUMETSAT'");
 });
});

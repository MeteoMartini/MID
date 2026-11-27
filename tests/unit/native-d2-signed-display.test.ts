import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {nativeFrameEvidence,nativePressureFrameRef,nativePresentationPressure} from '../../src/nativeMapFrameEvidence';
import {nativeFieldSvg} from '../../src/nativeModelMapExport';
import type {NativeField,NativeIndex,NativeFrameRef} from '../../src/nativeModelFields';

const root=fileURLToPath(new URL('../../',import.meta.url));
const legacy=readFileSync(root+'src/NativeModelMap.tsx','utf8');
const unified=readFileSync(root+'src/UnifiedWeatherMap.tsx','utf8');
const index=readFileSync(root+'src/nativeD2FullDomain.ts','utf8');
const run='2026-11-26T00:00:00Z',time='2026-11-26T03:00:00Z';
const ref:NativeFrameRef={hour:3,time,file:'gust-003.json',sha256:'a'.repeat(64),bytes:100,intervalHours:0};
const field:NativeField={schema:'mid.icon-d2.native-field.v2',modelId:'icon-d2',kind:'gust',run,time,unit:'km/h',scale:.1,lats:[44,52,58],lons:[-1,9,21],values:[0,1,2,3,4,5,6,7,8],isobars:[]};
const approved:NativeIndex={schema:'mid.icon-d2.native-fields.v2',modelId:'icon-d2',productionApproved:true,run,products:{pressure:{unit:'hPa',frames:[{...ref,file:'pressure-003.json',sha256:'b'.repeat(64)}]}}};

describe('signed original ICON-D2 full-area display with existing native clients',()=>{
 it('retains field-derived map bounds and image quad instead of Germany cutout',()=>{
  expect(legacy).toContain('MapFitBounds south={field.lats[0]} west={field.lons[0]}');
  expect(legacy).toContain('nativeFrameEvidence(catalog.index,next,ref)');
  expect(legacy).toContain('bounds:evidence.bounds');
  expect(nativeFrameEvidence(approved,field,ref)?.bounds).toEqual([[44,-1],[58,21]]);
  expect(nativeFrameEvidence(approved,field,{...ref,time:'2026-11-26T06:00:00Z'})).toBeNull();
  expect(nativeFrameEvidence(approved,{...field,lats:[58,44]},ref)).toBeNull();
  expect(unified).toContain('field?[[field.lats[0],field.lons[0]],[field.lats.at(-1)!,field.lons.at(-1)!]]');
  expect(index).toContain('D2_FULL_DOMAIN_SOURCE_CELLS=542040');
 });
 it('never mislabels unapproved regular remap as 542040-cell native release',()=>{
  expect(legacy).toContain('nativeD2Full:evidence.nativeD2Full');
  expect(nativeFrameEvidence(approved,field,ref)?.nativeD2Full).toBe(true);
  expect(nativeFrameEvidence({...approved,productionApproved:false},field,ref)?.nativeD2Full).toBe(false);
  expect(nativeFrameEvidence(approved,{...field,schema:'mid.icon-d2.field.v1'},ref)?.nativeD2Full).toBe(false);
  expect(nativeFrameEvidence({...approved,schema:'mid.icon-d2.fields.v1'},field,ref)?.nativeD2Full).toBe(false);
  expect(nativeFrameEvidence(approved,{...field,modelId:'icon-d2-ruc'},ref)).toBeNull();
  expect(legacy).toContain('kryptografisch freigegebenes natives Vollgebiet');
  expect(legacy).toContain('DWD-Regular-Raster (Anbieter-Remapping), kein natives Vollgebiet');
 });
 it('does not fabricate gust accumulation duration for original v2 instant statistics',()=>{
  expect(legacy).toContain('Number.isFinite(shown?.intervalHours??NaN)');
  expect(legacy).toContain('intervalHours:evidence.intervalHours');
  expect(nativeFrameEvidence(approved,field,ref)?.intervalHours).toBeNull();
  expect(nativeFrameEvidence(approved,field,{...ref,intervalHours:NaN})?.intervalHours).toBeNull();
  expect(nativeFrameEvidence(approved,field,{...ref,intervalHours:4})?.intervalHours).toBeNull();
  expect(nativeFrameEvidence(approved,field,{...ref,intervalHours:3})?.intervalHours).toBe(3);
  const svg=nativeFieldSvg(field,'Böe','data:image/png;base64,AA==',[],NaN);
  expect(svg).toContain('Bezugsintervall nicht ausgewiesen');expect(svg).not.toContain('NaN-h');
  expect(nativeFieldSvg(field,'Böe','data:image/png;base64,AA==',[],3)).toContain('3-h-Modellintervall');
  expect(legacy).toContain('Bezugsintervall ist aus dem veröffentlichten Originalfeld nicht ausgewiesen');
  expect(legacy).toContain('fehlende Zellen bleiben transparent');
 });
 it('admits only same-model, same-run, same-term hPa pressure fallback and preserves embedded contours',()=>{
  const pressure:NativeField={...field,kind:'pressure',unit:'hPa',isobars:[{level:1015,paths:[[[48,7],[49,8]]]}]};
  const theta:NativeField={...field,kind:'thetae',unit:'°C'};
  for(const kind of ['thetae','precipitation'] as const){const candidate={...theta,kind};expect(nativePressureFrameRef(approved,candidate,false)?.sha256).toBe('b'.repeat(64));expect(nativePresentationPressure(candidate,pressure)).toBe(pressure);expect(nativePresentationPressure(candidate,{...pressure,time:'2026-11-26T06:00:00Z'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,run:'2026-11-25T18:00:00Z'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,modelId:'icon-d2-ruc'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,unit:'Pa'})).toBeNull();const embedded={...candidate,isobars:pressure.isobars};expect(nativePressureFrameRef(approved,embedded,false)).toBeUndefined();expect(nativePresentationPressure(embedded,pressure)).toBe(embedded)}
  const sigwx:NativeField={...field,kind:'sigwx',unit:'code'};expect(nativePressureFrameRef(approved,sigwx,false)).toBeUndefined();expect(nativePressureFrameRef(approved,sigwx,true)).toBeDefined();expect(nativePresentationPressure(sigwx,pressure)).toBe(pressure);
  expect(legacy).toContain('nativePressureFrameRef(catalog.index,next,cloudIsobars)');expect(legacy).toContain('nativePresentationPressure(next,pressureKey&&pressureDone===pressureKey?pressureField:null)');expect(legacy).toContain('isobars:pressureContours?.isobars??[]');
 });
});

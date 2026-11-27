import {describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {nativeFrameEvidence,nativeDisplayedFrameEvidence,nativePressureFrameRef,nativePresentationPressure} from '../../src/nativeMapFrameEvidence';
import {nativeFieldSvg} from '../../src/nativeModelMapExport';
import {loadNativeField,type NativeField,type NativeIndex,type NativeFrameRef,type NativeFieldKind} from '../../src/nativeModelFields';
import {D2_FULL_DOMAIN_KINDS,D2_FULL_DOMAIN_LEADS,validateD2FullDomainIndex,validateD2FullDomainField} from '../../src/nativeD2FullDomain';
import {fetchVerifiedMapFrameBytes} from '../../src/verifiedMapFrameCache';
vi.mock('../../src/verifiedMapFrameCache',()=>({fetchVerifiedMapFrameBytes:vi.fn()}));

const root=fileURLToPath(new URL('../../',import.meta.url));
const legacy=readFileSync(root+'src/NativeModelMap.tsx','utf8');
const unified=readFileSync(root+'src/UnifiedWeatherMap.tsx','utf8');
const index=readFileSync(root+'src/nativeD2FullDomain.ts','utf8');
const run='2026-11-26T00:00:00Z',time='2026-11-26T03:00:00.000Z';
// Synthetic complete catalogue: exercises the production structural validator, not a real publisher signature.
const units:Record<NativeFieldKind,string>={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'};
const products=Object.fromEntries(D2_FULL_DOMAIN_KINDS.map((kind,k)=>[kind,{unit:units[kind],frames:D2_FULL_DOMAIN_LEADS.map((hour,i)=>({hour,time:new Date(Date.parse(run)+hour*3600000).toISOString(),file:kind+'-'+String(hour).padStart(3,'0')+'.bin',sha256:(k*9+i+1).toString(16).padStart(64,'0'),bytes:100,decodedBytes:1000,encoding:'gzip-json',intervalHours:kind==='precipitation'?1:0}))}]));
const approved=validateD2FullDomainIndex({schema:'mid.icon-d2.native-fields.v2',modelId:'icon-d2',productionApproved:true,sourceInventorySha256:'d'.repeat(64),nativePoints:542040,sampling:'nearest-native-cell',run,products},Date.parse(run)+6*3600000);
const ref=approved.products.gust!.frames.find(f=>f.hour===3)!;
const field:NativeField={schema:'mid.icon-d2.native-field.v2',modelId:'icon-d2',kind:'gust',run,time,unit:'km/h',scale:.1,lats:[44,52,58],lons:[-1,9,21],values:[0,1,2,3,4,5,6,7,8],isobars:[]};
async function verifiedFixture(raw:NativeField,kind:NativeFieldKind,hour:number,intervalHours:number){
 const bytes=new TextEncoder().encode(JSON.stringify(raw)).buffer as ArrayBuffer;
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const frame:NativeFrameRef={hour,time:raw.time,file:kind+'-'+String(hour).padStart(3,'0')+'.json',sha256,bytes:bytes.byteLength,intervalHours};
 return {frame,bytes};
}

describe('signed original ICON-D2 full-area display with existing native clients',()=>{
 it('retains field-derived map bounds and image quad instead of Germany cutout',()=>{
  expect(legacy).toContain('MapFitBounds south={field.lats[0]} west={field.lons[0]}');
  expect(legacy).toContain('nativeFrameEvidence(catalog.index,next,ref)');
  expect(legacy).toContain('bounds:evidence.bounds');
  expect(nativeFrameEvidence(approved,field,ref)?.bounds).toEqual([[44,-1],[58,21]]);
  expect(nativeFrameEvidence(approved,field,{...ref,time:'2026-11-26T06:00:00Z'})).toBeNull();
  expect(nativeFrameEvidence(approved,{...field,lats:[58,44]},ref)).toBeNull();
  expect(unified).toContain('nativeDisplayedFrameEvidence(catalog.index,field)');
  expect(unified).toContain('displayedNativeEvidence?.bounds??null');
  expect(unified).toContain('isTotals?Boolean(frame):Boolean(displayedNativeEvidence)');
  expect(index).toContain('D2_FULL_DOMAIN_SOURCE_CELLS=542040');
 });
 it('never mislabels unapproved regular remap as 542040-cell native release',()=>{
  expect(legacy).toContain('nativeD2Full:evidence.nativeD2Full');
  const lats=Array.from({length:401},(_,i)=>46+i*.025),lons=Array.from({length:441},(_,i)=>5+i*.025);
  const validated=validateD2FullDomainField({...field,productionApproved:true,sampling:'nearest-native-cell',sourceInventorySha256:approved.sourceInventorySha256,nativePoints:542040,leadHours:3,lats,lons,values:Array(lats.length*lons.length).fill(10),centers:[],negativePackingUncertainNoDataCells:0},approved,ref,'gust');
  expect(nativeFrameEvidence(approved,validated,ref)?.nativeD2Full).toBe(true);
  expect(()=>validateD2FullDomainIndex({...approved,products:{pressure:approved.products.pressure}},Date.parse(run)+6*3600000)).toThrow(/matrix incomplete/);
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
 it('binds the active common map and export to actually SHA-verified bytes, not a refreshed catalogue or selected successor',async()=>{
  const wire:NativeField={...field,schema:'mid.icon-d2.field.v1',modelId:undefined,lats:[44,52,60],lons:[-1,9,19]};
  const first=await verifiedFixture(wire,'gust',3,0);
  const successor={...wire,time:'2026-11-26T06:00:00.000Z'};
  const later=await verifiedFixture(successor,'gust',6,3);
  const listed:NativeIndex={schema:'mid.icon-d2.fields.v1',run,products:{gust:{unit:'km/h',frames:[first.frame,later.frame]}}};
  vi.mocked(fetchVerifiedMapFrameBytes).mockResolvedValueOnce(first.bytes);
  const shown=await loadNativeField(listed,'/ruc/',first.frame,'gust',new AbortController().signal);
  expect(nativeDisplayedFrameEvidence(listed,shown)?.bounds).toEqual([[44,-1],[60,19]]);
  expect(nativeDisplayedFrameEvidence(listed,shown)?.intervalHours).toBeNull();
  expect(nativeDisplayedFrameEvidence({...listed,products:{gust:{unit:'km/h',frames:[{...first.frame},later.frame]}}},shown)?.nativeD2Full).toBe(false);
  for(const changed of [{...first.frame,sha256:'e'.repeat(64)},{...first.frame,bytes:first.frame.bytes+1},{...first.frame,intervalHours:1}])
   expect(nativeDisplayedFrameEvidence({...listed,products:{gust:{unit:'km/h',frames:[changed,later.frame]}}},shown)).toBeNull();
  expect(nativeDisplayedFrameEvidence({...listed,run:'2026-11-25T18:00:00Z'},shown)).toBeNull();
  expect(nativeDisplayedFrameEvidence({...listed,modelId:'icon-d2-ruc'},shown)).toBeNull();
  expect(nativeDisplayedFrameEvidence({...listed,products:{gust:{unit:'km/h',frames:[later.frame]}}},shown)).toBeNull();
  expect(nativeDisplayedFrameEvidence(listed,{...shown,kind:'temperature'})).toBeNull();
  expect(nativeDisplayedFrameEvidence(listed,{...shown})).toBeNull(); // unverified copy
  vi.mocked(fetchVerifiedMapFrameBytes).mockResolvedValueOnce(later.bytes);
  const next=await loadNativeField(listed,'/ruc/',later.frame,'gust',new AbortController().signal);
  expect(nativeDisplayedFrameEvidence(listed,next)?.intervalHours).toBe(3);
  vi.mocked(fetchVerifiedMapFrameBytes).mockResolvedValueOnce(first.bytes);
  await expect(loadNativeField(listed,'/ruc/',{...first.frame,sha256:'e'.repeat(64)},'gust',new AbortController().signal)).rejects.toThrow(/Prüfsumme/);
  const rucWire:NativeField={...wire,schema:'mid.ruc.map-field.v1',modelId:'icon-d2-ruc',sampling:'nearest-native-cell',scale:.01};
  const rucFixture=await verifiedFixture(rucWire,'gust',3,0);
  const rucIndex:NativeIndex={schema:'mid.ruc.map-fields.v1',modelId:'icon-d2-ruc',run,products:{gust:{unit:'km/h',frames:[rucFixture.frame]}}};
  vi.mocked(fetchVerifiedMapFrameBytes).mockResolvedValueOnce(rucFixture.bytes);
  const ruc=await loadNativeField(rucIndex,'/ruc/',rucFixture.frame,'gust',new AbortController().signal);
  expect(nativeDisplayedFrameEvidence(rucIndex,ruc)?.nativeD2Full).toBe(false);
  expect(unified).toContain('else if(field&&displayedNativeEvidence)');
  expect(unified).toContain('displayedNativeEvidence.intervalHours??NaN');
  expect(unified).toContain('nativeFrameIdentity(catalog.index,ref,kind)');
 });
 it('admits only same-model, same-run, same-term hPa pressure fallback and preserves embedded contours',()=>{
  const pressure:NativeField={...field,kind:'pressure',unit:'hPa',isobars:[{level:1015,paths:[[[48,7],[49,8]]]}]};
  const theta:NativeField={...field,kind:'thetae',unit:'°C'};
  for(const kind of ['thetae','precipitation'] as const){const candidate={...theta,kind};expect(nativePressureFrameRef(approved,candidate,false)?.sha256).toBe(approved.products.pressure!.frames.find(f=>f.hour===3)!.sha256);expect(nativePresentationPressure(candidate,pressure)).toBe(pressure);expect(nativePresentationPressure(candidate,{...pressure,time:'2026-11-26T06:00:00Z'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,run:'2026-11-25T18:00:00Z'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,modelId:'icon-d2-ruc'})).toBeNull();expect(nativePresentationPressure(candidate,{...pressure,unit:'Pa'})).toBeNull();const embedded={...candidate,isobars:pressure.isobars};expect(nativePressureFrameRef(approved,embedded,false)).toBeUndefined();expect(nativePresentationPressure(embedded,pressure)).toBe(embedded)}
  const sigwx:NativeField={...field,kind:'sigwx',unit:'code'};expect(nativePressureFrameRef(approved,sigwx,false)).toBeUndefined();expect(nativePressureFrameRef(approved,sigwx,true)).toBeDefined();expect(nativePresentationPressure(sigwx,pressure)).toBe(pressure);
  expect(legacy).toContain('nativePressureFrameRef(catalog.index,next,cloudIsobars)');expect(legacy).toContain('nativePresentationPressure(next,pressureKey&&pressureDone===pressureKey?pressureField:null)');expect(legacy).toContain('isobars:pressureContours?.isobars??[]');
 });
});

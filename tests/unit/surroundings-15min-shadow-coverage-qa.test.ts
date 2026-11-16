import {describe,expect,it} from 'vitest';
import {inspectSurroundings15minShadowCoverage} from '../helpers/surroundings15minShadowCoverage';
const SHA='a'.repeat(64),RUN='2026-11-16T18:00:00Z';
function sample(){
 const times=Array.from({length:10},(_,i)=>({
  validTime:new Date(Date.parse(RUN)+900000*i).toISOString().replace('.000Z','Z'),
  IR:{file:'ir108-'+String(i).padStart(2,'0')+'.png',sha256:SHA,bytes:1024,encoding:'png-rgba8-north-up'},
  GSP:{file:'gsp-phase-'+String(i).padStart(2,'0')+'.bin',sha256:SHA,bytes:512,encoding:'zlib-uint8-phase-id-north-up'},
  validIrPixels:100,missingIrPixels:0
 }));
 return {preview:{schema:'mid.ir108-gsp.original-native-preview.shadow.v1',model:'DWD ICON-D2-RUC',
  run:RUN,isObservation:false,isOfficialWmoWeatherCode:false,activationAuthorized:false,
  productionApproved:false,nativeCellCount:542040,phaseNoDataId:255,phaseNoGspSignalId:0,
  sourceLookupSha256:SHA,sourceRucManifestSha256:SHA,originalManifestsSha256:{a:SHA,b:SHA},times},
  receipt:{schema:'mid.ir108-gsp.pair-readback.shadow-qa.v1',run:RUN,frames:10,assetPairs:10,
   validFrom:times[0].validTime,validTo:times[9].validTime,allAssetDigestsChecked:true,
   allPixelMasksChecked:true,activationAuthorized:false,releaseAuthorized:false}};
}
const inspect=(p:ReturnType<typeof sample>,at=RUN)=>inspectSurroundings15minShadowCoverage(p.preview,p.receipt,Date.parse(at));
describe('MID-Karten 1.13: 15min IR/GSP private shadow coverage, never SigWx release',()=>{
 it('maps all ten exact original candidates without inventing official WW or public delivery',()=>{
  const r=inspect(sample());expect(r.allSelectedSlotsDeclared).toBe(true);
  expect(r.slots).toHaveLength(10);
  expect(r.slots.every(s=>s.shadowPairDeclared&&s.irTime===s.targetUtc&&s.gspTime===s.targetUtc&&
   !s.originalWmoSigwx&&!s.nativeClct)).toBe(true);
  expect(r.liveDataDelivered).toBe(false);expect(r.releaseAuthorized).toBe(false);
 });
 it('reveals missing future time steps as gaps, not dry weather',()=>{
  const r=inspect(sample(),'2026-11-16T19:04:00Z');
  expect(r.allSelectedSlotsDeclared).toBe(false);
  expect(r.slots[0].shadowPairDeclared).toBe(true);
  expect(r.slots[6].irTime).toBeNull();expect(r.slots[6].gspTime).toBeNull();
 });
 it('rejects nonquarter, duplicate, run-foreign and corrupt source metadata',()=>{
  const a=sample();a.preview.times[2].validTime='2026-11-16T18:20:00Z';expect(()=>inspect(a)).toThrow();
  const b=sample();b.preview.times[2].validTime=b.preview.times[1].validTime;expect(()=>inspect(b)).toThrow();
  const c=sample();c.preview.run='2026-02-30T18:00:00Z';expect(()=>inspect(c)).toThrow();
  const d=sample();d.preview.times[0].IR.sha256='xyz';expect(()=>inspect(d)).toThrow();
 });
 it('rejects false no-data=zero, pseudo-WW, insufficient source evidence and readback drift',()=>{
  const a=sample();a.preview.phaseNoDataId=0;expect(()=>inspect(a)).toThrow(/NoData/);
  const b=sample();b.preview.isOfficialWmoWeatherCode=true;expect(()=>inspect(b)).toThrow();
  const c=sample();c.preview.originalManifestsSha256={a:SHA};expect(()=>inspect(c)).toThrow();
  const d=sample();d.receipt.allPixelMasksChecked=false;expect(()=>inspect(d)).toThrow();
  const e=sample();e.preview.activationAuthorized=true;expect(()=>inspect(e)).toThrow();
 });
});

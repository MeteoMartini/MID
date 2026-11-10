import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessSpatialCellIntegrity} from '../../src/openMeteoSpatialCellIntegrity';
import type {FrameResult} from '../../src/openMeteoSpatialManifest';

/** Historic externally decoded samples, NOT a live model raster or product approval. */
interface Sample {site:string;row:number;col:number;values:Record<string,number|null>}
interface Snapshot {
  model:'dwd_icon_d2'|'dwd_icon_eu';run:string;valid:string;file:string;
  grid:{rows:number;cols:number};samples:Sample[];
}
const fixture=JSON.parse(readFileSync(
  new URL('../fixtures/open-meteo-spatial-original-readback-20261109.json',import.meta.url),
  'utf8',
)) as {status:string;snapshots:Snapshot[]};
const evidence=(model:Snapshot['model'],validHour:string,site:string)=>{
  const snap=fixture.snapshots.find(s=>s.model===model&&s.valid.slice(11,13)===validHour);
  const cell=snap?.samples.find(x=>x.site===site);
  if(!snap||!cell)throw new Error(`Historical sample unavailable: ${model} ${validHour} ${site}`);
  const frame:FrameResult={status:'manifest-only',model,referenceTime:snap.run,validTime:snap.valid,variable:'cape',accumulationHours:null};
  const sample={model:snap.model,run:snap.run,valid:snap.valid,file:snap.file,
    grid:{rows:snap.grid.rows,cols:snap.grid.cols,row:cell.row,col:cell.col},values:cell.values};
  return {frame,sample};
};

describe('MID spatial-composite scientific cell integrity (read-only; no renderer)',()=>{
  it('keeps first-step missing accumulation absent rather than fabricating 0',()=>{
    for(const {model,hour,site} of [
      {model:'dwd_icon_d2' as const,hour:'06',site:'D2-center-initial'},
      {model:'dwd_icon_eu' as const,hour:'03',site:'EU-subzero-initial'},
    ]){
      const {frame,sample}=evidence(model,hour,site);
      const result=assessSpatialCellIntegrity(frame,sample);
      expect(result.ok).toBe(true);
      if(result.ok)expect(result.precipitation).toBe('initial-accumulation-unavailable');
      expect(assessSpatialCellIntegrity(frame,{...sample,
        values:{...sample.values,precipitation:0}})).toEqual({ok:false,reason:'fabricated-first-step-accumulation'});
    }
  });
  it('retains true zero and field-specific NaN instead of making the mask dry',()=>{
    const center=evidence('dwd_icon_d2','07','D2-center');
    const dry=assessSpatialCellIntegrity(center.frame,center.sample);
    expect(dry.ok).toBe(true);
    if(dry.ok){
      expect(dry.precipitation).toBe('valid-zero');
      expect(dry.zeroFields).toContain('precipitation');
      expect(dry.publicationApproved).toBe(false);
    }
    const edge=evidence('dwd_icon_d2','07','D2-NaN-domain-corner');
    const missing=assessSpatialCellIntegrity(edge.frame,edge.sample);
    expect(missing.ok).toBe(true);
    if(missing.ok){
      expect(missing.precipitation).toBe('masked');
      expect(missing.maskedFields).toContain('precipitation');
      expect(missing.precipitationRaw).toBeNull();
      expect(missing.zeroFields).not.toContain('precipitation');
    }
  });
  it('retains positive measured raw forecast totals and does not invent a precipitation phase',()=>{
    for(const [site,amount] of [
      ['Northern-Italy-rain',0.1],['Western-Mediterranean-rain',0.4],
    ] as const){
      const item=evidence('dwd_icon_eu','07',site);
      const result=assessSpatialCellIntegrity(item.frame,item.sample);
      expect(result.ok).toBe(true);
      if(result.ok){
        expect(result.precipitationRaw).toBeCloseTo(amount,5);
        expect(result.precipitation).toBe('positive-component-match-only');
        expect(result.publicationApproved).toBe(false);
      }
    }
    const edge=evidence('dwd_icon_eu','07','EU-field-specific-NoData-and-unallocated-precip');
    const unresolved=assessSpatialCellIntegrity(edge.frame,edge.sample);
    expect(unresolved.ok).toBe(true);
    if(unresolved.ok){
      expect(unresolved.precipitationRaw).toBe(0.7);
      expect(unresolved.precipitation).toBe('positive-unresolved-phase');
      expect(unresolved.snowfallHeight).toBe('masked');
    }
  });
  it('does not clamp negative original snowfall altitudes or create a snow warning',()=>{
    const raw04=evidence('dwd_icon_eu','04','EU-subzero-following');
    const raw07=evidence('dwd_icon_eu','07','EU-negative-snowline');
    for(const [item,expected] of [[raw04,-70],[raw07,-140]] as const){
      const result=assessSpatialCellIntegrity(item.frame,item.sample);
      expect(result.ok).toBe(true);
      if(result.ok){
        expect(result.snowfallHeight).toBe('raw-below-sea-level');
        expect(result.snowfallHeightRaw).toBe(expected);
        expect(result.publicationApproved).toBe(false);
      }
    }
  });
  it('refuses model-run/valid/file mixing even for the same forecast valid time',()=>{
    const d2=evidence('dwd_icon_d2','07','Koeln');
    const eu=evidence('dwd_icon_eu','07','Koeln');
    expect(assessSpatialCellIntegrity(d2.frame,eu.sample)).toEqual({ok:false,reason:'model-run-valid-file-mismatch'});
    expect(assessSpatialCellIntegrity(eu.frame,d2.sample)).toEqual({ok:false,reason:'model-run-valid-file-mismatch'});
    expect(assessSpatialCellIntegrity(d2.frame,{...d2.sample,file:eu.sample.file})).toEqual({ok:false,reason:'model-run-valid-file-mismatch'});
    expect(assessSpatialCellIntegrity(d2.frame,{...d2.sample,file:'2026-11-09T0700.om'})).toEqual({ok:false,reason:'model-run-valid-file-mismatch'});
    expect(assessSpatialCellIntegrity(d2.frame,{...d2.sample,run:'2026-11-09T03:00:00Z'})).toEqual({ok:false,reason:'model-run-valid-file-mismatch'});
  });
  it('rejects invalid grid coordinates, Infinity/NaN and negative accumulated precipitation',()=>{
    const {frame,sample}=evidence('dwd_icon_eu','07','Koeln');
    expect(assessSpatialCellIntegrity(frame,{...sample,grid:{...sample.grid,row:99999}})).toEqual({ok:false,reason:'invalid-grid-cell-index'});
    expect(assessSpatialCellIntegrity(frame,{...sample,values:{...sample.values,cape:NaN}})).toEqual({ok:false,reason:'invalid-or-nonfinite-field-values'});
    expect(assessSpatialCellIntegrity(frame,{...sample,values:{...sample.values,cape:Infinity}})).toEqual({ok:false,reason:'invalid-or-nonfinite-field-values'});
    expect(assessSpatialCellIntegrity(frame,{...sample,values:{...sample.values,precipitation:-0.1}})).toEqual({ok:false,reason:'negative-accumulated-amount'});
  });
  it('refuses dry classification for a contradictory positive component',()=>{
    const {frame,sample}=evidence('dwd_icon_eu','07','Koeln');
    const altered={...sample,values:{...sample.values,precipitation:0,rain:0.2}};
    const result=assessSpatialCellIntegrity(frame,altered);
    expect(result.ok).toBe(true);
    if(result.ok){
      expect(result.precipitation).toBe('contradictory-components');
      expect(result.publicationApproved).toBe(false);
    }
  });
  it('never promotes scientific diagnostics into published/official MID forecast',()=>{
    expect(fixture.status).toBe('research-evidence-only');
    const {frame,sample}=evidence('dwd_icon_eu','07','Northern-Italy-rain');
    const result=assessSpatialCellIntegrity(frame,sample);
    expect(result.ok).toBe(true);
    if(result.ok){
      expect(result.status).toBe('research-only');
      expect(result.publicationApproved).toBe(false);
      expect(Object.keys(result)).not.toContain('warning');
      expect(Object.keys(result)).not.toContain('renderApproved');
    }
  });
});

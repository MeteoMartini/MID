import {describe,expect,it} from 'vitest';
import {RADSAT_MIN_STEP,RADSAT_MAX_STEP,RADSAT_STEP_MS,radSatTarget5m,
 selectRadar5m,selectSatellite5m,requestBufferedFrame,commitBufferedFrame,failBufferedFrame,
 bufferedFrameInfo,type BufferedFrame} from '../helpers/surroundingsRadSat5MinuteBuffer';
const NOW=Date.parse('2026-11-17T06:17:30Z'),FIVE=5*60_000;
const asIso=(n:number)=>new Date(n).toISOString();
const frame=(phase:BufferedFrame['phase'],time:number,url:string,scope='site-a'):
 BufferedFrame=>({scope,url,originalTime:time,family:phase==='RGB'||phase==='IR'?'satellite':'radar',phase,verifiedOriginal:true});

describe('MID-Karten P1 Rad/Sat: five-minute original timeline + pixel-ready frame continuity',()=>{
 it('anchors to completed UTC 5-minute slot, spans -45 to +120 min, and survives DST',()=>{
  expect(RADSAT_STEP_MS).toBe(300_000);
  expect(RADSAT_MIN_STEP).toBe(-9);expect(RADSAT_MAX_STEP).toBe(24);
  expect(radSatTarget5m(NOW,0)).toBe(Date.parse('2026-11-17T06:15:00Z'));
  expect(radSatTarget5m(NOW,-1)).toBe(Date.parse('2026-11-17T06:10:00Z'));
  expect(radSatTarget5m(NOW,1)).toBe(Date.parse('2026-11-17T06:20:00Z'));
  expect(radSatTarget5m(NOW,RADSAT_MAX_STEP)-radSatTarget5m(NOW,0)).toBe(120*60_000);
  const dst=Date.parse('2026-10-25T01:57:00Z');
  expect(radSatTarget5m(dst,-1)).toBe(Date.parse('2026-10-25T01:50:00Z'));
  for(const step of [-10,25,1.1,NaN])expect(Number.isNaN(radSatTarget5m(NOW,step))).toBe(true);
 });
 it('selects native five-minute DWD observations, never a nominally re-timed radar source',()=>{
  const source={dwdRadar:[asIso(Date.parse('2026-11-17T06:10:00Z')),Date.parse('2026-11-17T06:15:00Z')/1000],
   dwdRadarNowcast:[asIso(Date.parse('2026-11-17T06:20:00Z'))]};
  expect(selectRadar5m(source,NOW,0)).toEqual({time:Date.parse('2026-11-17T06:15:00Z'),kind:'Beobachtung'});
  expect(selectRadar5m(source,NOW,-1)?.time).toBe(Date.parse('2026-11-17T06:10:00Z'));
  expect(selectRadar5m(source,NOW,1)?.kind).toBe('Nowcast');
  expect(selectRadar5m(source,NOW,2)).toBeUndefined();
  expect(selectRadar5m(source,NOW,0,false)).toBeUndefined();
  expect(selectRadar5m({dwdRadar:[asIso(NOW+FIVE)]},NOW,0)).toBeUndefined();
  expect(selectRadar5m({dwdRadarNowcast:[asIso(NOW-FIVE)]},NOW,1)).toBeUndefined();
  expect(selectRadar5m({dwdRadar:[asIso(NOW-20*60_000)]},NOW,0)).toBeUndefined();
  expect(selectRadar5m({},NOW,0)).toBeUndefined();
 });
 it('retains native satellite 10/15-minute timestamps on a five-minute selector, never synthesizing images',()=>{
  const catalog={satelliteRgbProduct:{provider:'eumetsat' as const,layer:'true-rgb',times:[asIso(Date.parse('2026-11-17T06:00:00Z')),asIso(Date.parse('2026-11-17T06:10:00Z'))]},
   satelliteIrProduct:{provider:'dwd' as const,layer:'IR10',times:[asIso(Date.parse('2026-11-17T06:15:00Z'))]}};
  expect(selectSatellite5m(catalog,NOW,0)).toEqual({time:Date.parse('2026-11-17T06:10:00Z'),spectrum:'RGB',provider:'eumetsat',layer:'true-rgb'});
  expect(selectSatellite5m(catalog,NOW,-1)?.time).toBe(Date.parse('2026-11-17T06:10:00Z'));
  expect(selectSatellite5m(catalog,NOW,-2)?.time).toBe(Date.parse('2026-11-17T06:00:00Z'));
  expect(selectSatellite5m(catalog,NOW,1)).toBeUndefined(); // no satellite forecast
  expect(selectSatellite5m({...catalog,satelliteRgbProduct:{...catalog.satelliteRgbProduct,fresh:false}},NOW,0)?.spectrum).toBe('IR');
  expect(selectSatellite5m({...catalog,satelliteRgbProduct:{...catalog.satelliteRgbProduct,times:[]}},NOW,0)?.time).toBe(Date.parse('2026-11-17T06:15:00Z'));
  expect(selectSatellite5m({},NOW,0)).toBeUndefined();
 });
 it('preserves last visible original while successor loads, promotes only on GPU-ready callback',()=>{
  const old=frame('Beobachtung',Date.parse('2026-11-17T06:10:00Z'),'https://dwd.invalid/wms?t=0610');
  const next=frame('Beobachtung',Date.parse('2026-11-17T06:15:00Z'),'https://dwd.invalid/wms?t=0615');
  let state=requestBufferedFrame(undefined,'site-a','radar','Beobachtung',old.originalTime,old,NOW);
  expect(state.visible).toBeUndefined();expect(state.pending).toEqual(old);
  state=commitBufferedFrame(state,old);
  expect(state.visible).toEqual(old);
  state=requestBufferedFrame(state,'site-a','radar','Beobachtung',next.originalTime,next,NOW);
  expect(state.visible).toEqual(old);expect(state.pending).toEqual(next);
  expect(bufferedFrameInfo(state)).toEqual({requestedTime:next.originalTime,visibleOriginalTime:old.originalTime,loading:true,displayedIsExactOriginal:false,error:null});
  expect(commitBufferedFrame(state,old)).toBe(state); // superseded onload ignored
  state=commitBufferedFrame(state,next);
  expect(state.visible).toEqual(next);expect(state.pending).toBeUndefined();
  state=requestBufferedFrame(state,'site-a','radar','Beobachtung',next.originalTime,next,NOW);
  expect(state.pending).toBeUndefined(); // no duplicate image download
 });
 it('does not blank on failed next frame; rejects late success and distinguishes selected vs displayed time',()=>{
  const old=frame('Beobachtung',Date.parse('2026-11-17T06:10:00Z'),'https://dwd.invalid/a');
  const next=frame('Beobachtung',Date.parse('2026-11-17T06:15:00Z'),'https://dwd.invalid/b');
  let state=commitBufferedFrame(requestBufferedFrame(undefined,'site-a','radar','Beobachtung',old.originalTime,old,NOW),old);
  state=requestBufferedFrame(state,'site-a','radar','Beobachtung',next.originalTime,next,NOW);
  state=failBufferedFrame(state,next);
  expect(state.visible).toEqual(old);expect(state.error).toBe('load-failed');
  expect(commitBufferedFrame(state,next)).toBe(state);
  state=requestBufferedFrame(state,'site-a','radar','Beobachtung',next.originalTime,undefined,NOW);
  expect(state.visible).toEqual(old);expect(state.error).toBe('no-original');
  expect(bufferedFrameInfo(state).displayedIsExactOriginal).toBe(false);
 });
 it('clears frame at changed geography or observational/nowcast phase; prevents cross-location flash',()=>{
  const old=frame('Beobachtung',Date.parse('2026-11-17T06:10:00Z'),'https://dwd.invalid/a');
  let state=commitBufferedFrame(requestBufferedFrame(undefined,'site-a','radar','Beobachtung',old.originalTime,old,NOW),old);
  state=requestBufferedFrame(state,'site-b','radar','Beobachtung',old.originalTime,undefined,NOW);
  expect(state.visible).toBeUndefined();
  state=commitBufferedFrame(requestBufferedFrame(undefined,'site-a','radar','Beobachtung',old.originalTime,old,NOW),old);
  state=requestBufferedFrame(state,'site-a','radar','Nowcast',NOW+FIVE,undefined,NOW);
  expect(state.visible).toBeUndefined();
  const wrong=frame('Nowcast',NOW+FIVE,'https://dwd.invalid/wrong','site-b');
  state=requestBufferedFrame(state,'site-a','radar','Nowcast',NOW+FIVE,wrong,NOW);
  expect(state.pending).toBeUndefined();expect(state.error).toBe('no-original');
 });
 it('keeps same-scope RGB while verified IR is being prepared and never labels it the new target',()=>{
  const rgb=frame('RGB',Date.parse('2026-11-17T06:10:00Z'),'https://eumetsat.invalid/rgb');
  const ir=frame('IR',Date.parse('2026-11-17T06:15:00Z'),'https://dwd.invalid/ir');
  let state=commitBufferedFrame(requestBufferedFrame(undefined,'site-a','satellite','RGB',rgb.originalTime,rgb,NOW),rgb);
  state=requestBufferedFrame(state,'site-a','satellite','IR',ir.originalTime,ir,NOW);
  expect(state.visible).toEqual(rgb);expect(state.pending).toEqual(ir);
  expect(bufferedFrameInfo(state).displayedIsExactOriginal).toBe(false);
  state=commitBufferedFrame(state,ir);expect(state.visible).toEqual(ir);
 });
});

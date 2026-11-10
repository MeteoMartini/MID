import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {finalizeForecastMinute15,rapidThunderRisk} from '../../src/forecastFusion';

const source=readFileSync('worker-src/00-core-observations.js','utf8');
const originalNumber=source.match(/^function number\(v\)\{[^\n]*\}/m)?.[0];
const originalRapid=source.match(/^function rucRapidMinute15Rows\(successful\)\{[\s\S]*?^\}/m)?.[0];
if(!originalNumber||!originalRapid)throw Error('Original Worker RUC rapid function unavailable');
const nativeRows=new Function(originalNumber+'\n'+originalRapid+'\nreturn rucRapidMinute15Rows;')() as (samples:unknown[])=>any[];

const run='2026-11-10T14:00:00',time='2026-11-10T14:15:00',epoch=Date.parse(time+'Z');
const minute5=['2026-11-10T14:05:00','2026-11-10T14:10:00','2026-11-10T14:15:00'];
function workerRapid(nativeQuarter:unknown,precip5:unknown[],rain:unknown=0,snow:unknown=0){
 return nativeRows([{id:'icon_d2_ruc',successful:true,initialisationTime:run+'.000Z',rapid:{
  convection15:{time:[run,time],precipitation:[0,nativeQuarter],cape:[0,null],convective_inhibition:[0,null]},
  precip5:{time:minute5,precipitation:precip5},
  phase15:{rain:[0,rain],snowfall_water_equivalent:[0,snow]}
 }}]);
}
const anchor=()=>({time,epoch,precipitation:1,rain:1,showers:0,snowfall:0,probability:70,code:61,cloud:80,lowCloud:50,isDay:false});
const finalize=(sample?:unknown)=>finalizeForecastMinute15([anchor()] as any,[],[],{now:epoch-3600000,rucRapidMinutes15:sample?[sample] as any:[]})[0];

describe('MID ICON-D2-RUC original rapid precipitation/phase missing provenance',()=>{
 it('all 3 productive Worker mirrors use byte-identical original rapid extraction',()=>{
  for(const path of ['worker.js','worker/metar-proxy.js']){
   const mirror=readFileSync(path,'utf8');
   expect(mirror.match(/^function rucRapidMinute15Rows\(successful\)\{[\s\S]*?^\}/m)?.[0]).toBe(originalRapid);
  }
 });
 it('does not advertise a completed T0 interval; null/NaN/negative original data remain missing',()=>{
  const rows=workerRapid(null,[null,undefined,NaN],null,undefined);
  expect(rows[0].precipitation).toBeUndefined();
  expect(rows[0].rain).toBeUndefined();
  expect(rows[0].snowfallWaterEquivalent).toBeUndefined();
  expect(rows[0].peakRateMmh).toBeUndefined();
  expect(rows[0].nativePrecipitationSeconds).toBeUndefined();
  expect(rows[1].precipitation).toBeUndefined();
  expect(rows[1].cape).toBeUndefined();
  expect(rows[1].convectiveInhibition).toBeUndefined();
  expect(rows[1].peakRateMmh).toBeUndefined();
  expect(rows[1].nativePrecipitationSeconds).toBeUndefined();
  expect(rows[1].rain).toBeUndefined();
  expect(rows[1].snowfallWaterEquivalent).toBeUndefined();
  expect(workerRapid(-1,[-1,-2,NaN])[1].precipitation).toBeUndefined();
 });
 it('keeps actual dry zero, and authentic 5-minute rate only with all three original slices',()=>{
  const dry=workerRapid(0,[0,0,0])[1];
  expect(dry.precipitation).toBe(0);
  expect(dry.peakRateMmh).toBe(0);
  expect(dry.nativePrecipitationSeconds).toBe(300);
  const wet=workerRapid(.6,[.1,.2,.3])[1];
  expect(wet.precipitation).toBeCloseTo(.6);
  expect(wet.peakRateMmh).toBeCloseTo(3.6);
  expect(wet.nativePrecipitationSeconds).toBe(300);
  const partial=workerRapid(.6,[.1,null,.3])[1];
  expect(partial.precipitation).toBeCloseTo(.6);
  expect(partial.peakRateMmh).toBeUndefined();
  expect(partial.nativePrecipitationSeconds).toBe(900);
  const noQuarter=workerRapid(null,[.1,.2,.3])[1];
  expect(noQuarter.precipitation).toBeUndefined();
  expect(noQuarter.peakRateMmh).toBeCloseTo(3.6);
 });
 it('does not mix null/undefined/NaN/negative RUC precipitation into canonical rain or PoP',()=>{
  const base=finalize();
  for(const precipitation of [null,undefined,NaN,-1]){
   const actual=finalize({time,epoch,precipitation,cape:700,peakRateMmh:0});
   expect(actual.precipitation).toBeCloseTo(base.precipitation);
   expect(actual.probability).toBeCloseTo(base.probability);
   expect(actual.rain).toBeCloseTo(base.rain);
  }
 });
 it('uses real native zero but never interprets one missing phase as an original zero',()=>{
  const base=finalize();
  const realDry=finalize({time,epoch,precipitation:0,peakRateMmh:0,cape:0,convectiveInhibition:0});
  expect(realDry.precipitation).toBeLessThan(base.precipitation);
  expect(realDry.probability).toBeLessThanOrEqual(base.probability);
  const incompletePhase=finalize({time,epoch,precipitation:.6,peakRateMmh:2.4,cape:0,convectiveInhibition:0,rain:.6,snowfallWaterEquivalent:null});
  expect(Number.isFinite(incompletePhase.rain)).toBe(true);
  expect(Number.isFinite(incompletePhase.snowfall)).toBe(true);
  expect(incompletePhase.snowfall).toBeCloseTo(base.snowfall);
 });
 it('labels a 5-minute peak only when native 300-second original provenance is explicit',()=>{
  const base={time,epoch,precipitation:1,cape:1500,convectiveInhibition:0,peakRateMmh:14,dbzCmax:50};
  const noProof=rapidThunderRisk(base);
  const proven=rapidThunderRisk({...base,nativePrecipitationSeconds:300});
  expect(noProof?.signals.join(' ')).not.toContain('5-min-Peak');
  if(proven)expect(proven.signals.join(' ')).toContain('5-min-Peak');
 });
 it('distinguishes authentic 13Z and 14Z T0 from their completed +15m intervals',()=>{
  for(const h of [13,14]){
   const zero='2026-11-10T'+String(h)+':00:00',plus15='2026-11-10T'+String(h)+':15:00';
   const rows=nativeRows([{id:'icon_d2_ruc',successful:true,initialisationTime:zero+'.000Z',rapid:{convection15:{time:[zero,plus15],precipitation:[0,0]},precip5:{time:[],precipitation:[]}}}]);
   expect(rows[0].precipitation).toBeUndefined();
   expect(rows[0].nativePrecipitationSeconds).toBeUndefined();
   expect(rows[1].precipitation).toBe(0);
   expect(rows[1].nativePrecipitationSeconds).toBe(900);
  }
 });
});

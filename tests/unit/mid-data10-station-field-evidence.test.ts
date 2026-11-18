import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {stationCalendarDateValid,stationFieldAgeMinutes,stationObservationNumber} from '../../src/stationFieldEvidence';
import {fieldObservationRelevance,fieldRelevanceLimits} from '../../src/sourceQuality';
const NOW=Date.parse('2026-11-18T12:00:00Z');
const read=(p:string)=>readFileSync(fileURLToPath(new URL('../../'+p,import.meta.url)),'utf8');
const fragment=read('src/weather-src/10-observations-specialized.tsfrag');
describe('MID Data 1.0 · source-time and missing-station-value admission',()=>{
 it('never fabricates a 120-minute pressure observation when source time is missing',()=>{
  for(const v of [undefined,null,'','not-a-date','2026-11-18T11:00:00'])expect(stationFieldAgeMinutes(v,NOW)).toBe(Infinity);
  expect(fieldObservationRelevance('pressure',stationFieldAgeMinutes(undefined,NOW),5)).toBe(0);
 });
 it('keeps actually dated 90-minute QFF eligible according to the existing parameter limit',()=>{
  const age=stationFieldAgeMinutes('2026-11-18T10:30:00.000Z',NOW);
  expect(age).toBe(90);
  expect(fieldObservationRelevance('pressure',age,5)).toBeGreaterThan(fieldRelevanceLimits('pressure').minimumAnchorRelevance);
 });
 it('rejects reports more than five minutes ahead, retaining bounded time-skew allowance',()=>{
  expect(stationFieldAgeMinutes('2026-11-18T12:06:00.000Z',NOW)).toBe(Infinity);
  expect(stationFieldAgeMinutes('2026-11-18T12:03:00.000Z',NOW)).toBe(0);
 });
 it('rejects invalid source calendar days before Date normalization',()=>{
  for(const raw of ['2026-02-31T12:00:00Z','2026-04-31T12:00:00Z','1900-02-29T12:00:00Z','2026-00-12T12:00:00Z']){
   expect(stationCalendarDateValid(raw)).toBe(false);
   expect(stationFieldAgeMinutes(raw,NOW)).toBe(Infinity);
  }
  for(const raw of ['2024-02-29T12:00:00Z','2000-02-29T12:00:00Z','2026-11-18T12:00:00Z'])expect(stationCalendarDateValid(raw)).toBe(true);
  expect(fragment).toContain("value===''||!stationCalendarDateValid(value)");
 });
 it('keeps duplicate-station zero and rejects invalid candidate values',()=>{
  const values=[null,0,undefined,'',-1];
  expect(values.filter(value=>Number.isFinite(stationObservationNumber(value))&&stationObservationNumber(value)>=0)).toEqual([0]);
  expect(fragment).toContain("candidates=[a,b].filter(candidate=>{const value=stationObservationNumber(candidate[field])");
  expect(fragment).toContain("fields.some(field=>{const value=stationObservationNumber(station[field])");
 });
 it('preserves physical zero and refuses null/blank/boolean/invalid sensor values',()=>{
  expect(stationObservationNumber(0)).toBe(0);
  expect(stationObservationNumber('0')).toBe(0);
  expect(stationObservationNumber(-12.5)).toBe(-12.5);
  for(const x of [null,undefined,'','  ',true,false,NaN,Infinity,'0x1','--1',{}])expect(stationObservationNumber(x)).toBeNaN();
 });
 it('wires validated field-specific time and scalars into original station consumers',()=>{
  expect(fragment).toContain('fallbackAge=stationFieldAgeMinutes(normalizeStationTimestamp(station.fieldObservedAt?.[field]??station.timestamp),now)');
  expect(fragment).toContain('source.observedAt===undefined?fallbackAge:stationFieldAgeMinutes(normalizeStationTimestamp(source.observedAt),now)');
  expect(fragment).toContain('stationObservationNumber(station[field])');
  expect(fragment).toContain("field==='precipitation'&&value<0");
  expect(fragment).toContain('stationObservationNumber(s.pressure)');
  expect(fragment).not.toContain('if(!station||!Number.isFinite(Number(station[field])))return false;');
 });
 it('retains exact source-of-truth generated weather.ts source parity',()=>{
  const parts=['00-types-models-search.tsfrag','10-observations-specialized.tsfrag','20-mapping-day-character.tsfrag','30-ensemble-climate-hazards.tsfrag'];
  expect(read('src/weather.ts')).toBe(parts.map(p=>read('src/weather-src/'+p)).join(''));
 });
});

import {describe,expect,it} from 'vitest';
import type {ModelRunMeta} from '../../src/weather';
import {assessModelFreshness,modelRunFreshness} from '../../src/modelFreshnessStatus';

const H=3600_000,now=Date.parse('2026-11-17T12:00:00Z');
function row(id:string,ageHours:number,extra:Record<string,unknown>={}):ModelRunMeta{
 return {id,kind:'forecast',label:'Quelle '+id,usedInCanonical:true,
  initialisationTime:new Date(now-ageHours*H).toISOString(),updateIntervalSeconds:3600,
  ...extra} as ModelRunMeta;
}

describe('MID Audit 1.0 · bounded source-freshness provenance',()=>{
 it('keeps established actual-contributor and freshness precedence',()=>{
  const snapshot=[row('fresh',.5),row('stale',3.5),row('unknown',.5,{metadataUnavailable:true}),
   row('prefetched',3.5,{usedInCanonical:false,fusionLoaded:true})];
  const result=assessModelFreshness(snapshot,now);
  expect(result).toMatchObject({band:'delayed',checked:3,stale:1,delayed:0,unknown:1,aggregated:0});
  expect(result.details).toContain('Quelle unknown');
  expect(result.details).not.toContain('Quelle prefetched');
 });
 it('preserves single-run stale and two-thirds stale critical states',()=>{
  expect(assessModelFreshness([row('stale',3.5)],now).band).toBe('stale');
  expect(assessModelFreshness([row('one',.3),row('two',3.5),row('three',4)],now).band).toBe('stale');
  expect(assessModelFreshness([row('one',.3),row('two',.3),row('three',4)],now).band).toBe('delayed');
 });
 it('reports exact counts but bounds compact source names at any inventory length',()=>{
  const rows=Array.from({length:1200},(_,i)=>row('missing-'+i,.5,{metadataUnavailable:true}));
  const report=assessModelFreshness(rows,now);
  expect(report).toMatchObject({band:'unknown',checked:1200,unknown:1200,stale:0,delayed:0});
  expect(report.details).toContain('Quelle missing-0');
  expect(report.details).toContain('Quelle missing-3');
  expect(report.details).not.toContain('Quelle missing-4');
  expect(report.details).toContain('1196 weitere Läufe');
  expect(report.details.length).toBeLessThan(600);
 });
 it('bounds very long or whitespace-containing unverified source names without losing counts',()=>{
  const report=assessModelFreshness([
   row('one',.2,{metadataUnavailable:true,label:'A'.repeat(250)+' \nNachlauf'}),
   row('two',.2,{metadataUnavailable:true,label:'B   mit   Leerraum'}),
   row('three',.2,{metadataUnavailable:true,label:'C'}),
   row('four',.2,{metadataUnavailable:true,label:'D'}),
   row('five',.2,{metadataUnavailable:true,label:'E'}),
  ],now);
  expect(report.unknown).toBe(5);
  expect(report.details).toContain('A'.repeat(87)+'…');
  expect(report.details).not.toContain('Nachlauf');
  expect(report.details).toContain('B mit Leerraum');
  expect(report.details).toContain('1 weiterer Lauf');
  expect(report.details.length).toBeLessThan(550);
 });
 it('excludes aggregate best_match from individual freshness counts without hiding it',()=>{
  const report=assessModelFreshness([row('best_match',.2,{metadataUnavailable:true}),row('ruc',.3)],now);
  expect(report).toMatchObject({band:'current',aggregated:1,checked:1,unknown:0});
  expect(report.details).toContain('Best Match ist eine Sammelquelle');
 });
 it('retains fallback-only, zero-row, deterministic and no-data states',()=>{
  expect(assessModelFreshness([],now).band).toBe('unknown');
  const fallback=row('global',.5,{usedInCanonical:undefined,usageStatus:'fallback'});
  const unused=row('orphan',3.5,{usedInCanonical:false,fusionLoaded:true});
  expect(assessModelFreshness([fallback,unused],now).band).toBe('current');
  expect(assessModelFreshness([unused],now).checked).toBe(0);
  expect(assessModelFreshness([row('x',.2,{metadataUnavailable:true})],now).band).toBe('unknown');
  expect(modelRunFreshness(row('x',.2,{metadataUnavailable:true}),now)).toBe('unknown');
  expect(assessModelFreshness([fallback,unused],now)).toEqual(assessModelFreshness([fallback,unused],now));
 });
});

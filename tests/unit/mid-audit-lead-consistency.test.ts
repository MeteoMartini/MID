import {afterEach,describe,expect,it,vi} from 'vitest';
import {isArchivedDailyForecastLeadCoherent} from '../../src/forecastLeadTimeEvidence';
import {buildForecastVerificationReport} from '../../src/forecastVerification';

afterEach(()=>vi.unstubAllGlobals());

describe('MID Audit 1.0 · archived issue-vs-lead consistency (local noon)',()=>{
 const springNoon=Date.parse('2026-03-29T10:00:00Z'),fallNoon=Date.parse('2026-10-25T11:00:00Z');
 it('uses real 23h/25h target-noon differences across Europe/Berlin DST changes',()=>{
  expect(isArchivedDailyForecastLeadCoherent('2026-03-28T11:00:00Z',23,springNoon)).toBe(true);
  expect(isArchivedDailyForecastLeadCoherent('2026-03-28T11:00:00Z',24,springNoon)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-10-24T10:00:00Z',25,fallNoon)).toBe(true);
  expect(isArchivedDailyForecastLeadCoherent('2026-10-24T10:00:00Z',24,fallNoon)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-03-28T12:00:00+01:00',23,springNoon)).toBe(true);
 });
 it('rejects false 12/24/48/72-h labels without mutating forecasts',()=>{
  const noon=Date.parse('2026-01-02T11:00:00Z');
  for(const lead of [12,18,24,36,48,72,120])expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',lead,noon)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',25,noon)).toBe(true);
 });
 it('tolerates less than 60 seconds of serialization rounding, but not run shifts',()=>{
  const noon=Date.parse('2026-01-02T11:00:00Z');
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00.000Z',25.002,noon)).toBe(true);
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',25.02,noon)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:05:00Z',25,noon)).toBe(false);
 });
 it('rejects missing, ambiguous, non-numeric or invalid timestamps and leads',()=>{
  const noon=Date.parse('2026-01-02T11:00:00Z');
  for(const issuedAt of [undefined,null,'','2026-01-01T10:00:00','not-a-date','2026-22-56T10:00:00Z','2026-02-30T10:00:00Z','2026-01-01T10:00:00+25:00'])
   expect(isArchivedDailyForecastLeadCoherent(issuedAt,25,noon)).toBe(false);
  for(const lead of [undefined,null,'25',0,-1,NaN,Infinity,-Infinity])
   expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',lead,noon)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',25,NaN)).toBe(false);
  expect(isArchivedDailyForecastLeadCoherent('2026-01-01T10:00:00Z',25,null)).toBe(false);
 });
 it('filters inconsistent original v3 archive captures without modifying stored bytes',()=>{
  const stored=new Map<string,string>();
  vi.stubGlobal('localStorage',{
   getItem:(key:string)=>stored.get(key)??null,
   setItem:(key:string,value:string)=>{stored.set(key,String(value));},
   removeItem:(key:string)=>{stored.delete(key);},
   key:(i:number)=>[...stored.keys()][i]??null,
   get length(){return stored.size;},
  });
  const key='mid-audit-lead-consistency',location={id:21,name:'Synthetische Vorlaufstation',latitude:50.82,longitude:7.14,timezone:'Europe/Berlin'};
  const leadValues:[unknown,boolean][]=[[25,true],[48,false],[25.3,false],[0,false],[25.002,true],['25',false],[null,false]];
  const references=leadValues.map((_,i)=>{
   const date='2024-01-'+String(i+1).padStart(2,'0'),source={id:'qa-station',label:'Synthetische unabhängige Station',kind:'measured',quality:.95};
   return {date,max:10,min:2,precipitation:0,source:source.label,regime:'wechselhaft',quality:.95,confidence:'high',kind:'measured',sources:[source],coverageHours:24};
  });
  const captures=leadValues.map(([leadHours],i)=>{
   const date=references[i].date,issuedAt=new Date(Date.parse(date+'T11:00:00Z')-25*3600000).toISOString();
   return{id:'qa-'+i,targetDate:date,issuedAt,leadHours,timezone:'Europe/Berlin',predictedRegime:'wechselhaft',
    predictions:[{id:'best_match',label:'Best Match',max:10,min:2,precipitation:0,probability:0,probabilityKind:'daily-wet-native'}]};
  });
  const archive=JSON.stringify({version:3,updatedAt:'2024-01-10T00:00:00Z',captures,references,observations:[]});
  stored.set('mid:forecast-verification:v3:'+key,archive);
  const report=buildForecastVerificationReport(key,[],[],location,[]);
  expect(report.days).toBe(2);
  expect(report.samples).toBe(2);
  expect(report.reviews.map(r=>r.date)).toEqual(['2024-01-05','2024-01-01']);
  expect(stored.get('mid:forecast-verification:v3:'+key)).toBe(archive);
 });
});

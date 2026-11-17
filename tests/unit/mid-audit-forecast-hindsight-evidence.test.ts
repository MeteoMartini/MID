import {afterEach,describe,expect,it,vi} from 'vitest';
import {isFullDayForecastEvidenceIssuedBeforeDay} from '../../src/forecastCaptureEvidence';
import {buildForecastVerificationReport} from '../../src/forecastVerification';

afterEach(()=>vi.unstubAllGlobals());

describe('MID Audit 1.0 · no hindsight in independent full-day skill',()=>{
 const start=Date.parse('2026-03-28T23:00:00Z'); // Berlin local midnight before 23h DST day
 it('accepts an unambiguous archive timestamp issued before the target local day',()=>{
  expect(isFullDayForecastEvidenceIssuedBeforeDay('2026-03-28T21:00:00.000Z',14,start)).toBe(true);
  expect(isFullDayForecastEvidenceIssuedBeforeDay('2026-03-29T00:00:00+02:00',14,start)).toBe(true);
  expect(isFullDayForecastEvidenceIssuedBeforeDay('2026-03-28T23:00:00Z',12,start)).toBe(true);
 });
 it('excludes same-day, post-event, or later issue times regardless of stored positive lead',()=>{
  for(const issue of ['2026-03-28T23:00:01Z','2026-03-29T12:00:00+02:00','2026-03-30T08:00:00Z']){
   expect(isFullDayForecastEvidenceIssuedBeforeDay(issue,24,start)).toBe(false);
  }
 });
 it('rejects missing, timezone-ambiguous or invalid provenance without replacing it by zero',()=>{
  for(const issue of [undefined,null,'','2026-03-28T20:00:00','not-a-time','2026-15-35T09:00:00Z']){
   expect(isFullDayForecastEvidenceIssuedBeforeDay(issue,24,start)).toBe(false);
  }
 });
 it('rejects non-finite, non-positive lead times and unknown target day boundaries',()=>{
  for(const lead of [undefined,null,'24',0,-1,NaN,Infinity,-Infinity]){
   expect(isFullDayForecastEvidenceIssuedBeforeDay('2026-03-28T20:00:00Z',lead,start)).toBe(false);
  }
  expect(isFullDayForecastEvidenceIssuedBeforeDay('2026-03-28T20:00:00Z',24,NaN)).toBe(false);
 });
 it('filters real archived full-day report evidence by issuedAt before scoring, without modifying archives',()=>{
  const stored=new Map<string,string>();
  vi.stubGlobal('localStorage',{
   getItem:(key:string)=>stored.get(key)??null,
   setItem:(key:string,value:string)=>{stored.set(key,value);},
   removeItem:(key:string)=>{stored.delete(key);},
   key:(i:number)=>[...stored.keys()][i]??null,
   get length(){return stored.size;},
  });
  const key='audit-full-day-hindsight-qa',location={id:50,name:'Synthetischer Kontrollort',latitude:50.82,longitude:7.14,timezone:'Europe/Berlin'};
  const issued=[
   '2023-12-31T20:00:00Z', // Jan 1: before start, valid
   '2024-01-01T23:00:00Z', // Jan 2: exactly midnight local, valid
   '2024-01-03T08:00:00Z', // Jan 3: forecast after day started, INVALID
   '2024-01-05T08:00:00Z', // Jan 4: forecast after day finished, INVALID
   '2024-01-04T20:00:00',  // Jan 5: time zone missing, INVALID
   'not-a-time',           // Jan 6: invalid, INVALID
   '2024-01-06T21:00:00Z', // Jan 7: lead invalid, INVALID
   '2024-01-07T20:00:00Z', // Jan 8: valid
  ];
  const references=issued.map((_,i)=>{
   const date='2024-01-'+String(i+1).padStart(2,'0'),source={id:'qa-station',label:'Synthetische Station',kind:'measured',quality:.95};
   return{date,max:10,min:2,precipitation:0,source:source.label,regime:'wechselhaft',quality:.95,confidence:'high',kind:'measured',sources:[source],coverageHours:24};
  });
  const captures=issued.map((issuedAt,i)=>({
   id:'qa-'+i,targetDate:references[i].date,issuedAt,leadHours:i===6?null:24,timezone:'Europe/Berlin',predictedRegime:'wechselhaft',
   predictions:[{id:'best_match',label:'Best Match',max:10,min:2,precipitation:0,probability:0,probabilityKind:'daily-wet-native'}],
  }));
  const archive=JSON.stringify({version:3,updatedAt:'2024-01-09T00:00:00Z',captures,references,observations:[]});
  stored.set('mid:forecast-verification:v3:'+key,archive);
  const report=buildForecastVerificationReport(key,[],[],location,[]);
  expect(report.days).toBe(3);
  expect(report.samples).toBe(3);
  expect(report.models.find(row=>row.id==='best_match')?.days).toBe(3);
  expect(report.reviews.map(row=>row.date)).toEqual(['2024-01-08','2024-01-02','2024-01-01']);
  expect(stored.get('mid:forecast-verification:v3:'+key)).toBe(archive);
 });
});

import {afterEach,describe,expect,it,vi} from 'vitest';
import {isTwinVerifiedNonnegative,isTwinVerifiedTemperaturePair} from '../../src/twinObservationEvidence';
import {buildForecastVerificationReport} from '../../src/forecastVerification';

afterEach(()=>vi.unstubAllGlobals());

describe('MID Audit 1.0 · unabhängige Messwerte bleiben NoData statt falscher Dry-Day-Skill',()=>{
 it('rejects non-numeric and invalid rain accumulations instead of coercing to 0 mm',()=>{
  for(const x of [null,undefined,Number.NaN,Infinity,-Infinity,'0','',false,-.01])
   expect(isTwinVerifiedNonnegative(x)).toBe(false);
  for(const x of [0,0.01,2,250,5000])expect(isTwinVerifiedNonnegative(x)).toBe(true);
 });
 it('rejects unphysical or missing Tmin/Tmax pairs but preserves real extremes',()=>{
  expect(isTwinVerifiedTemperaturePair(10,2)).toBe(true);
  expect(isTwinVerifiedTemperaturePair(0,-30)).toBe(true);
  expect(isTwinVerifiedTemperaturePair(60,40)).toBe(true);
  for(const [max,min] of [[null,2],[10,null],['10',2],[10,'2'],[Number.NaN,0],[0,Infinity],[2,10]])
   expect(isTwinVerifiedTemperaturePair(max,min)).toBe(false);
 });
 it('keeps available temperature skill while removing invalid precipitation and PoP samples',()=>{
  const store=new Map<string,string>();
  vi.stubGlobal('localStorage',{
   getItem:(key:string)=>store.get(key)??null,
   setItem:(key:string,value:string)=>{store.set(key,String(value));},
   removeItem:(key:string)=>{store.delete(key);},
   key:(i:number)=>[...store.keys()][i]??null,
   get length(){return store.size;},
  });
  const location={id:99,name:'Synthetische Messreferenz',latitude:50.82,longitude:7.14,timezone:'Europe/Berlin'};
  const key='qa-no-data-independent-reference';
  const precipitation:[unknown,number][]=[[0,0],[2,100],[null,100],[-4,100],['0',100],[NaN,100],['missing',100]];
  const maxValues:[unknown,unknown][]= [[10,2],[10,2],[10,2],[null,2],[2,10],['10',2],[10,null]];
  const references=precipitation.map(([amount],i)=>{
   const source={id:'synthetic-measured',label:'Synthetische DWD-ähnliche Referenz',kind:'measured',quality:.95};
   return {date:'2024-01-'+String(i+1).padStart(2,'0'),
    max:maxValues[i][0],min:maxValues[i][1],precipitation:amount,gust:18,
    regime:'wechselhaft',source:source.label,quality:.95,confidence:'high',kind:'measured',sources:[source],coverageHours:24};
  });
  const captures=references.map((ref,i)=>{
   // Exactly 48h before target local noon (CET). Also valid under #890/#892.
   const issuedAt=new Date(Date.parse(ref.date+'T11:00:00Z')-48*3600000).toISOString();
   return {id:'qa-'+i,targetDate:ref.date,issuedAt,leadHours:48,timezone:'Europe/Berlin',
    predictedRegime:'wechselhaft',predictions:[{id:'best_match',label:'Best Match',max:10,min:2,
     precipitation:0,probability:precipitation[i][1],gust:18,probabilityKind:'daily-wet-native'}]};
  });
  const archived=JSON.stringify({version:3,updatedAt:'2024-01-12T00:00:00Z',captures,references,observations:[]});
  store.set('mid:forecast-verification:v3:'+key,archived);
  const report=buildForecastVerificationReport(key,[],[],location,[]);
  const best=report.models.find(row=>row.id==='best_match');
  expect(report.days).toBe(7);
  expect(best?.parameterMetrics.temperature?.samples).toBe(3);
  expect(best?.parameterMetrics.precipitation?.samples).toBe(2);
  expect(best?.parameterMetrics.probability?.samples).toBe(2);
  expect(best?.parameterMetrics.gust?.samples).toBe(7);
  expect(best?.brier).toBe(0);
  expect(report.calibrations.reduce((sum,row)=>sum+row.samples,0)).toBe(2);
  expect(store.get('mid:forecast-verification:v3:'+key)).toBe(archived);
 });
 it('never erases actual 0mm or caps extreme rain observations',()=>{
  expect(isTwinVerifiedNonnegative(0)).toBe(true);
  expect(isTwinVerifiedNonnegative(100000)).toBe(true);
  expect(isTwinVerifiedNonnegative(-1)).toBe(false);
 });
});

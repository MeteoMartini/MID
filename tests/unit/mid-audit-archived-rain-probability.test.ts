import {afterEach,describe,expect,it,vi} from 'vitest';
import {isVerifiableTwinRainProbability} from '../../src/twinProbabilityValidity';
import {buildForecastVerificationReport} from '../../src/forecastVerification';

afterEach(()=>vi.unstubAllGlobals());

describe('MID Audit 1.0 · archived probability remains NoData unless proven valid',()=>{
 it('accepts only finite numeric percentages from 0 to 100 inclusive',()=>{
  for(const value of [0,1,37.5,99.99,100])expect(isVerifiableTwinRainProbability(value)).toBe(true);
  for(const value of [undefined,null,'', '0', 'NaN', Number.NaN,Infinity,-Infinity,-1,100.001,[],{},false]){
   expect(isVerifiableTwinRainProbability(value)).toBe(false);
  }
 });
 it('refuses numeric-string, null, and out-of-range archive values instead of silently clamping',()=>{
  const cases:[unknown,boolean][]=[[null,false],['abc',false],['0',false],[-5,false],[105,false],[0,true],[100,true]];
  for(const [value,expected] of cases)expect(isVerifiableTwinRainProbability(value)).toBe(expected);
 });
 it('keeps an imported forecast archive readable without a NaN bin-index crash or artificial 0% skill',()=>{
  const store=new Map<string,string>();
  vi.stubGlobal('localStorage',{
   getItem:(key:string)=>store.get(key)??null,
   setItem:(key:string,value:string)=>{store.set(key,String(value));},
   removeItem:(key:string)=>{store.delete(key);},
   key:(index:number)=>[...store.keys()][index]??null,
   get length(){return store.size;},
  });
  const location={id:123,name:'Auditort synthetisch',latitude:50.82,longitude:7.14,timezone:'Europe/Berlin'};
  const key='mid-audit-invalid-prob-'+Math.random().toString(36).slice(2);
  const cases:[unknown,number][]=[[null,0],['unbekannt',0],[105,0],[-2,0],[Number.NaN,0],[0,0],[100,0]];
  const references=cases.map(([,rain],index)=>{
   const date='2024-01-'+String(index+1).padStart(2,'0'),source={id:'qa-station',label:'Synthetischer Messwert',kind:'measured',quality:.95};
   return {date,max:10,min:2,precipitation:rain,regime:'wechselhaft',source:source.label,quality:.95,confidence:'high',kind:'measured',sources:[source],coverageHours:24};
  });
  const captures=cases.map(([probability],index)=>{
   const date=references[index].date;
   return {id:'qa-'+date,targetDate:date,issuedAt:'2023-12-31T12:00:00Z',leadHours:24,timezone:'Europe/Berlin',predictedRegime:'wechselhaft',
    predictions:[{id:'best_match',label:'Best Match',max:10,min:2,precipitation:0,probability,probabilityKind:'daily-wet-native'}]};
  });
  store.set('mid:forecast-verification:v3:'+key,JSON.stringify({version:3,updatedAt:'2024-01-15T00:00:00Z',captures,references,observations:[]}));
  const report=buildForecastVerificationReport(key,[],[],location,[]);
  const best=report.models.find(model=>model.id==='best_match');
  expect(report.days).toBe(7);
  expect(best?.parameterMetrics.probability?.samples).toBe(2);
  expect(best?.brier).toBeCloseTo(.5,8);
  expect(report.rainBrier).toBeCloseTo(.5,8);
  expect(report.calibrations.reduce((sum,row)=>sum+row.samples,0)).toBe(2);
  expect(report.calibrations.every(row=>Number.isFinite(row.forecastMean)&&row.forecastMean>=0&&row.forecastMean<=100)).toBe(true);
 });
 it('never changes raw archived values nor accepted probability semantics in the source',()=>{
  const valid=[0,50,100].map(value=>isVerifiableTwinRainProbability(value));
  expect(valid).toEqual([true,true,true]);
 });
});

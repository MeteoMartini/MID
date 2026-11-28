import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {localBackgroundNumber,localBackgroundDeparture,decodeHyperlocalBackgroundRows,decodeHyperlocalBackgroundCache} from '../../src/weather';

const now=Date.UTC(2026,10,28,12),key='model|target|station',ttl=30*60000;
const target={current:{temperature_2m:0,relative_humidity_2m:null,precipitation:0,wind_direction_10m:0,cloud_cover:false,is_day:0,pressure_msl:1013}};
const station={current:{temperature_2m:-5,precipitation:null}};
const rows=decodeHyperlocalBackgroundRows([target,station],2)!;
const record=JSON.parse(JSON.stringify({at:now-1000,sourceKey:key,value:{modelId:'test',modelLabel:'Test',rows}}));
const cache=(r:unknown=record,k=key,n=2,age=ttl,t=now)=>decodeHyperlocalBackgroundCache(r,k,n,age,t);
const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');

describe('hyperlocal background NoData and cache migration (#1045)',()=>{
 it.each([null,undefined,'',' ','0',false,true,[],{},NaN,Infinity,-Infinity])('rejects invalid provider scalar %s',value=>{
  expect(localBackgroundNumber(value)).toBeUndefined();
 });
 it.each([0,-5,1.25,1013,360])('keeps finite numeric scalar %s',value=>expect(localBackgroundNumber(value)).toBe(value));
 it.each([[10,10,0],[0,2,-2],[2,0,2],[null,0,NaN],[0,null,NaN],[undefined,5,NaN],[5,NaN,NaN]])('requires both valid residual operands (%s, %s)',(a,b,expected)=>{
  expect(localBackgroundDeparture(a,b)).toBe(expected);
 });
 it('keeps genuine zeros and partial fields independently, without a fabricated temperature or precipitation',()=>{
  expect(rows[0]).toMatchObject({temperature:0,precipitation:0,windDirection:0,isDay:0,pressure:1013});
  expect(rows[0].humidity).toBeUndefined();expect(rows[0].cloudCover).toBeUndefined();
  expect(rows[1].temperature).toBe(-5);expect(rows[1].precipitation).toBeUndefined();
  expect(decodeHyperlocalBackgroundRows(target,1)).toHaveLength(1);
 });
 it.each([[[target],2],[[target,target],1],[[target,null],2],[[target,{}],2],[[target,{current:[]}],2],[[target,{current:null}],2],[[],0]] as const)('rejects malformed or mis-sized batch %#',(raw,count)=>expect(decodeHyperlocalBackgroundRows(raw,count)).toBeUndefined());
 it('round-trips valid v2 data and accepts the exact TTL boundary',()=>{
  expect(cache()?.value.rows[0].precipitation).toBe(0);
  expect(cache()?.value.rows[0].humidity).toBeUndefined();
  expect(cache({...record,at:now-ttl})).toBeDefined();
 });
 it.each([{...record,at:null},{...record,at:String(now-1000)},{...record,at:now+1},{...record,at:now-ttl-1},{...record,sourceKey:'other'},{...record,value:{...record.value,rows:[{}]}},{...record,value:{...record.value,rows:[{},null]}},{...record,value:{...record.value,rows:[{precipitation:null},{}]}},{...record,value:{...record.value,rows:[{temperature:'0'},{}]}},{...record,value:{...record.value,rows:[{windDirection:false},{}]}},{...record,value:{...record.value,modelId:''}},{...record,value:{...record.value,modelLabel:null}}])('rejects invalid persisted evidence %#',value=>expect(cache(value)).toBeUndefined());
 it('keeps legacy cache only in bounded eviction, not on the read path; protects scalar and circular residuals',()=>{
  const source=read('src/weather-src/10-observations-specialized.tsfrag');
  expect(source).toContain("const LOCAL_BACKGROUND_STORAGE_PREFIX='mid:hyperlocal-background:v2:'");
  expect(source).toContain("const LOCAL_BACKGROUND_LEGACY_PREFIX='mid:hyperlocal-background:v1:'");
  expect(source).toContain('[LOCAL_BACKGROUND_STORAGE_PREFIX,LOCAL_BACKGROUND_LEGACY_PREFIX],16,LOCAL_BACKGROUND_STALE_MS');
  expect(source).toContain('localBackgroundStorageKey(key))');
  expect(source).toContain('residual:localBackgroundDeparture(observed,base)');
  expect(source).toContain('localBackgroundNumber(target[bgKey])===undefined');
  expect(source).toContain('targetDirection=localBackgroundNumber(target.windDirection)??Number.NaN');
  expect(source).toContain('observed=stationObservationNumber(station.windDirection)');
  expect(source).toContain('stored=readStoredLocalBackground(key,Math.min(points.length,18))');
  const fragments=['00-types-models-search.tsfrag','10-observations-specialized.tsfrag','20-mapping-day-character.tsfrag','30-ensemble-climate-hazards.tsfrag'];
  expect(read('src/weather.ts')).toBe(fragments.map(p=>read('src/weather-src/'+p)).join(''));
 });
});

import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {altitudeCorrectedUvi,dayEffectiveUvMax,knownOriginalUvi,mapHours,type Day,type Hour,type Weather} from '../../src/weather';

const repoUrl=new URL('../../',import.meta.url);
const mapping=readFileSync(new URL('src/weather-src/20-mapping-day-character.tsfrag',repoUrl),'utf8');
const companion=readFileSync(new URL('src/weather-src/10-observations-specialized.tsfrag',repoUrl),'utf8');
const mirror=readFileSync(new URL('src/weather.ts',repoUrl),'utf8');

function fixture(uv:(number|null)[]):Weather {
 const times=['2026-06-21T22:00','2026-06-21T23:00','2026-06-22T00:00'];
 const all=(value:number)=>times.map(()=>value);
 return {
  latitude:50.98,longitude:7.05,elevation:50,timezone:'Europe/Berlin',utc_offset_seconds:7200,
  current:{},
  hourly:{
   time:times,is_day:all(0),weather_code:all(1),temperature_2m:all(17),
   dew_point_2m:all(10),cloud_cover:all(15),relative_humidity_2m:all(70),
   wind_speed_10m:all(10),wind_gusts_10m:all(14),apparent_temperature:all(16),
   wind_direction_10m:all(180),precipitation:all(0),rain:all(0),showers:all(0),
   snowfall:all(0),precipitation_probability:all(0),uv_index:uv
  },
  daily:{}
 } as Weather;
}

describe('MID Audit 1.4 · original UVI end-of-hour and NoData (QA-only)',()=>{
 it('accepts original finite zero as true zero and positive extremes without arbitrary clipping',()=>{
  expect(knownOriginalUvi(0)).toBe(0);
  expect(knownOriginalUvi(1.2)).toBe(1.2);
  expect(knownOriginalUvi(19)).toBe(19);
  expect(altitudeCorrectedUvi(knownOriginalUvi(2.4),50)).toBe(2.4);
 });
 it('rejects absent, nonsensical and coerced provider observations',()=>{
  for(const value of [null,undefined,NaN,Infinity,-Infinity,-999,-0.1,'0','3.1',{},true]){
   expect(knownOriginalUvi(value)).toBeNaN();
  }
 });
 it('retains a positive preceding-hour mean even when the end stamp is after sunset',()=>{
  const hours=mapHours(fixture([0.8,0,1.3]));
  expect(hours).toHaveLength(3);
  expect(hours[0].isDay).toBe(false);
  expect(hours[0].uvIndex).toBe(0.8);
  expect(hours[1].uvIndex).toBe(0);
  expect(hours[2].uvIndex).toBe(1.3);
 });
 it('keeps unknown hourly UVI unknown and uses the provider apparent fallback, not invented UTCI UV=0',()=>{
  const hours=mapHours(fixture([null,0,1.3]));
  expect(hours[0].uvIndex).toBeNaN();
  expect(hours[0].apparentKind).toBe('provider-fallback');
  expect(hours[0].apparent).toBe(16);
  expect(hours[1].uvIndex).toBe(0);
 });
 it('never synthesizes a zero maximum from missing hourly and daily observations',()=>{
  const day={uvMax:NaN} as Day;
  expect(dayEffectiveUvMax(day,[])).toBeNaN();
  expect(dayEffectiveUvMax({...day,uvMax:-999},[])).toBeNaN();
  expect(dayEffectiveUvMax({...day,uvMax:0},[])).toBe(0);
  expect(dayEffectiveUvMax(day,[{uvIndex:NaN},{uvIndex:0},{uvIndex:8}] as Hour[])).toBe(8);
  expect(dayEffectiveUvMax(day,[{uvIndex:-999}] as Hour[])).toBeNaN();
 });
 it('keeps canonical source and both checked-in weather-source fragments in lockstep',()=>{
  for(const snippet of [
   "export function knownOriginalUvi(value:unknown){return typeof value==='number'&&Number.isFinite(value)&&value>=0?value:NaN}",
   'uvIndex=knownOriginalUvi(w.hourly.uv_index?.[i])',
   'displayUv=altitudeCorrectedUvi(uvIndex,w.elevation)',
   'utci=Number.isFinite(displayUv)?utciFromOutdoorState(',
   'uvMax:altitudeCorrectedUvi(knownOriginalUvi(w.daily.uv_index_max?.[i]),w.elevation)'
  ]){expect(mapping).toContain(snippet);expect(mirror).toContain(snippet);}
  expect(mapping).not.toContain('displayUv=Number.isFinite(uvIndex)&&isDay?');
  expect(mapping).not.toContain('uvMax:altitudeCorrectedUvi(n(w.daily.uv_index_max[i],0)');
  const helper="return vals.length?Math.max(...vals):(Number.isFinite(day.uvMax)&&day.uvMax>=0?Number(day.uvMax):NaN)";
  expect(companion).toContain(helper);expect(mirror).toContain(helper);
 });
});

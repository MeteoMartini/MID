import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {AIR_QUALITY_SOURCE_SCHEMA,airQualityObservationEvidence as obs,airQualityModelCurrent as model,airQualityModelTimeLabel as time,nonnegativeAqiNumber as num} from '../../src/airQualitySourceEvidence';
import {describeEuropeanAqiModel as describeModel} from '../../src/airQuality';
const now=Date.parse('2026-11-26T14:00:00Z');
const raw={available:true,observation:true,provider:'UBA',station:{name:'Station A'},preliminary:true,observedAt:'2026-11-26T13:00:00Z',current:{pm2_5:0,pm10:80,ozone:null,european_aqi:3}};
const invalid=[null,undefined,'',' ',false,true,[],{},-1,NaN,Infinity,'0x10'];
describe('AQI source evidence — model and measurement never merged',()=>{
 it('does not coerce missing values; retains zero and extremes',()=>{for(const value of invalid)expect(num(value)).toBeNull();expect(num(0)).toBe(0);expect(num(' 2.5 ')).toBe(2.5);expect(num(10000)).toBe(10000)});
 it('only admits supported observation concentrations, never station AQI',()=>expect(obs(raw,now)?.current).toEqual({pm2_5:0,pm10:80}));
 it('requires both admission flags',()=>{expect(obs({...raw,observation:false},now)).toBeUndefined();expect(obs({...raw,available:false},now)).toBeUndefined()});
 it('requires a valid absolute timestamp and bounded age',()=>{for(const observedAt of ['2026-11-26T10:59:59Z','2026-11-26T14:21:00Z','2026-11-26T13:00:00'])expect(obs({...raw,observedAt},now)).toBeUndefined();expect(obs({...raw,observedAt:'2026-11-26T14:00:00+01:00'},now)?.observedAt).toBe('2026-11-26T13:00:00.000Z');expect(obs({...raw,observedAt:'2026-02-31T12:00:00Z'},Date.parse('2026-03-03T13:00:00Z'))).toBeUndefined()});
 it('refuses all-missing station data and revalidates stored evidence',()=>{expect(obs({...raw,current:{pm2_5:null,pm10:false}},now)).toBeUndefined();expect(obs(obs(raw,now),now)?.current).toEqual({pm2_5:0,pm10:80})});
 it('quarantines legacy mixed caches without discarding model-only data',()=>{expect(model({current:{pm2_5:1},_mid_air_quality:{observation:true}})).toBeUndefined();expect(model({current:{pm2_5:1}})).toEqual({pm2_5:1})});
 it('preserves the original current record with new source schema',()=>{const current={pm2_5:100,european_aqi:99,uv_index:0};expect(model({current,_mid_air_quality_source_schema:AIR_QUALITY_SOURCE_SCHEMA,_mid_air_quality:obs(raw,now)})).toBe(current)});
 it('displays the actual fixed response offset; never invents a zone or day',()=>{expect(time({current:{time:'2026-11-26T15:00'},utc_offset_seconds:3600})).toBe('2026-11-26 15:00 · UTC+01:00');expect(time({current:{time:'2026-11-26T15:00'}})).toBeUndefined();expect(time({current:{time:'2026-02-31T12:00'},utc_offset_seconds:0})).toBeUndefined()});
});
describe('AQI model display admission',()=>{
 it('does not advertise a good overall category from partial concentration data',()=>{const r=describeModel({pm2_5:0});expect(r.coverage).toBe(1);expect(r.band).toBeNull()});
 it('admits valid provider index without fabricated concentration values',()=>{const r=describeModel({european_aqi:80});expect(r.coverage).toBe(0);expect(r.result).toBeNull();expect(r.band?.key).toBe('poor');expect(r.derived).toBe(false)});
 it('retains provider category with transparent partial coverage',()=>{const r=describeModel({european_aqi:20,pm2_5:2});expect(r.coverage).toBe(1);expect(r.band?.key).toBe('good')});
 it('withholds authoritative colour for an incompatible native subindex',()=>{const r=describeModel({european_aqi:10,european_aqi_pm2_5:100});expect(r.inconsistent).toBe(true);expect(r.band).toBeNull();expect(r.providerBand?.key).toBe('good')});
 it('detects an overall category above all five native component bands',()=>{const r=describeModel({european_aqi:80,european_aqi_pm2_5:0,european_aqi_pm10:0,european_aqi_nitrogen_dioxide:0,european_aqi_ozone:0,european_aqi_sulphur_dioxide:0});expect(r.inconsistent).toBe(true);expect(r.band).toBeNull()});
 it('derives only with all five concentrations, and labels derivation',()=>{const r=describeModel({pm2_5:95,pm10:0,nitrogen_dioxide:0,ozone:0,sulphur_dioxide:0});expect(r.coverage).toBe(5);expect(r.derived).toBe(true);expect(r.band?.key).toBe('very-poor')});
 it('does not flag unverified concentration-derived bands as provider contradictions',()=>expect(describeModel({pm2_5:145,european_aqi:20}).inconsistent).toBe(false));
});
describe('exact UBA worker number parser and source wiring',()=>{
 const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
 it('parses the actual canonical worker function with strict invalid/zero/extreme admission',()=>{
  const text=read('worker-src/20-composite-models.js'),match=text.match(/^function airQualityValue[^\n]+$/m);expect(match).not.toBeNull();
  const fn=runInNewContext(match![0]+';airQualityValue') as (r:Record<string,unknown>,...keys:string[])=>number|undefined;
  for(const value of invalid)expect(fn({pm:value},'pm')).toBeUndefined();
  expect(fn({pm:0},'pm')).toBe(0);expect(fn({pm:'2.5'},'pm')).toBe(2.5);expect(fn({pm:10000},'pm')).toBe(10000);expect(fn({pm:false,PM:7},'pm','PM')).toBe(7);
  for(const path of ['worker.js','worker/metar-proxy.js'])expect(read(path)).toContain(match![0]);
 });
 it('keeps canonical weather aggregate and app provenance wiring aligned',()=>{
  const weather=read('src/weather.ts'),fragment=read('src/weather-src/00-types-models-search.tsfrag'),app=read('src/App.tsx');
  expect(weather.startsWith(fragment)).toBe(true);
  expect(fragment).not.toContain('...observed.current');
  expect(fragment).toContain('value._mid_air_quality=airQualityObservationEvidence(observed)');
  expect(fragment).toContain("AIR_QUALITY_CACHE_PREFIX='mid:air-quality:v2:'");
  expect(app).toContain('describeEuropeanAqiModel(airQualityModelCurrent(air))');
  expect(app).toContain('Kein gemeinsamer Index mit CAMS.');
  expect(app).toContain('CAMS-Modell · ${airModel.coverage}/5 Stoffe'.replace('\\$','$'));
 });
});

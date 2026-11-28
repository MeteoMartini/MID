import {describe,expect,it} from 'vitest';
import {europeanAqiBandFromIndex as idx,classifyEuropeanAqiPollutant as classify,classifyEuropeanAirQuality as overall,describeEuropeanAqiPollutantScale as scale,EUROPEAN_AQI_POLLUTANTS as defs} from '../../src/airQuality';

const invalid=[null,undefined,'',' ','\t',false,true,[],{},NaN,Infinity,-1,'0x10','NaN','Infinity'];
describe('Audit 1.5 / Audit 16: revised European AQI and no-data admission',()=>{
 it('rejects invalid index instead of false Good',()=>invalid.forEach(x=>expect(idx(x)).toBeNull()));
 it('rejects invalid concentration instead of fake zero',()=>invalid.forEach(x=>expect(classify('pm2_5',x)).toBeNull()));
 it('rejects scales for invalid concentrations',()=>invalid.forEach(x=>expect(scale('pm2_5',x)).toBeNull()));
 it('preserves genuine zero and decimal strings',()=>[0,'0',' 0.0 '].forEach(x=>{expect(idx(x)?.key).toBe('good');expect(classify('pm2_5',x)?.value).toBe(0)}));
 it('does not present an all-null payload as good',()=>expect(overall({pm2_5:null,pm10:null,nitrogen_dioxide:null,ozone:null,sulphur_dioxide:null,european_aqi:null})).toBeNull());
 it('does not overwrite severe component with a missing overall',()=>expect(overall({pm2_5:145,european_aqi:null})?.band.key).toBe('extremely-poor'));
 it('uses concentration classification when individual index is missing',()=>{const r=overall({pm2_5:95,european_aqi_pm2_5:null});expect(r?.dominant.band.key).toBe('very-poor');expect(r?.dominant.aqi).toBeUndefined()});
 it('preserves genuine zero index',()=>{const r=overall({pm2_5:3,european_aqi_pm2_5:0,european_aqi:0});expect(r?.dominant.aqi).toBe(0);expect(r?.band.key).toBe('good')});
 it('retains valid pollutants without fabricating missing components',()=>{const r=overall({pm2_5:null,pm10:0});expect(r?.pollutants).toHaveLength(1);expect(r?.dominant.key).toBe('pm10');expect(r?.dominant.value).toBe(0)});
 it('uses all five revised 2024 pollutant threshold tables',()=>expect(defs.map(x=>x.thresholds)).toEqual([[5,15,50,90,140],[15,45,120,195,270],[10,25,60,100,150],[60,100,120,160,180],[20,40,125,190,275]]));
 it('covers the exact and just-above boundary of each threshold',()=>{for(const d of defs)d.thresholds.forEach((x,i)=>{expect(classify(d.key,x)?.band.index).toBe(i);expect(classify(d.key,x+0.001)?.band.index).toBe(i+1)})});
 it('does not cap AQI above 100 or concentration extremes',()=>{expect(idx(220)?.key).toBe('extremely-poor');expect(classify('pm10',10000)?.value).toBe(10000)});
 it('uses concentration marker when supplied index is missing',()=>{const a=scale('pm2_5',95,null);expect(a?.positionPct).toBeGreaterThanOrEqual(4/6*100);expect(a).toEqual(scale('pm2_5',95))});
 it('distinguishes genuine zero index in marker position',()=>expect(scale('pm2_5',5,0)?.positionPct).toBe(0));
});

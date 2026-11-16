import {describe,expect,it} from 'vitest';
import {climateFiniteNumber,climateWindDisplayMode,climateWindSample} from '../../src/climateWindRosePresentation';

describe('MID #508 climate windrose: preferences + original NoData',()=>{
 it('retains preference while gusts disappear and restores it without any storage write',()=>{
  const preference='gust' as const;
  expect(climateWindDisplayMode(preference,true)).toBe('gust');
  expect(climateWindDisplayMode(preference,false)).toBe('wind');
  expect(climateWindDisplayMode(preference,true)).toBe('gust');
  expect(preference).toBe('gust');
  expect(climateWindDisplayMode('wind',true)).toBe('wind');
 });
 it('does not coerce missing, invalid or non-numeric values into meteorological zero',()=>{
  for(const raw of [undefined,null,'','0',false,NaN,Infinity,-Infinity,{}]){
   expect(Number.isNaN(climateFiniteNumber(raw))).toBe(true);
  }
  expect(climateFiniteNumber(0)).toBe(0);
  expect(climateFiniteNumber(9.75)).toBe(9.75);
 });
 it('rejects gust data without a real paired direction and preserves valid zero',()=>{
  for(const raw of [undefined,null,'',NaN,Infinity]){
   expect(climateWindSample({windDirection:45,gustMaxMean:raw as number},'gust')).toBeNull();
  }
  expect(climateWindSample({windDirection:null,gustMaxMean:22},'gust')).toBeNull();
  expect(climateWindSample({windDirection:0,gustMaxMean:0},'gust')).toEqual({direction:0,speed:0});
  expect(climateWindSample({windDirection:360,gustMaxMean:28},'gust')).toEqual({direction:0,speed:28});
  expect(climateWindSample({windDirection:-1,gustMaxMean:28},'gust')).toBeNull();
  expect(climateWindSample({windDirection:361,gustMaxMean:28},'gust')).toBeNull();
  expect(climateWindSample({windDirection:90,gustMaxMean:-3},'gust')).toBeNull();
 });
 it('honors original wind mean and valid max fallback without inventing a zero',()=>{
  expect(climateWindSample({windDirection:270,windMean:0,windMaxMean:9},'wind')).toEqual({direction:270,speed:0});
  expect(climateWindSample({windDirection:180,windMean:null,windMaxMean:11},'wind')).toEqual({direction:180,speed:11});
  expect(climateWindSample({windDirection:180,windMean:null,windMaxMean:null},'wind')).toBeNull();
  expect(climateWindSample({windDirection:180,windMean:undefined,windMaxMean:undefined},'wind')).toBeNull();
  expect(climateWindSample({windDirection:180,windMean:9,gustMaxMean:null},'gust')).toBeNull();
 });
});

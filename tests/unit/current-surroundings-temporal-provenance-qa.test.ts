import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {currentSurroundingsTemperature,type SurroundingsTemperatureRequest} from '../../src/surroundingsTemperatureDisplay';
import type {SurroundingsTemperatureSnapshot} from '../../src/currentSurroundingsTemperature';

const t0=Date.parse('2026-11-15T12:00:00Z');
const keyA='city:50.00000:7.00000|site:50.10000:7.10000';
const keyB='city:50.00000:7.00000|site:50.10001:7.10000';
const original:SurroundingsTemperatureSnapshot={
 source:'Open-Meteo',modelLabel:'Best Match',
 validTime:t0,checkedAt:t0+60_000,values:{'city':0,'site':-3.5},
 available:2,requested:2,temporalMethod:'original'
};
const state=(targetTime=t0,placesKey=keyA,interpolate=false,snapshot:SurroundingsTemperatureSnapshot|undefined=original):
 SurroundingsTemperatureRequest=>({targetTime,placesKey,interpolate,snapshot});

describe('MID Umfeld-Wetter: Temperaturwerte dürfen nicht über Zieltermine wandern',()=>{
 it('preserves a genuinely current zero and native provider provenance',()=>{
  const result=currentSurroundingsTemperature(state(),t0,keyA,false);
  expect(result).toBe(original);
  expect(result?.values.city).toBe(0);
  expect(result?.modelLabel).toBe('Best Match');
  expect(result?.validTime).toBe(t0);
 });
 it('never presents the previous quarter-hour after fast slider movement',()=>{
  // Two distinct requests can use the SAME nearest original hourly validTime.
  const previous=state(t0,keyA,false);
  expect(currentSurroundingsTemperature(previous,t0+15*60_000,keyA,false)).toBeUndefined();
  expect(currentSurroundingsTemperature(previous,t0+30*60_000,keyA,false)).toBeUndefined();
  const next=state(t0+15*60_000,keyA,false,original);
  expect(currentSurroundingsTemperature(next,t0+15*60_000,keyA,false)).toBe(original);
 });
 it('does not leak a site or model method across location, source or mode switches',()=>{
  expect(currentSurroundingsTemperature(state(),t0,keyB,false)).toBeUndefined();
  expect(currentSurroundingsTemperature(state(),t0,keyA,true)).toBeUndefined();
  const interpolated:SurroundingsTemperatureSnapshot={
   ...original,validTime:t0+15*60_000,temporalMethod:'linear',
   sourceTimes:[t0,t0+60*60_000]
  };
  const next=state(t0+15*60_000,keyA,true,interpolated);
  expect(currentSurroundingsTemperature(next,t0+15*60_000,keyA,true)?.temporalMethod).toBe('linear');
  expect(currentSurroundingsTemperature(next,t0+15*60_000,keyA,false)).toBeUndefined();
 });
 it('retains NoData on a failed request, missing context or invalid UTC target',()=>{
  expect(currentSurroundingsTemperature({...state(),snapshot:undefined},t0,keyA,false)).toBeUndefined();
  expect(currentSurroundingsTemperature(undefined,t0,keyA,false)).toBeUndefined();
  expect(currentSurroundingsTemperature(state(),NaN,keyA,false)).toBeUndefined();
  expect(currentSurroundingsTemperature(state(),t0,'',false)).toBeUndefined();
 });
 it('the real surroundings UI gates markers, site and provenance on the same request identity',()=>{
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  const helper=readFileSync('src/surroundingsTemperatureDisplay.ts','utf8');
  expect(ui).toContain('temperaturePlacesKey=useMemo(');
  expect(ui).toContain('const requested={targetTime:temperatureTarget,placesKey:temperaturePlacesKey,interpolate:temperatureInterpolate}');
  expect(ui).toContain('currentSurroundingsTemperature(temperatureRequest,temperatureTarget,temperaturePlacesKey,temperatureInterpolate)');
  expect(ui).toContain('const temperatures=temperatureGrid?.values;');
  expect(ui).toContain('temperatures?.[place.id]');
  expect(ui).toContain('temperatures?.[siteId]');
  expect(ui).toContain('temperatureGrid.validTime');
  expect(helper).toContain('state.targetTime!==targetTime');
  expect(helper).toContain('state.placesKey!==placesKey');
  expect(helper).toContain('state.interpolate!==interpolate');
  expect(ui).toContain('controller.abort()');
  expect(ui).toContain('aria-label="Wolkenprognosezeit wählen"');
  expect(ui).toContain('aria-valuetext={');
  expect(ui).toContain('Letzter Viertelstundentermin');
  expect(ui).not.toContain('aria-label={`Wolkenprognose:');
 });
});

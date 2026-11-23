import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {interpretSurroundingsMap} from '../../src/surroundingsMapInterpretation';

const time=Date.parse('2026-11-23T12:15:00Z');
const dwd={source:'dwd' as const,kind:'Beobachtung' as const,time,coverage:'unknown' as const};
const opera={source:'opera' as const,kind:'Beobachtung' as const,time,coverage:'partial' as const};

describe('MID PDF audit: bounded and honestly sourced surroundings interpretation',()=>{
 it('appears in the actual map UI, without new network reads or live-region spam',()=>{
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).toContain("import {interpretSurroundingsMap} from './surroundingsMapInterpretation';");
  expect(ui).toContain('const mapInterpretation=interpretSurroundingsMap(');
  expect(ui).toContain('satelliteTime:visibleClouds?satelliteTime:undefined');
  expect(ui).toContain('role="note" aria-label="Einordnung des Wetterbilds"');
 });
 it('calls a model cloud visualization a model, not a satellite measurement',()=>{
  expect(interpretSurroundingsMap({mode:'cloud',cloudOriginalAvailable:true})).toMatch(/keine Satellitenbeobachtung/);
  expect(interpretSurroundingsMap({mode:'cloud',cloudOriginalAvailable:false})).toBeNull();
 });
 it('suppresses claims on absent, nonfinite or unadmitted evidence',()=>{
  expect(interpretSurroundingsMap({mode:'radar'})).toBeNull();
  expect(interpretSurroundingsMap({mode:'radar',radar:{...dwd,time:NaN},satelliteTime:NaN})).toBeNull();
 });
 it('separates decoded DWD WMS geometry from meteorological coverage',()=>{
  const reading=interpretSurroundingsMap({mode:'radar',radar:dwd})!;
  expect(reading).toMatch(/Pixelabdeckung ist nicht bestätigt/);
  expect(reading).toMatch(/kein sicherer Nachweis/);
  expect(reading).not.toContain('km/h');
 });
 it('preserves OPERA partial NoData and never claims dry weather',()=>{
  expect(interpretSurroundingsMap({mode:'radar',radar:opera})).toMatch(/NoData, nicht trocken/);
  expect(interpretSurroundingsMap({mode:'radar',radar:{...opera,coverage:'complete'}})).not.toMatch(/NoData/);
 });
 it('labels future radar frames as unverified extrapolation, never an observation or exact ETA',()=>{
  expect(interpretSurroundingsMap({mode:'radar',radar:{...dwd,kind:'Nowcast'}})).toMatch(/Fortschreibung, keine Messung/);
  expect(interpretSurroundingsMap({mode:'radar',radar:{...dwd,kind:'Nowcast'}})).toMatch(/Ankunftszeit.*nicht verifiziert/);
 });
 it('uses only independent, real timestamps when qualifying radar/satellite coherence',()=>{
  expect(interpretSurroundingsMap({mode:'radar',radar:dwd,satelliteTime:time-15*60_000})).toMatch(/rund 15 Min/);
  expect(interpretSurroundingsMap({mode:'radar',radar:dwd,satelliteTime:time})).toMatch(/unabhängige Beobachtungsquellen/);
  expect(interpretSurroundingsMap({mode:'radar',satelliteTime:time})).toMatch(/Satellitenbild allein/);
  expect(interpretSurroundingsMap({mode:'radar',radar:dwd,satelliteTime:NaN})).not.toMatch(/Satellitenbild/);
 });
 it('attributes derived phase to MID rather than the warning authority',()=>{
  expect(interpretSurroundingsMap({mode:'radar',radar:opera,phaseAvailable:true})).toMatch(/keine amtliche Warnung/);
  expect(interpretSurroundingsMap({mode:'radar',radar:dwd,phaseAvailable:true})).not.toMatch(/amtliche Warnung/);
 });
});

import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {
 radarOriginalForStep,nearestVerifiedOriginal,sourceOriginalTimes,
 surroundingsRadarTarget,SURROUNDINGS_RADAR_MIN_STEP,SURROUNDINGS_RADAR_MAX_STEP
} from '../../src/surroundingsRadarTimeline';

const now=Date.parse('2026-11-15T12:07:00Z');
const observed=new Date(now-5*60000).toISOString(),future=new Date(now+15*60000).toISOString();
const catalog={dwdRadar:[observed],dwdRadarNowcast:[future]};

describe('Umfeld Rad/Sat: 15-min selector uses only admitted ORIGINAL source timestamps',()=>{
 it('moves in exactly 15-minute steps relative to the real clock, including UTC DST',()=>{
  expect(SURROUNDINGS_RADAR_MIN_STEP).toBe(-3);
  expect(SURROUNDINGS_RADAR_MAX_STEP).toBe(8);
  expect(surroundingsRadarTarget(now,1)-surroundingsRadarTarget(now,0)).toBe(900000);
  expect(surroundingsRadarTarget(now,-1)-surroundingsRadarTarget(now,0)).toBe(-900000);
  expect(surroundingsRadarTarget(Date.parse('2026-10-25T01:55:00Z'),1)).toBe(Date.parse('2026-10-25T02:10:00Z'));
  for(const step of [-4,9,NaN,1.2])expect(Number.isNaN(surroundingsRadarTarget(now,step))).toBe(true);
 });
 it('selects true recent radar observations and independent nowcast, never invents frames',()=>{
  expect(radarOriginalForStep(catalog,now,0)).toEqual({time:now-5*60000,kind:'Beobachtung'});
  expect(radarOriginalForStep(catalog,now,1)).toEqual({time:now+15*60000,kind:'Nowcast'});
  expect(radarOriginalForStep(catalog,now,2)).toBeUndefined();
  expect(radarOriginalForStep(catalog,now,-1)).toBeUndefined();
  expect(radarOriginalForStep(catalog,now,1,false)).toBeUndefined();
  expect(radarOriginalForStep(undefined,now,1)).toBeUndefined();
 });
 it('rejects missing/foreign original, time outside tolerance and future observations',()=>{
  expect(nearestVerifiedOriginal([now-9*60000],now,now)).toBeUndefined();
  expect(nearestVerifiedOriginal([now+3*60000],now,now)).toBeUndefined();
  expect(nearestVerifiedOriginal([now-2*60000],now,now)).toBe(now-2*60000);
  expect(nearestVerifiedOriginal([now-2*60000],now+15*60000,now,true)).toBeUndefined();
  expect(nearestVerifiedOriginal([now+15*60000],now+15*60000,now,true)).toBe(now+15*60000);
 });
 it('normalises original source times in seconds/milliseconds/ISO, without rounding validity',()=>{
  const input=[new Date(now-5*60000).toISOString(),(now-5*60000)/1000,now-5*60000,'not-a-time'];
  expect(sourceOriginalTimes(input)).toEqual([now-5*60000]);
 });
 it('UI persists mode; both modes display +/-15 and only exact WMS source files',()=>{
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).toContain("useDisplayPreference('CurrentSurroundings.mode','cloud',displayChoice('cloud','radar'))");
  expect(ui).toContain("mode==='radar'&&<>");
  expect(ui).toContain('Radar und Satellit 15 Minuten zurück');
  expect(ui).toContain('Radar und Satellit 15 Minuten vor');
  expect(ui).toContain('onChange={event=>setRadarStep(');
  expect(ui).toContain('radarOriginalForStep(catalog,now,radarStep,dwdArea)');
  expect(ui).toContain("radarStep>0?undefined:nearestVerifiedOriginal(satellite?.times,radarTarget,now)");
  expect(ui).toContain('loaded.time===target');
  expect(ui).toContain('displayedOpera=needsOpera');
  expect(ui).not.toContain('Radar-Nowcast-Termin');
 });
 it('Cloud/SigWx runtime never constructs a pseudo 15-minute interpolated image',()=>{
  const cloud=readFileSync('src/currentSurroundingsCloudImage.ts','utf8');
  const loader=cloud.slice(cloud.indexOf('export async function loadVerifiedSurroundingsCloud('),cloud.indexOf('export function useSurroundingsCloudImage('));
  expect(loader).toContain('if(Date.parse(ref.time)!==now)continue;');
  expect(loader).toContain('Date.parse(ref.time)===now&&weatherRefs.some(');
  expect(loader).not.toContain('interpolateVerifiedSurroundingsCloud(');
  expect(loader).not.toContain('const blend=');
  expect(cloud).toContain('previous.image&&Date.parse(previous.image.validTime)===target');
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).not.toContain("cloudForecast.image.temporalMethod==='cloud-linear'");
 });
});

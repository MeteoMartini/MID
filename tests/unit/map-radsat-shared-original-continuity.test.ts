import {describe,expect,it} from 'vitest';
import {buildAvailableCompositeTimeline,retainLoadedRadarStand} from '../../src/CompositeTimeline';

describe('MID shared map/surroundings original-radar continuity',()=>{
 const now=Date.parse('2026-11-17T07:00:00Z')/1000;
 const observation=now-300,nowcast=now+300;
 it('keeps last observed 5-minute source only while requested phase stays observed',()=>{
  expect(retainLoadedRadarStand(observation,now,now)).toBe(true);
  expect(retainLoadedRadarStand(observation,now,now-5*60)).toBe(true);
  expect(retainLoadedRadarStand(observation,now,now+60)).toBe(true);
  expect(retainLoadedRadarStand(observation,now,now+5*60)).toBe(false);
 });
 it('retains a fully loaded genuine nowcast within 15 minutes, not as observation',()=>{
  expect(retainLoadedRadarStand(nowcast,now,nowcast)).toBe(true);
  expect(retainLoadedRadarStand(nowcast,now,nowcast+10*60)).toBe(true);
  expect(retainLoadedRadarStand(nowcast,now,nowcast+16*60)).toBe(false);
  expect(retainLoadedRadarStand(nowcast,now,now)).toBe(false);
 });
 it('never bridges unrelated phase/source validity or distant history',()=>{
  expect(retainLoadedRadarStand(now-46*60,now,now-46*60)).toBe(false);
  expect(retainLoadedRadarStand(now+121*60,now,now+120*60)).toBe(false);
  expect(retainLoadedRadarStand(now+5*60,now,now+121*60)).toBe(false);
  expect(retainLoadedRadarStand(now-5*60,now,now+31*60)).toBe(false);
  expect(retainLoadedRadarStand(undefined,now)).toBe(false);
  expect(retainLoadedRadarStand(Number.NaN,now)).toBe(false);
  expect(retainLoadedRadarStand(nowcast,Number.POSITIVE_INFINITY,nowcast)).toBe(false);
  expect(retainLoadedRadarStand(nowcast,now,Number.NaN)).toBe(false);
 });
 it('preserves source-confirmed five-minute observations and nowcasts in map rail',()=>{
  const frames=buildAvailableCompositeTimeline(now,{
    source:'DWD',
    phaseSources:{observation:'DWD Radar · Beobachtung',nowcast:'DWD RV · Nowcast'},
    observations:[now-600,now-300],nowcasts:[now+300,now+600]
  });
  expect(frames.map(f=>f.time)).toEqual([now-600,now-300,now+300,now+600]);
  expect(frames.map(f=>f.phase)).toEqual(['observation','observation','nowcast','nowcast']);
  expect(frames.map(f=>f.source)).toEqual([
   'DWD Radar · Beobachtung','DWD Radar · Beobachtung','DWD RV · Nowcast','DWD RV · Nowcast'
  ]);
  expect(frames).not.toContainEqual(expect.objectContaining({time:now}));
 });
});

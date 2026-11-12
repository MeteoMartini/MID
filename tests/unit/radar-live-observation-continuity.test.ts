import {describe,expect,it} from 'vitest';
import {buildAvailableCompositeTimeline,preferLiveObservationIndex,retainLoadedRadarStand} from '../../src/CompositeTimeline';

describe('live radar and satellite continuity',()=>{
 const now=10_000;
 it('selects the latest actual observation even when a model shares its time',()=>{
  const observations=[now-600,now-300];
  const frames=buildAvailableCompositeTimeline(now,{source:'test',observations,forecasts:[now-300,now+600]});
  expect(frames[preferLiveObservationIndex(frames,observations,now)].time).toBe(now-300);
  expect(preferLiveObservationIndex(frames,[now+600,now-4600],now)).toBe(-1);
 });
 it('retains only a loaded observation close enough to both now and the selected time',()=>{
  expect(retainLoadedRadarStand(now-300,now)).toBe(true);
  expect(retainLoadedRadarStand(now-300,now,now+1800)).toBe(false);
  expect(retainLoadedRadarStand(now-2701,now,now-2701)).toBe(false);
  expect(retainLoadedRadarStand(now+120,now)).toBe(false);
  expect(retainLoadedRadarStand(undefined,now)).toBe(false);
 });
});

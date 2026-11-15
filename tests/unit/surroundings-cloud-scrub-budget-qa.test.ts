import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {deferSurroundingsCloudRead,SURROUNDINGS_CLOUD_SCRUB_SETTLE_MS} from '../../src/surroundingsCloudScheduler';

describe('MID Umfeld-PseudoSat: 15-minute timeline scrub request budgeting',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>{vi.clearAllTimers();vi.useRealTimers()});
 it('waits a bounded 150 ms before starting a SHA-bound raster read',()=>{
  const begin=vi.fn();
  const cancel=deferSurroundingsCloudRead(begin);
  expect(SURROUNDINGS_CLOUD_SCRUB_SETTLE_MS).toBe(150);
  vi.advanceTimersByTime(149);
  expect(begin).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(begin).toHaveBeenCalledTimes(1);
  cancel();
  vi.advanceTimersByTime(400);
  expect(begin).toHaveBeenCalledTimes(1);
 });
 it('rapid repeated time selections cancel all superseded network starts',()=>{
  const first=vi.fn(),second=vi.fn(),third=vi.fn();
  const cancelFirst=deferSurroundingsCloudRead(first);
  vi.advanceTimersByTime(50);
  cancelFirst();
  const cancelSecond=deferSurroundingsCloudRead(second);
  vi.advanceTimersByTime(50);
  cancelSecond();
  const cancelThird=deferSurroundingsCloudRead(third);
  vi.advanceTimersByTime(150);
  expect(first).not.toHaveBeenCalled();
  expect(second).not.toHaveBeenCalled();
  expect(third).toHaveBeenCalledTimes(1);
  cancelThird();
 });
 it('leaving the surroundings pane cancels even the first read',()=>{
  const begin=vi.fn();
  deferSurroundingsCloudRead(begin)();
  vi.advanceTimersByTime(400);
  expect(begin).not.toHaveBeenCalled();
 });
 it('real cloud hook defers the load, retains timeout/cancellation and never changes WMO fields',()=>{
  const hook=readFileSync('src/currentSurroundingsCloudImage.ts','utf8');
  expect(hook).toContain('const cancelPending=deferSurroundingsCloudRead(()=>{');
  expect(hook).toContain('if(controller.signal.aborted)return;');
  expect(hook).toContain('cancelPending();');
  expect(hook).toContain('controller.abort();');
  expect(hook).toContain('requestTimeout=window.setTimeout(()=>{');
  expect(hook).toContain('},18000);');
  expect(hook).toContain("cloudWeatherRaster(data,'pseudo')");
  expect(hook).toContain('nativeCloudWeatherPair(');
 });
});

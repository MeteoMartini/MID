import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {observeSurroundingsViewportRaster} from '../../src/surroundingsViewportObserver';
import type {SurroundingsGeoBounds,SurroundingsRasterPlan} from '../../src/surroundingsViewportRaster';

type EventName='moveend'|'resize';
const initial={west:5.7,south:50.17,east:8.5,north:51.47};
function fakeMap(){
 let bounds:SurroundingsGeoBounds={...initial};
 let dimensions={clientWidth:390,clientHeight:220};
 let throws=false;
 const listeners=new Map<EventName,Set<()=>void>>([
  ['moveend',new Set()],['resize',new Set()]
 ]);
 const map={
  getBounds(){if(throws)throw Error('context disposed');return{
   getWest:()=>bounds.west,getSouth:()=>bounds.south,
   getEast:()=>bounds.east,getNorth:()=>bounds.north
  }},
  getContainer(){return dimensions},
  on(event:EventName,callback:()=>void){listeners.get(event)!.add(callback);return map},
  off(event:EventName,callback:()=>void){listeners.get(event)!.delete(callback);return map}
 };
 return {
  map:map as unknown as Parameters<typeof observeSurroundingsViewportRaster>[0],
  trigger(event:EventName){for(const cb of listeners.get(event)!)cb()},
  setBounds(value:SurroundingsGeoBounds){bounds=value},
  setSize(width:number,height:number){dimensions={clientWidth:width,clientHeight:height}},
  setThrows(value:boolean){throws=value},
  count(event:EventName){return listeners.get(event)!.size}
 };
}

describe('MID #853: MapLibre visible viewport observer – QA-only',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>vi.useRealTimers());
 it('starts after fitBounds settles; coalesces MapLibre resize plus moveend into one request identity',()=>{
  const source=fakeMap(),values:(SurroundingsRasterPlan|undefined)[]=[];
  const stop=observeSurroundingsViewportRaster(source.map,p=>values.push(p));
  expect(values).toHaveLength(0);
  vi.advanceTimersByTime(160);
  expect(values).toHaveLength(1);
  const old=values[0]!.bbox;
  source.setSize(1024,285);
  source.setBounds({west:3.9,south:50.17,east:10.3,north:51.47});
  source.trigger('resize');
  vi.advanceTimersByTime(110);
  source.trigger('moveend');
  vi.advanceTimersByTime(159);
  expect(values).toHaveLength(1);
  vi.advanceTimersByTime(1);
  expect(values).toHaveLength(2);
  expect(values[1]!.bbox).not.toBe(old);
  expect(values[1]!.bounds.west).toBeLessThan(3.9);
  expect(values[1]!.bounds.east).toBeGreaterThan(10.3);
  stop();
 });
 it('does not request the same camera/source geometry twice',()=>{
  const source=fakeMap(),values:(SurroundingsRasterPlan|undefined)[]=[];
  const stop=observeSurroundingsViewportRaster(source.map,p=>values.push(p));
  vi.advanceTimersByTime(160);
  for(const event of ['resize','moveend','moveend','resize'] as const){source.trigger(event);vi.advanceTimersByTime(180)}
  expect(values).toHaveLength(1);
  stop();
 });
 it('clears an invalid or torn down camera rather than reusing an old footprint',()=>{
  const source=fakeMap(),values:(SurroundingsRasterPlan|undefined)[]=[];
  const stop=observeSurroundingsViewportRaster(source.map,p=>values.push(p));
  vi.advanceTimersByTime(160);
  expect(values.at(-1)).toBeDefined();
  source.setBounds({west:170,south:40,east:-170,north:41});
  source.trigger('moveend');vi.advanceTimersByTime(160);
  expect(values.at(-1)).toBeUndefined();
  source.setBounds({...initial});source.trigger('moveend');vi.advanceTimersByTime(160);
  expect(values.at(-1)).toBeDefined();
  source.setThrows(true);source.trigger('resize');vi.advanceTimersByTime(160);
  expect(values.at(-1)).toBeUndefined();
  stop();
 });
 it('removes both event listeners and pending timer on unmount; no cross-location callbacks',()=>{
  const source=fakeMap(),values:(SurroundingsRasterPlan|undefined)[]=[];
  const stop=observeSurroundingsViewportRaster(source.map,p=>values.push(p));
  expect(source.count('resize')).toBe(1);
  expect(source.count('moveend')).toBe(1);
  source.setBounds({west:5,south:50,east:9,north:51});
  source.trigger('resize');
  stop();stop();
  vi.advanceTimersByTime(10000);
  expect(values).toHaveLength(0);
  expect(source.count('resize')).toBe(0);
  expect(source.count('moveend')).toBe(0);
 });
 it('deduplicates repeated NoData but emits a valid recovery once',()=>{
  const source=fakeMap(),values:(SurroundingsRasterPlan|undefined)[]=[];
  source.setBounds({west:170,south:40,east:-170,north:41});
  const stop=observeSurroundingsViewportRaster(source.map,p=>values.push(p));
  vi.advanceTimersByTime(160);
  source.trigger('resize');vi.advanceTimersByTime(160);
  expect(values).toEqual([undefined]);
  source.setBounds({...initial});source.trigger('moveend');vi.advanceTimersByTime(160);
  expect(values).toHaveLength(2);
  expect(values[1]).toBeDefined();
  stop();
 });
 it('rejects negative, non-integer, unbounded debounce settings',()=>{
  for(const debounceMs of [-1,1.5,2001,NaN,Infinity]){
   const source=fakeMap();
   expect(()=>observeSurroundingsViewportRaster(source.map,()=>{}, {debounceMs})).toThrow(RangeError);
   expect(source.count('resize')).toBe(0);
   expect(source.count('moveend')).toBe(0);
  }
 });
});
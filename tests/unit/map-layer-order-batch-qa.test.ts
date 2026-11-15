import {readFileSync} from 'node:fs';
import {describe,expect,it,vi} from 'vitest';
import {createMapLayerOrderScheduler} from '../../src/mapLayerOrderScheduler';

describe('MID Karten: MapLibre Layerreihenfolge ohne redundante Reorder-Pässe',()=>{
 it('coalesces 50 synchronously registered layers for one map into one pass',async()=>{
  const schedule=createMapLayerOrderScheduler<object>();
  const map={},registry=new Map<string,number>(),applied:string[][]=[];
  for(let index=0;index<50;index++){
   registry.set(`layer-${index}`,50-index);
   schedule(map,()=>applied.push([...registry].sort((a,b)=>a[1]-b[1]).map(x=>x[0])));
  }
  expect(applied).toHaveLength(0);
  await Promise.resolve();
  expect(applied).toHaveLength(1);
  expect(applied[0]).toHaveLength(50);
  expect(applied[0][0]).toBe('layer-49');
  expect(applied[0].at(-1)).toBe('layer-0');
 });
 it('keeps independent map instances independent',async()=>{
  const schedule=createMapLayerOrderScheduler<object>();
  const a={},b={},flushA=vi.fn(),flushB=vi.fn();
  schedule(a,flushA);
  schedule(a,flushA);
  schedule(b,flushB);
  schedule(b,flushB);
  await Promise.resolve();
  expect(flushA).toHaveBeenCalledTimes(1);
  expect(flushB).toHaveBeenCalledTimes(1);
 });
 it('allows a later turn to re-order again after asynchronous style changes',async()=>{
  const schedule=createMapLayerOrderScheduler<object>();
  const map={},flush=vi.fn();
  schedule(map,flush);
  await Promise.resolve();
  expect(flush).toHaveBeenCalledTimes(1);
  schedule(map,flush);
  await Promise.resolve();
  expect(flush).toHaveBeenCalledTimes(2);
 });
 it('reads the latest registry: removed layers and new z-indices are never frozen',async()=>{
  const schedule=createMapLayerOrderScheduler<object>();
  const map={},registry=new Map([['cloud',300],['radar',400]]);
  const observed:string[][]=[];
  const flush=()=>observed.push([...registry].sort((a,b)=>a[1]-b[1]).map(x=>x[0]));
  schedule(map,flush);
  registry.delete('radar');
  registry.set('isobars',250);
  schedule(map,flush);
  await Promise.resolve();
  expect(observed).toEqual([['isobars','cloud']]);
 });
 it('actual MapLibre registry remains z-index sorted, with unregistration and a single microtask',()=>{
  const core=readFileSync('src/MapLibreCore.tsx','utf8');
  expect(core).toContain('const scheduleLayerOrder=createMapLayerOrderScheduler<MidMap>();');
  expect(core).toContain('scheduleLayerOrder(map,()=>applyLayerOrder(map))');
  expect(core).toContain('registry?.delete(id)');
  expect(core).toContain('.sort((a,b)=>a[1]-b[1])');
  expect(core).not.toContain('queueMicrotask(()=>applyLayerOrder(map))');
  expect(core).toContain('map.moveLayer(id)');
 });
});

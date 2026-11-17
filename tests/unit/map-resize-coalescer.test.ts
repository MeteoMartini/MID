import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createMapResizeCoalescer,type MapDisplaySize} from '../../src/mapResizeCoalescer';

function fixture(initial:MapDisplaySize={width:390,height:300,pixelRatio:2}){
 let size=initial,called=0,id=0;
 const queued=new Map<number,()=>void>(),canceled:number[]=[];
 const coalescer=createMapResizeCoalescer(
  ()=>size,()=>{called++},callback=>{const next=++id;queued.set(next,callback);return next},
  token=>{canceled.push(token);queued.delete(token)}
 );
 const flush=()=>{const frame=[...queued];queued.clear();for(const [,callback]of frame)callback()};
 return {coalescer,flush,queued,canceled,setSize:(next:MapDisplaySize)=>{size=next},getCalls:()=>called};
}

describe('MID MapLibre shared responsive resize — surroundings and full composite',()=>{
 it('coalesces repeated ResizeObserver/window notifications to one animation frame',()=>{
  const q=fixture();
  for(let n=0;n<70;n++)q.coalescer.schedule();
  expect(q.queued.size).toBe(1);
  q.flush();expect(q.getCalls()).toBe(1);
  for(let n=0;n<70;n++)q.coalescer.schedule();
  expect(q.queued.size).toBe(1);
  q.flush();expect(q.getCalls()).toBe(1); // no redundant MapLibre calls
 });
 it('observes both width AND height changes without affecting a responsive map camera',()=>{
  const q=fixture();q.coalescer.schedule();q.flush();
  q.setSize({width:430,height:300,pixelRatio:2});q.coalescer.schedule();q.flush();
  q.setSize({width:430,height:220,pixelRatio:2});q.coalescer.schedule();q.flush();
  expect(q.getCalls()).toBe(3);
 });
 it('observes changes in retina DPR even when CSS pixels stay unchanged',()=>{
  const q=fixture();q.coalescer.schedule();q.flush();
  q.setSize({width:390,height:300,pixelRatio:3});q.coalescer.schedule();q.flush();
  expect(q.getCalls()).toBe(2);
 });
 it('does not poison last valid map size on display:none/zero/nonfinite dimensions',()=>{
  const q=fixture();q.coalescer.schedule();q.flush();
  for(const bad of [
   {width:0,height:300,pixelRatio:2},{width:390,height:0,pixelRatio:2},
   {width:Number.NaN,height:300,pixelRatio:2},{width:390,height:300,pixelRatio:0}
  ]){
   q.setSize(bad);q.coalescer.schedule();q.flush();
  }
  expect(q.getCalls()).toBe(1);
  q.setSize({width:600,height:440,pixelRatio:2});q.coalescer.schedule();q.flush();
  expect(q.getCalls()).toBe(2);
 });
 it('cancels pending frames on unmount and ignores later observer events',()=>{
  const q=fixture();q.coalescer.schedule();
  expect(q.queued.size).toBe(1);
  q.coalescer.dispose();
  expect(q.queued.size).toBe(0);
  expect(q.canceled).toEqual([1]);
  q.coalescer.schedule();q.flush();
  expect(q.getCalls()).toBe(0);
 });
 it('the productive shared MID MapLibre root disables duplicate resize tracking, not touch or weather layers',()=>{
  const src=readFileSync('src/MapLibreCore.tsx','utf8');
  expect(src).toContain("import {createMapResizeCoalescer} from './mapResizeCoalescer'");
  expect(src).toContain("scrollZoom,trackResize:false,dragRotate:false");
  expect(src).toContain("new ResizeObserver(resizeCoalescer.schedule)");
  expect(src).toContain("window.addEventListener('resize',resizeCoalescer.schedule)");
  expect(src).toContain("document.addEventListener('visibilitychange',onVisible)");
  expect(src).toContain('resizeCoalescer.dispose()');
  expect(src).toContain("map.touchZoomRotate.disableRotation()");
  expect(src).toContain('maplibregl.Map({container');
  expect(src).toContain('export function ImageQuadLayer');
  expect(src).toContain('export function WmsTileLayer');
 });
});

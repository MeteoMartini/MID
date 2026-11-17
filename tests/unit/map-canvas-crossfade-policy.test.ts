import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {MAP_CANVAS_CROSSFADE_MAX_PIXELS,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from '../../src/mapCanvasCrossfadePolicy';

const defaults={width:390,height:844,visible:true,reducedMotion:false,saveData:false};
describe('MID Karten 1.16 · CanvasOverlay bounded cosmetic crossfade',()=>{
 it('allows a small visible canvas where a smooth transition is inexpensive',()=>{
  expect(shouldCrossfadeMapCanvas(defaults)).toBe(true);
  expect(shouldCrossfadeMapCanvas({...defaults,width:320,height:220})).toBe(true);
 });
 it('skips secondary-canvas allocation for reduced-motion preference',()=>{
  expect(shouldCrossfadeMapCanvas({...defaults,reducedMotion:true})).toBe(false);
 });
 it('skips copying imagery while the document is in background',()=>{
  expect(shouldCrossfadeMapCanvas({...defaults,visible:false})).toBe(false);
 });
 it('respects the browser Data Saver preference without changing weather data',()=>{
  expect(shouldCrossfadeMapCanvas({...defaults,saveData:true})).toBe(false);
 });
 it.each([
  [390,844,2],[430,932,2],[834,1112,2],[1440,900,1],[1920,1080,1]
 ])('skips multi-megapixel buffers %dx%d at DPR %d',(cssWidth,cssHeight,dpr)=>{
  const width=cssWidth*dpr,height=cssHeight*dpr;
  expect(width*height).toBeGreaterThan(MAP_CANVAS_CROSSFADE_MAX_PIXELS);
  expect(shouldCrossfadeMapCanvas({...defaults,width,height})).toBe(false);
 });
 it('permits an exact 1 Mi pixel buffer, rejects the next pixel',()=>{
  expect(shouldCrossfadeMapCanvas({...defaults,width:1024,height:1024})).toBe(true);
  expect(shouldCrossfadeMapCanvas({...defaults,width:1025,height:1024})).toBe(false);
 });
 it.each([
  {width:0,height:2},{width:-1,height:2},{width:1,height:0},
  {width:1.5,height:1},{width:1,height:Number.NaN},
  {width:Infinity,height:1},{width:1,height:Infinity},
  {width:Number.MAX_SAFE_INTEGER,height:2},
 ])('fails closed for invalid/out-of-budget textures %o',dimension=>{
  expect(shouldCrossfadeMapCanvas({...defaults,...dimension})).toBe(false);
 });
 it('never returns weather, forecast-time or source validity data',()=>{
  const result=shouldCrossfadeMapCanvas(defaults);
  expect(typeof result).toBe('boolean');
 });
 it('is wired before any CanvasOverlay duplicate canvas allocation in the actual source',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  const from=source.indexOf('export function CanvasOverlay');
  const end=source.indexOf('export function ImageQuadLayer',from);
  expect(from).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(from);
  const overlay=source.slice(from,end);
  expect(source).toContain("import {mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
  const checked=overlay.indexOf('shouldCrossfadeMapCanvas({');
  const skipped=overlay.indexOf('if(!animate){');
  const duplicate=overlay.indexOf("const old=document.createElement('canvas')");
  expect(checked).toBeGreaterThan(0);
  expect(skipped).toBeGreaterThan(checked);
  expect(duplicate).toBeGreaterThan(skipped);
  expect(overlay.slice(skipped,duplicate)).toContain('render(map,canvas)');
  expect(overlay.slice(skipped,duplicate)).toContain("canvas.style.transition='none'");
  expect(overlay.slice(skipped,duplicate)).toContain('return;');
  expect(overlay).toContain("document.visibilityState==='visible'");
  expect(overlay).toContain("prefers-reduced-motion: reduce");
 });

 it('uses renderer pixel backing, not the new overlay 300x150 HTML default',()=>{
  const initialOverlay={width:300,height:150};
  const retinaRenderer={width:1170,height:2532}; // 390x844 @ DPR 3
  const size=mapCanvasCrossfadeBackingSize(initialOverlay,retinaRenderer);
  expect(size).toEqual(retinaRenderer);
  expect(shouldCrossfadeMapCanvas({...defaults,...size!})).toBe(false);
  expect(shouldCrossfadeMapCanvas({...defaults,...initialOverlay})).toBe(true);
 });
 it('allows the same mobile viewport only if MapLibre actually uses a smaller backing',()=>{
  const size=mapCanvasCrossfadeBackingSize({width:300,height:150},{width:390,height:844});
  expect(size).toEqual({width:390,height:844});
  expect(shouldCrossfadeMapCanvas({...defaults,...size!})).toBe(true);
 });
 it('uses the largest real dimension per axis and cannot underestimate overlays',()=>{
  const size=mapCanvasCrossfadeBackingSize({width:1440,height:900},{width:320,height:220});
  expect(size).toEqual({width:1440,height:900});
  expect(shouldCrossfadeMapCanvas({...defaults,...size!})).toBe(false);
 });
 it.each([
  [undefined,{width:390,height:844}],
  [{width:300,height:150},undefined],
  [{width:300,height:150},{width:0,height:844}],
  [{width:300,height:150},{width:-390,height:844}],
  [{width:300,height:150},{width:Infinity,height:844}],
  [{width:300,height:150},{width:390.5,height:844}],
  [{width:0,height:150},{width:390,height:844}],
  [{width:300,height:NaN},{width:390,height:844}],
 ] as const)('fails closed without valid overlay AND renderer sizes: %o / %o',(overlay,renderer)=>{
  expect(mapCanvasCrossfadeBackingSize(overlay,renderer)).toBeUndefined();
 });
 it('reads the actual MapLibre backing BEFORE clone-admission and new canvas',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  const start=source.indexOf('export function CanvasOverlay');
  const end=source.indexOf('export function ImageQuadLayer',start);
  const overlay=source.slice(start,end);
  const read=overlay.indexOf('mapCanvasCrossfadeBackingSize(canvas,map.getCanvas())');
  const admission=overlay.indexOf('shouldCrossfadeMapCanvas({');
  const copied=overlay.indexOf("const old=document.createElement('canvas')");
  expect(read).toBeGreaterThan(0);
  expect(admission).toBeGreaterThan(read);
  expect(copied).toBeGreaterThan(admission);
  expect(overlay).toContain('width:backing?.width??0,height:backing?.height??0');
  expect(source).toContain("import {mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
 });

 it('returns successful canvas draw values without unnecessary rollback',()=>{
  let draws=0,rollbacks=0;
  const result=withCanvasFadeRollback(()=>{
   draws++;
   return {painted:true,frameKey:'source-validity-unchanged'};
  },()=>{rollbacks++});
  expect(result).toEqual({painted:true,frameKey:'source-validity-unchanged'});
  expect(draws).toBe(1);
  expect(rollbacks).toBe(0);
 });
 it('removes a staged old-weather canvas when the next draw fails, then rethrows',()=>{
  const failure=new Error('canvas render interrupted');
  const staged={attached:true,opacity:'0'},calls:string[]=[];
  let caught:unknown;
  try{
   withCanvasFadeRollback(()=>{
    calls.push('paint');
    throw failure;
   },()=>{
    staged.attached=false;
    staged.opacity='1';
    calls.push('dispose-old');
   });
  }catch(error){caught=error}
  expect(caught).toBe(failure);
  expect(staged).toEqual({attached:false,opacity:'1'});
  expect(calls).toEqual(['paint','dispose-old']);
 });
 it('preserves the source failure even if renderer teardown also throws',()=>{
  const failure=new Error('primary paint failure');
  let called=0,caught:unknown;
  try{withCanvasFadeRollback(()=>{throw failure},()=>{called++;throw Error('cleanup failure')})}
  catch(error){caught=error}
  expect(called).toBe(1);
  expect(caught).toBe(failure);
 });
 it('schedules a canvas fade only after the rollback-safe drawing transaction',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  const start=source.indexOf('export function CanvasOverlay');
  const end=source.indexOf('export function ImageQuadLayer',start);
  const overlay=source.slice(start,end);
  const staged=overlay.indexOf('canvas.before(old);');
  const protectedPaint=overlay.indexOf('withCanvasFadeRollback(()=>{');
  const insideDraw=overlay.indexOf("render(map,canvas);canvas.style.transition='none';canvas.style.opacity='0';",protectedPaint);
  const insideSchedule=overlay.indexOf("raf=requestAnimationFrame(",protectedPaint);
  const rollback=overlay.indexOf("},()=>{",protectedPaint);
  const restore=overlay.indexOf("old.remove();",rollback);
  expect(staged).toBeGreaterThan(-1);
  expect(protectedPaint).toBeGreaterThan(staged);
  expect(insideDraw).toBeGreaterThan(protectedPaint);
  expect(insideSchedule).toBeGreaterThan(insideDraw);
  expect(rollback).toBeGreaterThan(insideSchedule);
  expect(restore).toBeGreaterThan(rollback);
  expect(overlay.slice(rollback)).toContain('cancelAnimationFrame(raf);window.clearTimeout(timer);old.remove()');
  expect(overlay.slice(rollback)).toContain("canvas.style.transition='none'");
  expect(overlay.slice(rollback)).toContain('canvas.style.opacity=String(Math.max(0,Math.min(1,opacityRef.current)))');
  expect(source).toContain("import {mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
 });
});

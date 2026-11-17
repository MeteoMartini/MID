import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {MAP_CANVAS_CROSSFADE_MAX_PIXELS,createMapCanvasRedrawScheduler,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from '../../src/mapCanvasCrossfadePolicy';

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
  expect(source).toContain("import {createMapCanvasRedrawScheduler,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
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
  expect(source).toContain("import {createMapCanvasRedrawScheduler,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
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
  const finish=overlay.indexOf('function finishFade(){');
  const restore=overlay.indexOf('cancelAnimationFrame(raf);window.clearTimeout(timer);old.remove();',finish);
  const rollback=overlay.indexOf('},finishFade);',protectedPaint);
  expect(staged).toBeGreaterThan(-1);
  expect(finish).toBeGreaterThan(staged);
  expect(restore).toBeGreaterThan(finish);
  expect(protectedPaint).toBeGreaterThan(restore);
  expect(insideDraw).toBeGreaterThan(protectedPaint);
  expect(insideSchedule).toBeGreaterThan(insideDraw);
  expect(rollback).toBeGreaterThan(insideSchedule);
  expect(overlay.slice(finish,protectedPaint)).toContain("canvas.style.transition='none'");
  expect(overlay.slice(finish,protectedPaint)).toContain('canvas.style.opacity=String(Math.max(0,Math.min(1,opacityRef.current)))');
  expect(source).toContain("import {createMapCanvasRedrawScheduler,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
 });

 it('settles a canvas fade on backgrounding before a throttled RAF can leave blank pixels',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  const from=source.indexOf('export function CanvasOverlay');
  const end=source.indexOf('export function ImageQuadLayer',from);
  const overlay=source.slice(from,end);
  const settle=overlay.indexOf('function finishFade(){');
  const visibility=overlay.indexOf("function onVisibility(){if(document.visibilityState!=='visible')finishFade()}");
  const register=overlay.indexOf("document.addEventListener('visibilitychange',onVisibility);");
  const lateHidden=overlay.indexOf("if(document.visibilityState!=='visible')finishFade();");
  const cleanup=overlay.indexOf('return finishFade',register);
  expect(settle).toBeGreaterThan(0);
  expect(visibility).toBeGreaterThan(settle);
  expect(register).toBeGreaterThan(visibility);
  expect(lateHidden).toBeGreaterThan(register);
  expect(cleanup).toBeGreaterThan(lateHidden);
  expect(overlay.slice(settle,visibility)).toContain('if(settled)return;');
  expect(overlay.slice(settle,visibility)).toContain("document.removeEventListener('visibilitychange',onVisibility)");
  expect(overlay.slice(settle,visibility)).toContain('cancelAnimationFrame(raf);window.clearTimeout(timer);old.remove();');
  expect(overlay.slice(settle,visibility)).toContain("canvas.style.transition='none'");
  expect(overlay.slice(settle,visibility)).toContain('canvas.style.opacity=String(Math.max(0,Math.min(1,opacityRef.current)))');
  expect(overlay).toContain('timer=window.setTimeout(finishFade,380)');
  expect(overlay).toContain('if(settled)return;\n    canvas.style.transition');
 });

 it('coalesces 40 visible MapLibre render events into one canvas repaint',()=>{
  const queue=new Map<number,()=>void>(),paint:number[]=[];
  let next=0,visible=true;
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>paint.push(paint.length+1),
   callback=>{const id=next++;queue.set(id,callback);return id},
   id=>{queue.delete(id)},
   ()=>visible
  );
  for(let i=0;i<40;i++)scheduler.request();
  expect(queue.size).toBe(1);
  const task=queue.entries().next().value!;
  queue.delete(task[0]);task[1]();
  expect(paint).toEqual([1]);
  expect(queue.size).toBe(0);
  scheduler.dispose();
 });
 it('defers hidden map redraws and presents the latest in-memory content after return',()=>{
  let visible=false,revision=1,nextId=1;
  const callbacks=new Map<number,()=>void>(),drawn:number[]=[];
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>drawn.push(revision),
   cb=>{const id=nextId++;callbacks.set(id,cb);return id},
   id=>{callbacks.delete(id)},
   ()=>visible
  );
  for(let i=0;i<80;i++)scheduler.request();
  expect(callbacks.size).toBe(0);
  revision=2;visible=true;scheduler.visibilityChange(true);
  expect(callbacks.size).toBe(1);
  const [id,callback]=callbacks.entries().next().value!;
  callbacks.delete(id);callback();
  expect(drawn).toEqual([2]);
  scheduler.dispose();
 });
 it('cancels an outstanding request when hidden and ignores a late cancelled callback',()=>{
  let visible=true,nextId=4,oldCallback:(()=>void)|undefined;
  const callbacks=new Map<number,()=>void>(),cancelled:number[]=[],painted:number[]=[];
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>painted.push(1),
   callback=>{const id=nextId++;callbacks.set(id,callback);oldCallback??=callback;return id},
   id=>{cancelled.push(id);callbacks.delete(id)},
   ()=>visible
  );
  scheduler.request();expect(callbacks.size).toBe(1);
  visible=false;scheduler.visibilityChange(false);
  expect(cancelled).toEqual([4]);
  expect(callbacks.size).toBe(0);
  oldCallback!();expect(painted).toEqual([]);
  visible=true;scheduler.visibilityChange(true);
  const [id,callback]=callbacks.entries().next().value!;
  callbacks.delete(id);callback();
  expect(painted).toEqual([1]);
  scheduler.dispose();
 });
 it('forces one refresh after foregrounding even if no weather event arrived while hidden',()=>{
  let visible=true,next=1,calls=0;const callbacks=new Map<number,()=>void>();
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>{calls++},
   callback=>{const id=next++;callbacks.set(id,callback);return id},
   id=>{callbacks.delete(id)},
   ()=>visible
  );
  visible=false;scheduler.visibilityChange(false);
  visible=true;scheduler.visibilityChange(true);
  scheduler.visibilityChange(true);scheduler.request();
  expect(callbacks.size).toBe(1);
  callbacks.values().next().value!();
  expect(calls).toBe(1);
  scheduler.dispose();
 });
 it('prevents redraws, pending callbacks, and resume work after unmount/disposal',()=>{
  let visible=true,next=1,calls=0;const callbacks=new Map<number,()=>void>();
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>{calls++},
   cb=>{const id=next++;callbacks.set(id,cb);return id},
   id=>{callbacks.delete(id)},
   ()=>visible
  );
  scheduler.request();const late=callbacks.values().next().value!;
  scheduler.dispose();scheduler.dispose();late();
  visible=false;scheduler.request();scheduler.visibilityChange(false);
  visible=true;scheduler.visibilityChange(true);
  expect(calls).toBe(0);
  expect(callbacks.size).toBe(0);
 });
 it('keeps a redraw possible after a drawing exception instead of locking the frame queue',()=>{
  let calls=0,next=1;const callbacks=new Map<number,()=>void>();
  const error=new Error('synthetic overlay paint failure');
  const scheduler=createMapCanvasRedrawScheduler(
   ()=>{calls++;if(calls===1)throw error},
   callback=>{const id=next++;callbacks.set(id,callback);return id},
   id=>{callbacks.delete(id)},
   ()=>true
  );
  scheduler.request();const first=callbacks.values().next().value!;
  callbacks.clear();expect(()=>first()).toThrow(error);
  scheduler.request();expect(callbacks.size).toBe(1);
  const second=callbacks.values().next().value!;
  callbacks.clear();expect(()=>second()).not.toThrow();
  expect(calls).toBe(2);
  scheduler.dispose();
 });
 it('wires the redraw scheduler to genuine MapLibre events and document visibility',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  const start=source.indexOf('export function CanvasOverlay');
  const end=source.indexOf('export function ImageQuadLayer',start);
  const overlay=source.slice(start,end);
  expect(source).toContain("import {createMapCanvasRedrawScheduler,mapCanvasCrossfadeBackingSize,shouldCrossfadeMapCanvas,withCanvasFadeRollback} from './mapCanvasCrossfadePolicy'");
  const admission=overlay.indexOf('createMapCanvasRedrawScheduler(');
  const subscribe=overlay.indexOf("document.addEventListener('visibilitychange',onVisibility)");
  const cleanup=overlay.indexOf('scheduler.dispose()',subscribe);
  expect(admission).toBeGreaterThan(0);
  expect(subscribe).toBeGreaterThan(admission);
  expect(cleanup).toBeGreaterThan(subscribe);
  expect(overlay).toContain('const redraw=()=>scheduler.request()');
  expect(overlay).toContain("scheduler.visibilityChange(document.visibilityState==='visible')");
  expect(overlay).toContain('for(const event of events)map.on(event,redraw)');
  expect(overlay).toContain('for(const event of events)map.off(event,redraw)');
  expect(overlay).toContain("document.removeEventListener('visibilitychange',onVisibility)");
 });
});

import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {MAP_CANVAS_CROSSFADE_MAX_PIXELS,shouldCrossfadeMapCanvas} from '../../src/mapCanvasCrossfadePolicy';

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
  expect(source).toContain("import {shouldCrossfadeMapCanvas} from './mapCanvasCrossfadePolicy'");
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
});

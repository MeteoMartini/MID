import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {abandonMissingQuadFade} from '../../scripts/qa/mapQuadFadeLiveness';

describe('MID Karten 1.15 · lost image-layer fade liveness (QA only)',()=>{
 it('clears an active fade, disposes both frames and permits a future install',()=>{
  const fading={current:true};
  const old={source:'s-old',layer:'l-old',weight:.7};
  const next={source:'s-next',layer:'l-next',weight:.3};
  const frames={current:[old,next]};
  const disposed:string[]=[];
  expect(abandonMissingQuadFade(fading,frames,frame=>{disposed.push(frame.layer)})).toEqual({
   abandoned:true,disposedFrames:2,failedDisposals:0,
  });
  expect(fading.current).toBe(false);
  expect(frames.current).toEqual([]);
  expect(disposed).toEqual(['l-old','l-next']);
 });
 it('is idempotent on duplicate callbacks and cleanup',()=>{
  const fading={current:true},frames={current:[{layer:'l'}]},disposed:string[]=[];
  abandonMissingQuadFade(fading,frames,frame=>{disposed.push(frame.layer)});
  expect(abandonMissingQuadFade(fading,frames,frame=>{disposed.push(frame.layer)})).toEqual({
   abandoned:false,disposedFrames:0,failedDisposals:0,
  });
  expect(disposed).toEqual(['l']);
 });
 it('continues cleanup after a source-disposal exception, never leaving a busy flag',()=>{
  const fading={current:true},frames={current:[1,2,3]},removed:number[]=[];
  const result=abandonMissingQuadFade(fading,frames,n=>{if(n===2)throw Error('stale map');removed.push(n)});
  expect(result).toEqual({abandoned:true,disposedFrames:2,failedDisposals:1});
  expect(removed).toEqual([1,3]);
  expect(fading.current).toBe(false);
  expect(frames.current).toEqual([]);
 });
 it('does not dispose a settled original outside an active fade',()=>{
  const old={layer:'original'},fading={current:false},frames={current:[old]};
  expect(abandonMissingQuadFade(fading,frames,()=>{throw Error('unexpected dispose')})).toEqual({
   abandoned:false,disposedFrames:0,failedDisposals:0,
  });
  expect(frames.current).toEqual([old]);
 });
 it('handles a missing empty image-layer without any polling',()=>{
  const fading={current:true},frames={current:[] as string[]};
  expect(abandonMissingQuadFade(fading,frames,()=>{throw Error('unexpected dispose')})).toEqual({
   abandoned:true,disposedFrames:0,failedDisposals:0,
  });
  expect(fading.current).toBe(false);
 });

 it('is wired into the real ImageQuadLayer rather than remaining QA-only',()=>{
  const source=readFileSync(new URL('../../src/MapLibreCore.tsx',import.meta.url),'utf8');
  expect(source).toContain("import {abandonMissingQuadFade} from './mapQuadFadeLiveness'");
  const start=source.indexOf('const fade=(now:number)=>{');
  const end=source.indexOf('\n   animation.current=requestAnimationFrame(fade);',start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const actualFade=source.slice(start,end);
  expect(actualFade).toContain('if(!map.getLayer(layer)){abandonMissingQuadFade(fading,frames,remove);return}');
  expect(actualFade).toContain('}catch{');
  expect(actualFade).toContain('abandonMissingQuadFade(fading,frames,remove)');
  expect(actualFade).not.toContain('if(!map.getLayer(layer))return;');
 });
 it('does not invent a rendered radar frame or change weather validity during renderer cleanup',()=>{
  const fading={current:true},frames={current:[{source:'old',layer:'old'}]};
  let delivered=false,weatherTime=1700000000000;
  abandonMissingQuadFade(fading,frames,()=>{});
  expect(delivered).toBe(false);
  expect(weatherTime).toBe(1700000000000);
  expect(frames.current).toEqual([]);
 });
});

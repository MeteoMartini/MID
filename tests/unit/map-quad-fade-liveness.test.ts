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
  expect(actualFade).toContain('if(!map.getLayer(layer)){abandonFade();return}');
  expect(actualFade).toContain('}catch{');
  expect(actualFade).toContain('abandonFade();return;');
  expect(actualFade).toContain('if(t<1){animation.current=requestAnimationFrame(fade);return}');
  const catchStart=actualFade.indexOf('}catch{');
  const ready=actualFade.indexOf('onDisplayed?.();');
  expect(ready).toBeGreaterThan(catchStart);
  expect(actualFade.slice(catchStart,ready)).toContain('abandonFade();return;');
  expect(actualFade.slice(0,catchStart)).not.toContain('onDisplayed?.()');
  expect(actualFade.slice(catchStart,ready)).toMatch(/abandonFade\(\);return;\s*\}\s*\/\/ Consumer exceptions[^\n]*\n\s*$/);
  const abortStart=source.lastIndexOf('const abandonFade=()=>{',start);
  expect(abortStart).toBeGreaterThan(0);
  const abort=source.slice(abortStart,start);
  expect(abort).toContain('const abandoned=abandonMissingQuadFade(fading,frames,remove)');
  expect(abort).toContain("if(abandoned.abandoned&&active)errorRef.current?.('Das Kartenbild konnte nicht angezeigt werden.')");
  expect(abort).not.toContain('bisherige Stand bleibt sichtbar');
  expect(actualFade).not.toContain('if(!map.getLayer(layer))return;');
 });
 it('disposes only the original frames without rewriting their validity metadata',()=>{
  const old=Object.freeze({source:'old',layer:'old',validAt:1700000000000});
  const next=Object.freeze({source:'next',layer:'next',validAt:1700000300000});
  const fading={current:true},frames={current:[old,next]};
  const observed:typeof frames.current=[];
  expect(abandonMissingQuadFade(fading,frames,frame=>observed.push(frame))).toEqual({abandoned:true,disposedFrames:2,failedDisposals:0});
  expect(observed).toEqual([old,next]);
  expect(observed[0]).toBe(old);
  expect(observed[1]).toBe(next);
  expect(fading.current).toBe(false);
  expect(frames.current).toEqual([]);
 });
});

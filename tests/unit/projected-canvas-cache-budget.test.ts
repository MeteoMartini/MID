import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
let cache:typeof import('../../src/projectedCanvasCache');
let copy=vi.fn(),create=vi.fn();
const source=(width:number,height:number)=>({width,height} as HTMLCanvasElement);
beforeEach(async()=>{
 vi.resetModules();cache=await import('../../src/projectedCanvasCache');
 copy=vi.fn();create=vi.fn(()=>({width:300,height:150,getContext:()=>({drawImage:copy})}));
 vi.stubGlobal('document',{createElement:create});
});
afterEach(()=>vi.unstubAllGlobals());
describe('projected raster cache – capacity before copy',()=>{
 it('never allocates an oversized, empty or invalid copy or evicts unrelated valid entries',()=>{
  cache.setProjectedCanvas('valid',source(2000,2000));create.mockClear();
  for(const [w,h] of [[0,1],[1,0],[-1,2],[1.5,1],[NaN,1],[Infinity,1],[3000,1501],[Number.MAX_SAFE_INTEGER,2]])cache.setProjectedCanvas('bad',source(w,h));
  expect(create).not.toHaveBeenCalled();expect(cache.getProjectedCanvas('bad')).toBeNull();
  expect(cache.getProjectedCanvas('valid')).not.toBeNull();expect(cache.projectedCanvasCacheStats().pixels).toBe(4000000);
 });
 it('reserves pixel capacity before allocating a copy and keeps exact LRU',()=>{
  cache.setProjectedCanvas('a',source(1500,1500));cache.setProjectedCanvas('b',source(1500,1500));cache.getProjectedCanvas('a');
  create.mockImplementationOnce(()=>{expect(cache.projectedCanvasCacheStats().pixels).toBe(2250000);return {width:300,height:150,getContext:()=>({drawImage:copy})}});
  cache.setProjectedCanvas('c',source(1500,1500));expect(cache.getProjectedCanvas('b')).toBeNull();expect(cache.getProjectedCanvas('a')).not.toBeNull();expect(cache.getProjectedCanvas('c')).not.toBeNull();expect(cache.projectedCanvasCacheStats()).toMatchObject({entries:2,pixels:4500000});
 });
 it('enforces entry limit before copy even when wall clock is constant or runs backwards',()=>{
  const clock=vi.spyOn(Date,'now').mockReturnValue(100);
  try{for(let i=0;i<8;i++)cache.setProjectedCanvas('k'+i,source(1,1));cache.getProjectedCanvas('k0');clock.mockReturnValue(1);
   create.mockImplementationOnce(()=>{expect(cache.projectedCanvasCacheStats().entries).toBe(7);return {width:300,height:150,getContext:()=>({drawImage:copy})}});
   cache.setProjectedCanvas('k8',source(1,1));expect(cache.getProjectedCanvas('k1')).toBeNull();expect(cache.getProjectedCanvas('k0')).not.toBeNull();expect(cache.projectedCanvasCacheStats().entries).toBe(8);
  }finally{clock.mockRestore()}
 });
 it('does not expose stale same-key copies after failed replacement, and recovers',()=>{
  const frame=source(100,100);cache.setProjectedCanvas('a',frame);
  create.mockImplementationOnce(()=>{throw Error('allocation failure')});expect(()=>cache.setProjectedCanvas('a',frame)).not.toThrow();expect(cache.getProjectedCanvas('a')).toBeNull();expect(cache.projectedCanvasCacheStats().pixels).toBe(0);
  cache.setProjectedCanvas('a',frame);copy.mockImplementationOnce(()=>{throw Error('copy failure')});expect(()=>cache.setProjectedCanvas('a',frame)).not.toThrow();expect(cache.getProjectedCanvas('a')).toBeNull();expect(cache.projectedCanvasCacheStats().pixels).toBe(0);
  cache.setProjectedCanvas('a',frame);expect(cache.getProjectedCanvas('a')).not.toBeNull();expect(cache.projectedCanvasCacheStats().pixels).toBe(10000);expect(frame.width).toBe(100);expect(frame.height).toBe(100);
 });
});

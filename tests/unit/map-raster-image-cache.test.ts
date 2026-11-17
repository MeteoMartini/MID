import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createMapImageCache,isDatedMapWmsFrame,type MapImageLike} from '../../src/mapRasterImageCache';

const time='2026-11-17T06:15:00.000Z';
const dated=(stamp=time,bbox='5,47,16,56')=>
 \`https://example.test/ows?service=WMS&request=GetMap&layers=dwd%3ARadar&bbox=\${encodeURIComponent(bbox)}&width=512&height=256&time=\${encodeURIComponent(stamp)}\`;
type FakeImage=MapImageLike&{id:number};
const image=(id:number,width=128,height=64):FakeImage=>({id,naturalWidth:width,naturalHeight:height});

describe('bounded map raster cache: native WMS source identity, memory and UI-safe reuse',()=>{
 it('admits only UTC-dated immutable-looking WMS GetMap requests with explicit geometry',()=>{
  expect(isDatedMapWmsFrame(dated())).toBe(true);
  expect(isDatedMapWmsFrame(dated('2026-11-17T06:20:00Z'))).toBe(true);
  expect(isDatedMapWmsFrame(dated('latest'))).toBe(false);
  expect(isDatedMapWmsFrame(dated('2026-11-17T06:15:00'))).toBe(false);
  expect(isDatedMapWmsFrame(dated()+'&TIME='+encodeURIComponent(time))).toBe(false);
  expect(isDatedMapWmsFrame(dated()+'&width=1024')).toBe(false);
  expect(isDatedMapWmsFrame(dated().replace('request=GetMap','request=GetLegendGraphic'))).toBe(false);
  expect(isDatedMapWmsFrame(dated().replace('width=512','width=0'))).toBe(false);
  expect(isDatedMapWmsFrame('data:image/png;base64,AAAA')).toBe(false);
  expect(isDatedMapWmsFrame('blob:https://example.test/123')).toBe(false);
  expect(isDatedMapWmsFrame('/proxy?service=WMS&request=GetMap&time='+time)).toBe(false);
  expect(isDatedMapWmsFrame('https://user:pass@example.test/ows?service=WMS&request=GetMap&layers=a&bbox=1,2,3,4&width=256&height=256&time='+time)).toBe(false);
 });
 it('reuses an already loaded HTML image without a second URL fetch on back-and-forth 5-minute scrubs',async()=>{
  let loads=0;
  const cache=createMapImageCache(async()=>image(++loads));
  const a=await cache.load(dated());
  const b=await cache.load(dated('2026-11-17T06:20:00.000Z'));
  const aRevisited=await cache.load(dated());
  expect(aRevisited).toBe(a);
  expect(aRevisited).not.toBe(b);
  expect(loads).toBe(2);
  expect(cache.stats()).toMatchObject({images:2,pending:0});
 });
 it('deduplicates concurrent WMS image loads without leaking pending promises',async()=>{
  let resolve!: (value:FakeImage)=>void;
  let loads=0;
  const cache=createMapImageCache(()=>{loads++;return new Promise<FakeImage>(r=>{resolve=r})});
  const a=cache.load(dated()),b=cache.load(dated());
  expect(a).toBe(b);
  expect(loads).toBe(1);
  expect(cache.stats().pending).toBe(1);
  resolve(image(1));
  expect(await a).toEqual(image(1));
  await b;
  expect(cache.stats().pending).toBe(0);
  expect((await cache.load(dated())).id).toBe(1);
  expect(loads).toBe(1);
 });
 it('never mixes different WMS TIME, BBOX or revisions and never stores live latest snapshots',async()=>{
  let loads=0;
  const cache=createMapImageCache(async()=>image(++loads));
  const A=dated(),B=dated(time,'6,48,17,57'),C=dated('2026-11-17T06:10:00.000Z');
  await cache.load(A);await cache.load(B);await cache.load(C);
  await cache.load(A+'&revision=2');
  expect(loads).toBe(4);
  expect(cache.stats().images).toBe(4);
  await cache.load(dated('latest'));await cache.load(dated('latest'));
  await cache.load('data:image/png;base64,AAAA');await cache.load('data:image/png;base64,AAAA');
  expect(loads).toBe(8);
  expect(cache.stats().images).toBe(4);
 });
 it('evicts on pixel-byte budget and count budget, not the selected time axis',async()=>{
  let loads=0;
  const cache=createMapImageCache(async()=>image(++loads,256,256),{maxEntries:2,maxBytes:2*256*256*4});
  const A=dated('2026-11-17T06:00:00Z'),B=dated('2026-11-17T06:05:00Z'),C=dated('2026-11-17T06:10:00Z');
  await cache.load(A);await cache.load(B);
  expect(cache.stats()).toEqual({images:2,bytes:2*256*256*4,pending:0});
  await cache.load(C);
  expect(cache.stats()).toEqual({images:2,bytes:2*256*256*4,pending:0});
  await cache.load(B);expect(loads).toBe(3); // B still in LRU
  await cache.load(A);expect(loads).toBe(4); // A evicted
 });
 it('expires dated frames and skips caching oversized/invalid decoded images',async()=>{
  let clock=1000,loads=0;
  const cache=createMapImageCache(async()=>image(++loads),{ttlMs:200,maxBytes:40000,now:()=>clock});
  await cache.load(dated());clock+=190;await cache.load(dated());
  expect(loads).toBe(1);
  clock+=11;await cache.load(dated());expect(loads).toBe(2);
  const oversized=createMapImageCache(async()=>image(++loads,4096,4096),{maxBytes:40000});
  await oversized.load(dated());await oversized.load(dated());
  expect(oversized.stats().images).toBe(0);
  const invalid=createMapImageCache(async()=>image(++loads,0,12));
  await invalid.load(dated());expect(invalid.stats().images).toBe(0);
 });
 it('clears rejected loads, tolerates rapid unmount and preserves original GPU-ready fade contract',async()=>{
  let n=0;
  const failed=createMapImageCache(async()=>{if(!n++){throw Error('source unavailable')}return image(n)});
  await expect(failed.load(dated())).rejects.toThrow('source unavailable');
  expect(failed.stats().pending).toBe(0);
  expect((await failed.load(dated())).id).toBe(2);
  const map=readFileSync('src/MapLibreCore.tsx','utf8');
  expect(map).toContain("import {loadMapImageForQuad} from './mapRasterImageCache'");
  expect(map).toContain('void loadMapImageForQuad(url).then(image=>{if(active)install(image)}');
  expect(map).toContain("map.on('render',readiness)");
  expect(map).toContain('map.isSourceLoaded(source)');
  expect(map).toContain('prefers-reduced-motion: reduce');
  expect(map).toContain("raster-fade-duration':0");
  const cache=createMapImageCache(async()=>image(11));
  const ready=await cache.load(dated());
  cache.clear();
  expect(cache.stats()).toEqual({images:0,bytes:0,pending:0});
  expect(ready.id).toBe(11);
 });
});

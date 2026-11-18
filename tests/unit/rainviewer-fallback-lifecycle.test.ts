import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 createRainViewerFallbackLifecycle,rainViewerPastObservations,
 RAINVIEWER_REFRESH_INTERVAL_MS,RAINVIEWER_RESUME_FRESHNESS_MS,
} from '../../src/rainViewerFallbackLifecycle';

const frame=(time:number,path=`/v2/radar/${time}`)=>({time,path});
function fixture(){
 let time=1_000_000,visible=true,listener:(()=>void)|null=null,id=0;
 const timers=new Map<number,{due:number;callback:()=>void}>();
 const calls:{signal:AbortSignal;resolve:(value:string)=>void;reject:(reason:Error)=>void}[]=[];
 const accepted:string[]=[],errors:unknown[]=[];
 const lifecycle=createRainViewerFallbackLifecycle<string>({
  now:()=>time,visible:()=>visible,
  subscribe:fn=>{listener=fn;return()=>{listener=null}},
  setTimer:(callback,delay)=>{const key=++id;timers.set(key,{due:time+delay,callback});return key},
  clearTimer:key=>{timers.delete(key)},
  fetch:signal=>new Promise<string>((resolve,reject)=>calls.push({signal,resolve,reject})),
  onData:data=>{accepted.push(data)},onError:error=>{errors.push(error)},
 });
 const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
 const advance=async(ms:number)=>{
  time+=ms;
  for(let i=0;i<12;i++){
   const due=[...timers].filter(([,value])=>value.due<=time);
   if(!due.length)break;
   for(const [key,value] of due){timers.delete(key);value.callback()}
   await flush();
  }
 };
 const show=async(next:boolean)=>{visible=next;listener?.();await flush()};
 return {lifecycle,timers,calls,accepted,errors,flush,advance,show};
}

describe('MID Karten · RainViewer free API original observations and foreground lifecycle',()=>{
 it('rejects discontinued nowcast, future and missing observations',()=>{
  const now=2_000_000;
  expect(rainViewerPastObservations({radar:{past:[frame(now-600)],nowcast:[frame(now+600)]}},now)).toEqual([frame(now-600)]);
  expect(rainViewerPastObservations({radar:{past:[frame(now+90),frame(now+120)]}},now)).toEqual([]);
  expect(rainViewerPastObservations({radar:{past:[],nowcast:[frame(now+300)]}},now)).toEqual([]);
  expect(rainViewerPastObservations(null,now)).toEqual([]);
 });
 it('preserves sparse original times and rejects malformed or stale frames',()=>{
  const now=2_000_000;
  expect(rainViewerPastObservations({radar:{past:[frame(now-1800),frame(now-600),frame(now-3*3600),frame(now-10,'//other')] }},now))
   .toEqual([frame(now-1800),frame(now-600)]);
 });
 it('sorts and deduplicates by real source timestamp',()=>{
  const now=2_000_000;
  expect(rainViewerPastObservations({radar:{past:[frame(now-600,'/a'),frame(now-1200),frame(now-600,'/b')]}},now))
   .toEqual([frame(now-1200),frame(now-600,'/b')]);
 });
 it('uses the 5min refresh and 2min worker cache budget',()=>{
  expect(RAINVIEWER_REFRESH_INTERVAL_MS).toBe(300_000);
  expect(RAINVIEWER_RESUME_FRESHNESS_MS).toBe(120_000);
 });
 it('starts one request and coalesces simultaneous resume events',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  f.lifecycle.visibilityChanged();f.lifecycle.visibilityChanged();await f.flush();
  expect(f.calls).toHaveLength(1);f.lifecycle.dispose();
 });
 it('pauses in background, aborts and discards late results',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  await f.show(false);expect(f.calls[0].signal.aborted).toBe(true);
  f.calls[0].resolve('late');await f.flush();
  expect(f.accepted).toEqual([]);expect(f.timers.size).toBe(0);
  await f.advance(600_000);expect(f.calls).toHaveLength(1);f.lifecycle.dispose();
 });
 it('resumes immediately after old snapshot but avoids short-interval duplicate',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  f.calls[0].resolve('first');await f.flush();
  await f.show(false);await f.advance(30_000);await f.show(true);
  expect(f.calls).toHaveLength(1);
  await f.show(false);await f.advance(150_000);await f.show(true);
  expect(f.calls).toHaveLength(2);f.lifecycle.dispose();
 });
 it('refreshes after five minutes and keeps one foreground timer',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  f.calls[0].resolve('first');await f.flush();expect(f.timers.size).toBe(1);
  await f.advance(300_000);expect(f.calls).toHaveLength(2);f.lifecycle.dispose();
 });
 it('retains valid previous data on provider failure, without tight retry',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  f.calls[0].resolve('first');await f.flush();await f.advance(300_000);
  f.calls[1].reject(new Error('network'));await f.flush();
  expect(f.accepted).toEqual(['first']);expect(f.errors).toHaveLength(1);
  expect(f.timers.size).toBe(1);f.lifecycle.dispose();
 });
 it('does not busy-loop after a slow successful request',async()=>{
  const f=fixture();f.lifecycle.start();await f.flush();
  await f.advance(301_000);f.calls[0].resolve('late');await f.flush();
  await f.advance(10_000);expect(f.calls).toHaveLength(1);f.lifecycle.dispose();
 });
 it('is wired to the production RadarPanel effect and not to DWD/OPERA nowcasts',()=>{
  const src=readFileSync(new URL('../../src/RadarPanel.tsx',import.meta.url),'utf8');
  expect(src).toContain("from './rainViewerFallbackLifecycle'");
  expect(src).toContain('createRainViewerFallbackLifecycle({');
  expect(src).toContain('rainViewerPastObservations(data,Date.now()/1000)');
  expect(src).not.toContain("...(data.radar?.nowcast??[]).map(item=>({...item,future:true}))");
  expect(src).toContain("document.addEventListener('visibilitychange',visibilityChanged)");
  expect(src).toContain("window.addEventListener('pageshow',visibilityChanged)");
 });
});

import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {observeSurroundingsVisibleClock} from '../../src/surroundingsVisibleClock';

function fakeVisibility(initial:'visible'|'hidden'|'prerender'='visible'){
 let visibility=initial;
 const listeners=new Set<()=>void>();
 return {
  source:{
   get visibilityState(){return visibility},
   addEventListener(type:string,fn:EventListenerOrEventListenerObject){
    if(type==='visibilitychange')listeners.add(fn as ()=>void);
   },
   removeEventListener(type:string,fn:EventListenerOrEventListenerObject){
    if(type==='visibilitychange')listeners.delete(fn as ()=>void);
   }
  } as Pick<Document,'visibilityState'|'addEventListener'|'removeEventListener'>,
  change(next:'visible'|'hidden'|'prerender'){
   visibility=next;
   for(const fn of listeners)fn();
  },
  listeners:()=>listeners.size
 };
}

describe('MID-Karten 1.18: foreground-only surroundings display clock',()=>{
 beforeEach(()=>{
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-20T14:00:00.000Z'));
 });
 afterEach(()=>vi.useRealTimers());

 it('ticks on visible mount, sleeps without timers when hidden, resumes immediately',()=>{
  const page=fakeVisibility();
  const seen:number[]=[];
  const stop=observeSurroundingsVisibleClock(page.source,now=>seen.push(now));
  expect(seen).toEqual([Date.now()]);
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(60_000);
  expect(seen).toHaveLength(3);
  page.change('hidden');
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(300_000);
  expect(seen).toHaveLength(3);
  page.change('visible');
  expect(seen).toHaveLength(4);
  expect(seen.at(-1)).toBe(Date.now());
  expect(vi.getTimerCount()).toBe(1);
  page.change('visible'); // duplicate visibility events do not cause extra requests.
  expect(seen).toHaveLength(4);
  expect(vi.getTimerCount()).toBe(1);
  stop();stop();
  expect(page.listeners()).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(300_000);
  expect(seen).toHaveLength(4);
 });

 it('never starts timers in a hidden or prerendered document',()=>{
  const page=fakeVisibility('prerender');
  const seen:number[]=[];
  const stop=observeSurroundingsVisibleClock(page.source,now=>seen.push(now));
  expect(seen).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
  page.change('hidden');
  expect(seen).toEqual([]);
  page.change('visible');
  expect(seen).toEqual([Date.now()]);
  expect(vi.getTimerCount()).toBe(1);
  page.change('prerender');
  expect(vi.getTimerCount()).toBe(0);
  stop();
 });

 it('rejects unbounded or non-integral intervals before registering listeners',()=>{
  const page=fakeVisibility(),tick=vi.fn();
  for(const duration of [0,999,60001,-1,1.5,NaN,Infinity]){
   expect(()=>observeSurroundingsVisibleClock(page.source,tick,duration)).toThrow(RangeError);
  }
  expect(tick).not.toHaveBeenCalled();
  expect(page.listeners()).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
 });

 it('accepts both inclusive interval boundaries with exact cadence and cleanup',()=>{
  for(const duration of [1000,60000]){
   const page=fakeVisibility(),tick=vi.fn();
   const stop=observeSurroundingsVisibleClock(page.source,tick,duration);
   expect(tick).toHaveBeenCalledTimes(1);
   vi.advanceTimersByTime(duration-1);
   expect(tick).toHaveBeenCalledTimes(1);
   vi.advanceTimersByTime(1);
   expect(tick).toHaveBeenCalledTimes(2);
   stop();
   expect(vi.getTimerCount()).toBe(0);
   expect(page.listeners()).toBe(0);
  }
 });

 it('cleans up the owner pause and immediately reconciles actual time on visible reacquisition',()=>{
  const page=fakeVisibility(),seen:number[]=[];
  const start=()=>observeSurroundingsVisibleClock(page.source,now=>seen.push(now));
  let stop=start();
  expect(seen).toEqual([Date.now()]);
  for(let i=0;i<5;i++){
   stop();
   const count=seen.length;
   expect(page.listeners()).toBe(0);expect(vi.getTimerCount()).toBe(0);
   page.change('hidden');vi.advanceTimersByTime(95_000);page.change('visible');
   expect(seen).toHaveLength(count);
   stop=start();
   expect(seen).toHaveLength(count+1);expect(seen.at(-1)).toBe(Date.now());
   expect(page.listeners()).toBe(1);expect(vi.getTimerCount()).toBe(1);
  }
  stop();expect(page.listeners()).toBe(0);expect(vi.getTimerCount()).toBe(0);
 });

 it('reacquisition while hidden never ticks before actual visibility, then resumes once',()=>{
  const page=fakeVisibility(),seen:number[]=[];
  let stop=observeSurroundingsVisibleClock(page.source,now=>seen.push(now));
  stop();page.change('hidden');vi.advanceTimersByTime(120_000);
  stop=observeSurroundingsVisibleClock(page.source,now=>seen.push(now));
  expect(seen).toHaveLength(1);expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(60_000);page.change('visible');page.change('visible');
  expect(seen).toHaveLength(2);expect(seen.at(-1)).toBe(Date.now());
  expect(vi.getTimerCount()).toBe(1);expect(page.listeners()).toBe(1);
  stop();expect(vi.getTimerCount()).toBe(0);expect(page.listeners()).toBe(0);
 });

 it('is wired into the compact view with ownership-aware cleanup and no unconditional 30-second timer',()=>{
  const source=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(source).toContain("import {observeSurroundingsVisibleClock} from './surroundingsVisibleClock';");
  expect(source).toContain('useEffect(()=>{if(mapPaused)return;return observeSurroundingsVisibleClock(document,setNow)},[mapPaused]);');
  expect(source).not.toContain('useEffect(()=>observeSurroundingsVisibleClock(document,setNow),[]);');
  expect(source).toContain('if(mapPaused)return;\n  const element=mapFigureRef.current;');
  expect(source).toContain('return()=>{observer?.disconnect();window.removeEventListener(\'resize\',update)};\n },[mapPaused]);');
  expect(source).not.toContain('window.setInterval(()=>setNow(Date.now()),30000)');
 });
});

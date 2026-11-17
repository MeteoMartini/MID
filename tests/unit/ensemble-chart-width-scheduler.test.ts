import {describe,expect,it,vi} from 'vitest';
import {createEnsembleChartWidthScheduler} from '../../src/ensembleChartWidthScheduler';

function harness(firstId=1){
 const frames=new Map<number,()=>void>();
 let id=firstId;
 const values:number[]=[];
 const request=vi.fn((callback:()=>void)=>{
  const key=id++;
  frames.set(key,callback);
  return key;
 });
 const cancel=vi.fn((key:number)=>{frames.delete(key);});
 const scheduler=createEnsembleChartWidthScheduler(request,cancel,value=>values.push(value));
 const flush=()=>{
  const callbacks=[...frames.values()];
  frames.clear();
  callbacks.forEach(callback=>callback());
 };
 return{frames,values,request,cancel,scheduler,flush};
}

describe('MID Audit 1.0 · responsive ensemble width / RAF coalescing',()=>{
 it('performs one scheduled RAF for a 250-event resize burst and commits the latest width',()=>{
  const x=harness();
  for(let index=0;index<250;index++)x.scheduler.push(320+index);
  expect(x.request).toHaveBeenCalledTimes(1);
  expect(x.frames.size).toBe(1);
  x.flush();
  expect(x.values).toEqual([569]);
  expect(x.frames.size).toBe(0);
 });
 it('preserves exact responsive CSS pixel widths for phone, tablet, and desktop',()=>{
  const x=harness();
  for(const width of [320,390,430,834,1024,1440]){
   x.scheduler.push(width);
   x.flush();
  }
  expect(x.values).toEqual([320,390,430,834,1024,1440]);
 });
 it('rejects NaN, Infinity, negative, or zero widths and floors fractional measurements',()=>{
  const x=harness();
  [Number.NaN,Infinity,-Infinity,-200,0,0.99].forEach(value=>x.scheduler.push(value));
  expect(x.request).not.toHaveBeenCalled();
  x.scheduler.push(390.9);
  x.flush();
  expect(x.values).toEqual([390]);
 });
 it('reuses the same pending frame under repeated resize notifications, including RAF id zero',()=>{
  const x=harness(0);
  x.scheduler.push(834);
  x.scheduler.push(390);
  expect(x.request).toHaveBeenCalledTimes(1);
  x.flush();
  expect(x.values).toEqual([390]);
  x.scheduler.push(430);
  expect(x.request).toHaveBeenCalledTimes(2);
  x.flush();
  expect(x.values).toEqual([390,430]);
 });
 it('cancels the pending frame on unmount and ignores late updates',()=>{
  const x=harness();
  x.scheduler.push(834);
  x.scheduler.dispose();
  x.scheduler.dispose();
  expect(x.cancel).toHaveBeenCalledTimes(1);
  expect(x.frames.size).toBe(0);
  x.scheduler.push(1440);
  x.flush();
  expect(x.values).toEqual([]);
  expect(x.request).toHaveBeenCalledTimes(1);
 });
 it('never publishes an outdated intermediate width when notifications arrive before paint',()=>{
  const x=harness();
  x.scheduler.push(1440);
  x.scheduler.push(834);
  x.scheduler.push(320);
  x.flush();
  expect(x.values).toEqual([320]);
  x.scheduler.push(390);
  x.flush();
  expect(x.values).toEqual([320,390]);
 });
});

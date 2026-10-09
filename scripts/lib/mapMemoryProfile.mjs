/** Chromium fixture observations; no leak verdict or uncalibrated memory gate. */
import {percentile} from './mapBaselineStatistics.mjs';

function nonNegative(value,name){
  if(!Number.isFinite(value)||value<0)throw new TypeError('Invalid Chromium memory metric: '+name);
  return value;
}
export async function collectMapMemorySample(session,cycle){
  if(!Number.isInteger(cycle)||cycle<0)throw new RangeError('Invalid memory sample cycle');
  await session.send('HeapProfiler.collectGarbage');
  const heap=await session.send('Runtime.getHeapUsage');
  const dom=await session.send('Memory.getDOMCounters');
  return {cycle,
    usedHeapBytes:nonNegative(heap.usedSize,'usedSize'),
    allocatedHeapBytes:nonNegative(heap.totalSize,'totalSize'),
    backingStorageBytes:heap.backingStorageSize===undefined?null:nonNegative(heap.backingStorageSize,'backingStorageSize'),
    documents:nonNegative(dom.documents,'documents'),
    nodes:nonNegative(dom.nodes,'nodes'),
    listeners:nonNegative(dom.jsEventListeners,'jsEventListeners')};
}
export function summarizeMapMemory(samples,durationsMs){
  if(!Array.isArray(samples)||samples.length<2)throw new RangeError('At least two post-GC memory samples required');
  for(let i=0;i<samples.length;i++){
    const s=samples[i];
    if(!Number.isInteger(s.cycle)||s.cycle<0||(i&&s.cycle<=samples[i-1].cycle))throw new RangeError('Memory cycles must increase');
    for(const key of ['usedHeapBytes','allocatedHeapBytes','documents','nodes','listeners'])nonNegative(s[key],key);
  }
  const first=samples[0],last=samples.at(-1),delta=key=>last[key]-first[key];
  return {samples,completedCycles:last.cycle,
    heapDeltaBytes:delta('usedHeapBytes'),
    heapDeltaPercent:first.usedHeapBytes?Math.round(delta('usedHeapBytes')/first.usedHeapBytes*10000)/100:null,
    nodeDelta:delta('nodes'),listenerDelta:delta('listeners'),documentDelta:delta('documents'),
    strictlyIncreasingHeap:samples.length>=3&&samples.slice(1).every((s,i)=>s.usedHeapBytes>samples[i].usedHeapBytes),
    cycleP95Ms:percentile(durationsMs,.95),
    kind:'isolated-synthetic-post-GC-observation-not-leak-verdict'};
}
export async function profileMapCycles(session,cycle){
  // Warm both providers/caches before H0. Every measured round trip returns to D2.
  for(let i=0;i<2;i++)await cycle();
  const samples=[await collectMapMemorySample(session,0)],durationsMs=[];
  for(let i=1;i<=20;i++){
    const start=performance.now();await cycle();durationsMs.push(performance.now()-start);
    if(i%5===0)samples.push(await collectMapMemorySample(session,i));
  }
  return summarizeMapMemory(samples,durationsMs);
}

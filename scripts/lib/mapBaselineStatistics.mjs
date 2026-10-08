/** Observational browser fixture metrics. Never equate synthetic timing with field Core Web Vitals. */
export function percentile(values, q) {
  if (!Array.isArray(values) || values.length === 0) return null;
  if (!Number.isFinite(q) || q < 0 || q > 1) throw new RangeError('percentile q must be between 0 and 1');
  const finite=values.filter(x=>Number.isFinite(x)&&x>=0).sort((a,b)=>a-b);
  if (finite.length===0) return null;
  const index=Math.max(0,Math.ceil(q*finite.length)-1);
  return Math.round(finite[index]*100)/100;
}
export function summarizePhases(phases) {
  const safe=phases.filter(x=>x && typeof x==='object');
  const frames=safe.flatMap(x=>Array.isArray(x.frameDurationsMs)?x.frameDurationsMs:[]);
  const tasks=safe.flatMap(x=>Array.isArray(x.longTasksMs)?x.longTasksMs:[]);
  const lcp=safe.flatMap(x=>Number.isFinite(x.lcpMs)?[x.lcpMs]:[]);
  return {
    phases:safe.length,
    sampleFrames:frames.length,
    frameP95Ms:percentile(frames,.95),
    longTasks:tasks.length,
    longTasksOver200Ms:tasks.filter(ms=>ms>200).length,
    maxLongTaskMs:percentile(tasks,1),
    lcpLatestMs:lcp.length?Math.round(lcp.at(-1)*100)/100:null,
    baselineKind:'synthetic-vite-fixture-not-field-CWV',
  };
}

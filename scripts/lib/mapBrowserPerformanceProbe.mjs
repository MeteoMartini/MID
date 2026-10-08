/** Browser-only performance probe for controlled MID map QA. No telemetry or app changes. */
export async function installMapBrowserProbe(page) {
  await page.addInitScript(() => {
    const state={frames:[],longTasks:[],lcpMs:null,lastFrame:null};
    Object.defineProperty(window,'__MID_QA_MAP_PROBE__',{value:state,configurable:false});
    function frame(now){
      if(state.lastFrame!==null){
        const delta=now-state.lastFrame;
        if(Number.isFinite(delta)&&delta>=0&&delta<10000){
          state.frames.push(delta);
          if(state.frames.length>5000)state.frames.shift();
        }
      }
      state.lastFrame=now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    if(typeof PerformanceObserver!=='undefined'){
      const types=PerformanceObserver.supportedEntryTypes||[];
      if(types.includes('longtask'))try{
        new PerformanceObserver(list=>{
          for(const entry of list.getEntries()){
            state.longTasks.push(entry.duration);
            if(state.longTasks.length>500)state.longTasks.shift();
          }
        }).observe({type:'longtask',buffered:true});
      }catch{}
      if(types.includes('largest-contentful-paint'))try{
        new PerformanceObserver(list=>{
          for(const entry of list.getEntries())state.lcpMs=entry.startTime;
        }).observe({type:'largest-contentful-paint',buffered:true});
      }catch{}
    }
  });
}
export async function snapshotMapBrowserProbe(page, phase='map-fixture') {
  const data=await page.evaluate(() => {
    const state=window.__MID_QA_MAP_PROBE__;
    if(!state)return null;
    return {
      frameDurationsMs:[...state.frames],
      longTasksMs:[...state.longTasks],
      lcpMs:state.lcpMs,
      documentReadyMs:performance.now()
    };
  });
  return data?{...data,phase}:null;
}

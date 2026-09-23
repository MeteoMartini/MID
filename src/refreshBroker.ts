type RefreshReason='initial'|'interval'|'focus'|'visible'|'online';

type RefreshChannelOptions={
 key:string;
 intervalMs:number;
 minGapMs:number;
 initialLastRunAt?:number;
 run:(reason:RefreshReason)=>void|Promise<void>;
 includeFocus?:boolean;
 includeOnline?:boolean;
 runImmediately?:boolean;
};

type RefreshChannelState=RefreshChannelOptions&{
 lastRunAt:number;
 nextIntervalAt:number;
};

const channels=new Map<string,RefreshChannelState>();
let heartbeat=0;
const HEARTBEAT_MS=30_000;

function environmentAllowsRefresh(){
 return typeof document==='undefined'||(document.visibilityState!=='hidden'&&typeof navigator!=='undefined'&&navigator.onLine!==false);
}

function invoke(state:RefreshChannelState,reason:RefreshReason,now=Date.now()){
 if(!environmentAllowsRefresh())return;
 if(now-state.lastRunAt<Math.max(0,state.minGapMs))return;
 state.lastRunAt=now;
 state.nextIntervalAt=now+Math.max(HEARTBEAT_MS,state.intervalMs);
 void Promise.resolve(state.run(reason)).catch(()=>undefined);
}

function tick(){
 const now=Date.now();
 for(const state of channels.values())if(now>=state.nextIntervalAt)invoke(state,'interval',now);
}

function onVisibility(){
 if(typeof document!=='undefined'&&document.visibilityState!=='visible')return;
 const now=Date.now();
 for(const state of channels.values())invoke(state,'visible',now);
}

function onFocus(){
 const now=Date.now();
 for(const state of channels.values())if(state.includeFocus!==false)invoke(state,'focus',now);
}

function onOnline(){
 const now=Date.now();
 for(const state of channels.values())if(state.includeOnline!==false)invoke(state,'online',now);
}

function ensureBroker(){
 if(heartbeat||typeof window==='undefined')return;
 heartbeat=window.setInterval(tick,HEARTBEAT_MS);
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('focus',onFocus);
 window.addEventListener('online',onOnline);
}

function releaseBroker(){
 if(channels.size||!heartbeat||typeof window==='undefined')return;
 window.clearInterval(heartbeat);heartbeat=0;
 document.removeEventListener('visibilitychange',onVisibility);
 window.removeEventListener('focus',onFocus);
 window.removeEventListener('online',onOnline);
}

export function subscribeRefreshChannel(options:RefreshChannelOptions){
 const now=Date.now(),state:RefreshChannelState={
  ...options,
  lastRunAt:Number(options.initialLastRunAt)||0,
  nextIntervalAt:now+Math.max(HEARTBEAT_MS,options.intervalMs),
 };
 channels.set(options.key,state);
 ensureBroker();
 if(options.runImmediately!==false)queueMicrotask(()=>{if(channels.get(options.key)===state)invoke(state,'initial')});
 return()=>{if(channels.get(options.key)===state)channels.delete(options.key);releaseBroker()};
}

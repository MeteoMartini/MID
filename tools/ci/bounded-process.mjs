import {spawn} from 'node:child_process';

// POSIX descendants share a dedicated group; closing a parent alone is insufficient.
export function runBounded(command,args,{timeoutMs=360000,graceMs=2000,env=process.env}={}){
 return new Promise((resolve,reject)=>{
  const start=performance.now(),group=process.platform!=='win32';
  const child=spawn(command,args,{stdio:'inherit',env,detached:group});
  let reason='',settled=false,killTimer;
  const kill=signal=>{try{group&&child.pid?process.kill(-child.pid,signal):child.kill(signal)}catch(error){if(error.code!=='ESRCH')console.error('[bounded-process] cleanup:',error.code)}};
  const stop=why=>{if(reason)return;reason=why;kill('SIGTERM');killTimer=setTimeout(()=>{kill('SIGKILL');finish(null,'SIGKILL')},graceMs)};
  const onTerm=()=>stop('parent-SIGTERM'),onInt=()=>stop('parent-SIGINT');
  const timer=setTimeout(()=>stop('deadline'),timeoutMs);
  function finish(code,signal,error){
   if(settled)return;settled=true;clearTimeout(timer);clearTimeout(killTimer);
   process.off('SIGTERM',onTerm);process.off('SIGINT',onInt);
   // A descendant may keep running after its parent exits (including on TERM).
   kill('SIGKILL');
   const report={command,elapsedMs:Math.round(performance.now()-start),code,signal,reason:reason||error?.code||(code===0?'success':'nonzero-exit')};
   console.log('[bounded-process] '+JSON.stringify(report));
   if(code===0&&!reason&&!error)resolve(report);else reject(Object.assign(new Error('Command failed: '+report.reason),{report,cause:error}));
  }
  process.on('SIGTERM',onTerm);process.on('SIGINT',onInt);
  child.once('error',error=>finish(null,null,error));
  child.once('exit',(code,signal)=>finish(code,signal));
 });
}

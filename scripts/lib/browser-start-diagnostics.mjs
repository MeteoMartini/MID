import {readFile} from 'node:fs/promises';

export async function readDevToolsPort(filename){
 let raw;try{raw=await readFile(filename,'utf8')}catch(error){if(error.code==='ENOENT')return 0;throw error}
 const first=raw.split(/\r?\n/,1)[0];
 if(!/^[1-9]\d{0,4}$/.test(first))return 0;
 const port=Number(first);return port<=65535?port:0;
}

// Keep startup failures distinct from UI wait failures, without relaxing waits.
export function browserStartDiagnostics(child){
 let stderr='',failure=null;
 child.stderr?.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-8192)});
 child.once('error',error=>{failure='Chromium spawn failed: '+error.message});
 child.once('exit',(code,signal)=>{failure=`Chromium exited: code=${code??'null'}, signal=${signal??'none'}`});
 return {
  assertRunning(){if(failure)throw new Error(failure+(stderr?'\n'+stderr:''))},
  describe(){return failure||stderr||'No Chromium exit/spawn diagnostic available'},
 };
}

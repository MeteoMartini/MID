import assert from 'node:assert/strict';
import {callCdpFunction} from './lib/cdp-call-function.mjs';
const declaration='function(value){return value}';
for(const value of ['absolute','";window.pwned=true;//','` ${globalThis.pwned=true}',"quote'\\\n\u2028\u2029",null,{key:'data'}]){
 const calls=[];
 const cdp=async(method,params)=>{calls.push({method,params});if(method==='Runtime.evaluate')return{result:{result:{objectId:'window-current'}}};if(method==='Runtime.callFunctionOn')return{result:{result:{value:params.arguments[0].value}}};return{result:{}}};
 assert.deepEqual(await callCdpFunction(cdp,declaration,[value]),value);
 assert.equal(calls[0].params.expression,'window');assert.equal(calls[1].params.functionDeclaration,declaration);assert.deepEqual(calls[1].params.arguments,[{value}]);
 assert.deepEqual(calls.at(-1),{method:'Runtime.releaseObject',params:{objectId:'window-current'}});
}
for(const failure of ['exception','transport']){
 let released=false;
 const cdp=async(method)=>{if(method==='Runtime.evaluate')return{result:{result:{objectId:'id'}}};if(method==='Runtime.releaseObject'){released=true;return{result:{}}}if(failure==='transport')throw new Error('transport failure');return{result:{exceptionDetails:{text:'controlled exception'}}}};
 await assert.rejects(callCdpFunction(cdp,declaration,['data']),failure==='transport'?/transport failure/:/controlled exception/);assert.ok(released);
}
await assert.rejects(callCdpFunction(async()=>({result:{result:{}}}),declaration),/unavailable/);
console.log('CDP arguments: hostile strings stay data, static declaration, result propagation, exceptions and object release passed.');

const {spawn}=await import('node:child_process');
const {browserStartDiagnostics}=await import('./lib/browser-start-diagnostics.mjs');
const child=spawn(process.execPath,['-e',"process.stderr.write('controlled startup failure');process.exit(7)"],{stdio:['ignore','ignore','pipe']});
const monitor=browserStartDiagnostics(child);await new Promise(resolve=>child.once('close',resolve));
assert.throws(()=>monitor.assertRunning(),/code=7[\s\S]*controlled startup failure/);
const missing=spawn('/nonexistent-mid-browser',[],{stdio:['ignore','ignore','pipe']}),missingMonitor=browserStartDiagnostics(missing);await new Promise(resolve=>missing.once('close',resolve));assert.throws(()=>missingMonitor.assertRunning(),/spawn failed.*ENOENT/);
console.log('Browser startup diagnostics: actual nonzero exit, stderr and ENOENT retained without extending waits.');

const {mkdtemp,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
const {readDevToolsPort}=await import('./lib/browser-start-diagnostics.mjs');
const temp=await mkdtemp(join(tmpdir(),'mid-port-metadata-'));
try{
 const file=join(temp,'DevToolsActivePort');assert.equal(await readDevToolsPort(file),0);
 for(const [raw,expected]of [['',0],['0',0],['-1',0],['1.5',0],['0x80',0],['65536',0],['arbitrary',0],['1\n/devtools/browser/id',1],['65535\r\n/id',65535]]){await writeFile(file,raw);assert.equal(await readDevToolsPort(file),expected)}
}finally{await rm(temp,{recursive:true,force:true})}
console.log('Chromium-owned port metadata: missing/partial/invalid values fail closed; valid ports parsed without reserve-close-rebind race.');

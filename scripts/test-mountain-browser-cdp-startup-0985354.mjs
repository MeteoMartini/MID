import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import {readDevToolsPort,browserStartDiagnostics} from './lib/browser-start-diagnostics.mjs';

const source=await readFile(new URL('./test-mountain-visual-acceptance-18213.mjs',import.meta.url),'utf8');
const test='scripts/test-mountain-browser-cdp-startup-0985354.mjs';
const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${key}: browser-start regression not registered`);
for(const token of ["'--remote-debugging-port=0'","'--remote-debugging-address=127.0.0.1'",'DevToolsActivePort','readDevToolsPort(','browserStartDiagnostics(chrome)','startup.assertRunning()','startup.describe()','localCdpEndpoint(endpoint.info.webSocketDebuggerUrl,endpoint.port)',"stdio:['ignore','ignore','pipe']"])
 assert.ok(source.includes(token),`Missing safe Chromium start contract: ${token}`);
// A single transient Chromium startup failure is retried from a freshly
// isolated profile; a second failure still blocks the required visual gate.
for(const token of ['for(let attempt=1;attempt<=2;attempt++)',"await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100})",'await mkdir(profile,{recursive:true})',"if(attempt===2)throw new Error('Chromium-CDP-Start fehlgeschlagen:","await Promise.race([once(chrome,'exit'),delay(1800)])",'startupFailures.join'])
 assert.ok(source.includes(token),`Unbounded or non-isolated Chromium startup recovery: ${token}`);
assert.ok(source.includes('},45000);'),'Each Chromium startup attempt must keep its original bounded 45-second wait.');
for(const forbidden of ['reserveLoopbackPort','createServer','--remote-debugging-port=${remotePort}'])assert.ok(!source.includes(forbidden),`Unsafe port reuse in mountain test: ${forbidden}`);
for(const token of ['const viewports=[',"const themes=['light','dark']",'Page.captureScreenshot','Sölden-Winterprofil','Stundenkarten je Test-Viewport'])
 assert.ok(source.includes(token),`Mountain visual acceptance coverage must be preserved: ${token}`);

for(const token of ['requestAnimationFrame(()=>requestAnimationFrame(resolve))','document.elementFromPoint(x,y)','point?.receivesPointer','windUnitDiagnostic()',"localStorage.getItem('windUnit')",'Persistente Wind-Auswahl nach erneutem Öffnen'])
 assert.ok(source.includes(token),`Bergwetter-Einheitenwahl muss echte Treffer, React-Status und Persistenz statt erzwungenem DOM-Klick prüfen: ${token}`);
const pushBrowserSource=await readFile(new URL('./test-push-settings-browser-0985286.mjs',import.meta.url),'utf8');
for(const token of ["for(let attempt=1;attempt<=2;attempt++)","await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100})","--remote-debugging-port=0","readDevToolsPort(join(profile,'DevToolsActivePort'))","chromeStartupFailures.join","assert.deepEqual(errors,[],'browser exceptions')","[320,740],[390,844],[844,390],[768,1024],[1024,768],[1440,1000]"])
 assert.ok(pushBrowserSource.includes(token),'Push-Settings-Browser muss isolierten Chromium-Neustart und vollständige Interaktionsmatrix erhalten: '+token);
const dir=await mkdtemp(join(tmpdir(),'mid-mountain-cdp-check-'));
try{
 const file=join(dir,'DevToolsActivePort');
 assert.equal(await readDevToolsPort(file),0,'Absent port is not an invented port');
 for(const [raw,port] of [['9222\n/devtools/browser/abc\n',9222],['1\n',1],['65535\n',65535],['0\n',0],['65536\n',0],['not-a-port\n',0],['9222  \n',0]]){
  await writeFile(file,raw);assert.equal(await readDevToolsPort(file),port,`Invalid CDP port must not be accepted: ${JSON.stringify(raw)}`);
 }
}finally{await rm(dir,{recursive:true,force:true})}
const child=new EventEmitter();child.stderr=new EventEmitter();
const startup=browserStartDiagnostics(child);startup.assertRunning();
child.stderr.emit('data',Buffer.from('CHROMIUM_FATAL: profile could not initialize'));
assert.match(startup.describe(),/CHROMIUM_FATAL/,'Capture startup stderr rather than generic wait timeout');
child.emit('exit',87,null);
assert.throws(()=>startup.assertRunning(),/Chromium exited: code=87[\s\S]*CHROMIUM_FATAL/);
const failed=new EventEmitter();failed.stderr=new EventEmitter();
const spawnFailure=browserStartDiagnostics(failed);failed.emit('error',new Error('ENOENT executable'));
assert.throws(()=>spawnFailure.assertRunning(),/Chromium spawn failed: ENOENT executable/);
console.log('MID .355: atomic Chromium port 0, strict loopback CDP, isolated profile, startup evidence, invalid-port rejection and unchanged mountain visual matrix verified.');

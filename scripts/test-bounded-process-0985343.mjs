import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runBounded} from '../tools/ci/bounded-process.mjs';
assert.equal((await runBounded(process.execPath,['-e','process.exit(0)'],{timeoutMs:2000})).reason,'success');
await assert.rejects(runBounded(process.execPath,['-e','process.exit(7)'],{timeoutMs:2000}),e=>e.report.code===7&&e.report.reason==='nonzero-exit');
await assert.rejects(runBounded('/nonexistent-mid-command',[],{timeoutMs:2000}),e=>e.report.reason==='ENOENT');
if(process.platform!=='win32'){
 const root=await mkdtemp(join(tmpdir(),'mid-process-group-')),pidFile=join(root,'pid');
 try{
  // Both processes ignore TERM; killing only the parent leaves this grandchild alive.
  const grandchild=`require('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`;
  const parent=`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'inherit'});process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`;
  const start=performance.now();
  await assert.rejects(runBounded(process.execPath,['-e',parent],{timeoutMs:1500,graceMs:300}),e=>e.report.reason==='deadline');
  assert.ok(performance.now()-start<5000,'Deadline must remain bounded even with inherited descriptors');
  const pid=Number(await readFile(pidFile,'utf8'));
  let alive=true;
  for(let i=0;i<30&&alive;i++){
   try{const status=await readFile(`/proc/${pid}/stat`,'utf8');alive=!status.slice(status.lastIndexOf(')')+2).startsWith('Z')}catch{alive=false}
   if(alive)await new Promise(r=>setTimeout(r,30));
  }
  assert.equal(alive,false,'TERM-resistant grandchild must be killed too');
 }finally{await rm(root,{recursive:true,force:true})}
}
console.log('Bounded process: exit, spawn error, deadline, inherited descriptors and TERM-resistant descendant verified.');

import {regressionSuite} from './regression-suite.mjs';
import {regressionExecutionPlan} from './regression-execution.mjs';
import {regressionShard} from './regression-shards.mjs';
import {spawn} from 'node:child_process';
import {writeFile,appendFile} from 'node:fs/promises';
import {availableParallelism} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),directory=path.join(root,'scripts');
const localBin=path.join(root,'node_modules','.bin');
const childEnv={...process.env,PATH:[localBin,process.env.PATH??''].filter(Boolean).join(path.delimiter)};
const completeTests=await regressionSuite(root),shardName=process.env.MID_REGRESSION_SHARD??'all',tests=await regressionShard(root,shardName),plan=await regressionExecutionPlan(root,tests);
const requested=Number.parseInt(process.env.MID_REGRESSION_JOBS??'',10),jobs=Number.isInteger(requested)&&requested>0?Math.min(requested,8):Math.max(1,Math.min(4,availableParallelism()));
const failures=[],timings=[],maxBuffer=16*1024*1024;let completed=0;
function appendLimited(current,chunk){if(current.length>=maxBuffer)return current;return current+chunk.toString('utf8').slice(0,maxBuffer-current.length)}
function runOne(name){return new Promise(resolve=>{const start=performance.now(),child=spawn(process.execPath,[path.join(directory,name)],{cwd:root,env:childEnv,stdio:['ignore','pipe','pipe']});let stdout='',stderr='',spawnError;child.stdout.on('data',chunk=>stdout=appendLimited(stdout,chunk));child.stderr.on('data',chunk=>stderr=appendLimited(stderr,chunk));child.on('error',error=>{spawnError=error});child.on('close',(code,signal)=>resolve({name,status:Number.isInteger(code)?code:1,signal,stdout,stderr,error:spawnError,ms:performance.now()-start}))})}
function record(result){timings.push({name:result.name,ms:result.ms});completed++;if(result.status!==0){failures.push(result.name);console.error('\nFAIL '+result.name+'\n'+(result.stdout??'')+(result.stderr??'')+(result.error??'')+(result.signal?'Signal: '+result.signal+'\n':''))}else if(process.env.MID_REGRESSION_VERBOSE==='1')process.stdout.write(result.stdout??'');if(completed%50===0||completed===tests.length)console.log('Regressionen: '+completed+'/'+tests.length+', '+failures.length+' Fehler')}
async function runParallel(names,concurrency){let next=0;async function worker(){while(true){const index=next++;if(index>=names.length)return;record(await runOne(names[index]))}}await Promise.all(Array.from({length:Math.min(concurrency,names.length||1)},()=>worker()))}
const started=performance.now();
console.log('Regression-Shard: '+shardName+' · '+tests.length+'/'+completeTests.length+' Tests.');
console.log('Regression-Plan: '+plan.parallel.length+' parallel-sicher · '+plan.serial.length+' seriell · maximal '+jobs+' parallele Prozesse.');
await runParallel(plan.parallel,jobs);
for(const name of plan.serial)record(await runOne(name));
const elapsedMs=performance.now()-started;
console.log('Suite: '+(elapsedMs/1000).toFixed(1)+' s; langsamste Prüfungen: '+timings.sort((a,b)=>b.ms-a.ms).slice(0,5).map(row=>row.name+' '+(row.ms/1000).toFixed(1)+' s').join('; '));
if(process.env.GITHUB_ACTIONS==='true'){
 const report={schema:1,eventSha:process.env.GITHUB_SHA,shard:shardName,mapGroup:process.env.MID_MAP_QA_SHARD||'',tests:tests.length,failures:failures.length,elapsedMs,timings};
 await writeFile('/tmp/mid-regression-timings.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`\n### Regressionen: ${shardName} ${report.mapGroup}\n\n${tests.length} Tests · ${failures.length} Fehler · ${(elapsedMs/1000).toFixed(1)} s\n\n| Test | Sekunden |\n|---|---:|\n${timings.slice(0,10).map(r=>`| ${r.name} | ${(r.ms/1000).toFixed(1)} |`).join('\n')}\n`);
}
if(failures.length){const order=new Map(tests.map((name,index)=>[name,index]));failures.sort((a,b)=>(order.get(a)??0)-(order.get(b)??0));console.error('\n'+failures.length+' von '+tests.length+' Regressionstests fehlgeschlagen: '+failures.join(', '));process.exit(1)}
console.log('\nAlle '+tests.length+' Tests des Shards '+shardName+' bestanden.');

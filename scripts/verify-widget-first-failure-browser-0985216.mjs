import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,chmod,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const browser=process.env.MID_BROWSER_EXECUTABLE;
if(!browser)throw new Error('MID_BROWSER_EXECUTABLE required');
const temp=await mkdtemp(join(tmpdir(),'mid-first-failure-'));
let failed=true;
const server=createServer((request,response)=>{response.setHeader('Content-Type','text/html');response.end(`<meta name="mid-version" content="fixture"><div class="weatherwidget" style="width:700px;height:400px"><canvas width="700" height="400"></canvas></div><script>const c=document.querySelector('canvas').getContext('2d');for(let i=0;i<12000;i++){c.fillStyle='hsl('+i%360+' 65% 50%)';c.fillRect(i*17%700,i*31%400,9,9)}document.documentElement.dataset.midWidgetReady='${failed?'error':'ready'}';${failed?"document.documentElement.dataset.midWidgetError='controlled fixture failure'":''}</script>`)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const wrapper=join(temp,'browser.mjs'),output=join(temp,'widget.png'),report=join(temp,'diagnostics','widget.png.first-failure.json');
await writeFile(wrapper,`#!/usr/bin/env node\nimport{spawn}from'node:child_process';const args=process.argv.slice(2);args[args.length-1]=${JSON.stringify(`http://127.0.0.1:${server.address().port}/?widget=fixture`)};const child=spawn(${JSON.stringify(browser)},args,{stdio:'inherit'});process.on('SIGTERM',()=>child.kill());child.on('exit',code=>process.exit(code??1));\n`);await chmod(wrapper,0o755);
async function capture(){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/widget-export/capture-widget.mjs','--url','https://www.midwx.app/?widget=malatya','--output',output,'--browser',wrapper],{env:{...process.env,MID_STABLE_SHA:'fixture-sha',MID_PUBLIC_VERSION:'fixture'},stdio:'pipe'});let stderr='';child.stderr.on('data',x=>stderr+=x);child.once('error',reject);child.once('exit',code=>resolve({code,stderr}))})}
try{
 const first=await capture();assert.notEqual(first.code,0);const bytes=await readFile(report);const state=JSON.parse(bytes);assert.equal(state.state.status,'error');assert.equal(state.stableSha,'fixture-sha');assert.equal(state.screenshotAvailable,true);assert.ok((await readFile(join(temp,'diagnostics','widget.png.first-failure.png'))).length>1000);
 const second=await capture();assert.notEqual(second.code,0);assert.deepEqual(await readFile(report),bytes,'Retry must not overwrite original failure');
 failed=false;const recovery=await capture();assert.equal(recovery.code,0,recovery.stderr);assert.ok((await readFile(output)).length>20000);assert.deepEqual(await readFile(report),bytes,'Recovery must retain original failure');
 console.log('MID216: real Chromium/CDP first-failure screenshot, immutable diagnostics across retry and successful PNG recovery passed.');
}finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true})}

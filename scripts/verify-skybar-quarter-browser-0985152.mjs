import {build} from 'esbuild';
import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid152-sky-')),read=p=>readFileSync(join(root,p));
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim(),base=dirname(dirname(realpathSync(cli))),{chromium}=await import(pathToFileURL(join(base,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});

const now=Date.UTC(2026,9,3,13,30),baseHour={temperature:22,apparent:22,humidity:50,dewPoint:11,pressure:1015,wind:3,gust:7,direction:45,cloud:60,lowCloud:20,midCloud:20,highCloud:20,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,isDay:true,sunshineDuration:3600};
const hours=Array.from({length:27},(_,i)=>({...baseHour,epoch:now+i*3600000,time:new Date(now+i*3600000).toISOString()}));
const quarters=Array.from({length:7},(_,i)=>({...baseHour,epoch:now+i*900000,time:new Date(now+i*900000).toISOString(),cloud:i<3?60:35,sunshineDuration:900}));
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'./src/ForecastCockpit';Date.now=()=>${now};createRoot(document.getElementById('root')).render(<section className='forecast-cockpit modern-workspace' data-workspace-mode='true'><div className='cockpit-body'><ShortTermRibbon hours={${JSON.stringify(hours)}} minutes15={${JSON.stringify(quarters)}} climate={[]} timezone='UTC' unit='kn' onSelectedDate={()=>{}} anchor={{active:false}} location={{latitude:50.82,longitude:7.04,elevation:50}} showDwdPrecipitationTypeRadar={false} skybarDisplayMode={location.search.includes('squares')?'squares':'band'}/></div></section>);`,resolveDir:root,loader:'tsx'},plugins:[{name:'qa-export',setup(build){build.onLoad({filter:/ForecastCockpit\.tsx$/},()=>({contents:read('src/ForecastCockpit.tsx').toString()+'\nexport{ShortTermRibbon};',loader:'tsx',resolveDir:join(root,'src')}))}}],bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const html=`<!doctype html><html data-mid-design='next' data-theme='light'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{padding:12px;margin:0}#root{max-width:1200px;margin:auto}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`;
const server=createServer((req,res)=>{const url=req.url.split('?')[0];if(url==='/')res.end(html);else if(url==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(sheets.some(s=>url==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(read(url.slice(1)))}else{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,412,844,1024,1440])for(const theme of ['light','dark'])for(const mode of ['band','squares']){
  const page=await browser.newPage({viewport:{width,height:1000}});await page.goto(`http://127.0.0.1:${server.address().port}/?${mode}`);await page.waitForSelector('.cockpit-now90-slot');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const metrics=await page.evaluate(mode=>{const track=document.querySelector('.cockpit-now90-track'),svg=document.querySelector('.cockpit-now90-sky svg'),profile=document.querySelector('[data-mid-skybar="profile"]');return{overflow:document.documentElement.scrollWidth>innerWidth+1,slotCount:document.querySelectorAll('.cockpit-now90-slot').length,svgWidth:svg.getBoundingClientRect().width,axisWidth:document.querySelector('.cockpit-now90-axis').getBoundingClientRect().width,nowTitles:[...svg.querySelectorAll('title')].map(t=>t.textContent),profileTitles:[...profile.querySelectorAll('title')].map(t=>t.textContent),colors:[...svg.querySelectorAll('[data-skybar-level]')].map(e=>e.getAttribute('fill')),profileColors:[...profile.querySelectorAll('[data-skybar-level]')].map(e=>e.getAttribute('fill'))}},mode);
  assert.equal(metrics.overflow,false,`${width} ${theme} ${mode}: overflow`);assert.equal(metrics.slotCount,6);assert.ok(Math.abs(metrics.svgWidth-metrics.axisWidth)<2);
  if(mode==='band'){assert.equal(metrics.colors[0],'#aeb3b9');assert.equal(metrics.colors[1],'#ffc229');assert.deepEqual(metrics.profileColors.slice(0,2),metrics.colors.slice(0,2));assert.equal(metrics.profileTitles[0],metrics.nowTitles[0]);assert.equal(metrics.profileTitles[1],metrics.nowTitles[1]);}
  await page.screenshot({path:join(out,`${mode}-${width}-${theme}.png`)});await page.close();
 }
 console.log('MID152 browser: 24 viewport/theme/mode cases; quarter colors and titles identical across strips, scroll-axis registration and no page overflow. QA '+out);
}finally{await browser.close();await new Promise(r=>server.close(r))}

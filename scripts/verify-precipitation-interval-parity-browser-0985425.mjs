import {build} from 'esbuild';
import {readFileSync,mkdtempSync,realpathSync,rmSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid-precip-browser-')),read=p=>readFileSync(join(root,p),'utf8');
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:15000}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
const now=Date.parse('2026-11-04T10:00Z');
const hour=i=>({time:new Date(now+i*3600000).toISOString(),epoch:now+i*3600000,temperature:10,apparent:10,dewPoint:5,humidity:80,pressure:1010,isDay:true,code:61,cloud:90,precipitation:.8,rain:.8,showers:0,snowfall:0,probability:80,wind:5,gust:8,direction:180,visibility:20000,uvIndex:1,sunshineDuration:0});
const hours=Array.from({length:52},(_,i)=>hour(i-2)),minutes15=Array.from({length:112},(_,i)=>({...hour((i-8)/4),precipitation:.2,rain:.2}));
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'./src/ForecastCockpit';Date.now=()=>${now};createRoot(document.getElementById('root')).render(<section className="app"><ShortTermRibbon hours={${JSON.stringify(hours)}} minutes15={${JSON.stringify(minutes15)}} climate={[]} timezone="UTC" unit="kn" onSelectedDate={()=>{}} anchor={{active:false}} canonicalNowcast location={{latitude:50.8,longitude:7.1,timezone:'UTC'}} showDwdPrecipitationTypeRadar={false} modelInfo={null}/></section>);`,resolveDir:root,loader:'tsx'},plugins:[{name:'real-cockpit-export',setup(b){b.onLoad({filter:/ForecastCockpit\.tsx$/},()=>({contents:read('src/ForecastCockpit.tsx')+'\nexport {ShortTermRibbon};',loader:'tsx',resolveDir:join(root,'src')}))}}],bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...read('src/main.tsx').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const html=`<!doctype html><html data-mid-design="next"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${sheets.map(p=>read('src/'+p)).join('\n')}</style></head><body><div id="root"></div><script src="/qa.js" type="module"></script></body></html>`;
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/qa.js'?'text/javascript':'text/html');res.end(req.url==='/qa.js'?readFileSync(join(out,'qa.js')):html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,430,1440])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:theme});page.setDefaultTimeout(10000);
  await page.addInitScript(theme=>{document.addEventListener('DOMContentLoaded',()=>document.documentElement.dataset.theme=theme)},theme);
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load',timeout:15000});
  const slot=page.locator('.cockpit-now90-slot').first();await slot.waitFor({timeout:10000});
  assert.match(await slot.getAttribute('title'),/mäßiger Regen/);
  await slot.click();
  assert.match(await page.locator('.mid-we-now90-selected').innerText(),/mäßiger Regen/);
  assert.match(await page.locator('.cockpit-now90-sky').textContent(),/0\.8 mm\/h/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Document must not overflow');
  console.log(`PASS real ShortTermRibbon ${width}px ${theme}: 0.2mm/15min, 0.8mm/h, moderate icon/detail/Skybar inputs; no horizontal overflow`);
  if(process.env.MID_PRECIP_EVIDENCE_DIR){mkdirSync(process.env.MID_PRECIP_EVIDENCE_DIR,{recursive:true});if(width===320||width===1440)await page.screenshot({path:join(process.env.MID_PRECIP_EVIDENCE_DIR,`${width}-${theme}.png`),fullPage:true})}
  await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));rmSync(out,{recursive:true,force:true})}

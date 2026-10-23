import {createServer} from 'vite';
import {transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {realpathSync,readFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(!process.env.MID_CHROMIUM_EXECUTABLE)execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const start=Date.UTC(2026,9,23,10),peak=83.7;
const hours=Array.from({length:28},(_,i)=>({epoch:start+i*3600000,time:new Date(start+i*3600000).toISOString(),temperature:15,apparent:14,humidity:65,dewPoint:8,pressure:1011,wind:12,gust:i===8?peak:24,direction:270,cloud:25,lowCloud:10,midCloud:10,highCloud:10,visibility:30000,precipitation:i===4?2.7:0,rain:i===4?2.7:0,showers:0,snowfall:0,probability:i===4?80:0,code:i===4?61:1,isDay:true,sunshineDuration:1800,uvIndex:1}));
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'/src/ForecastCockpit.tsx';Date.now=()=>${start};const q=new URLSearchParams(location.search);document.documentElement.dataset.theme=q.get('theme');document.documentElement.dataset.midDesign='next';createRoot(document.getElementById('root')).render(<div className='app'><section className='forecast-cockpit modern-workspace' data-workspace-mode='true'><div className='cockpit-body'><ShortTermRibbon hours={${JSON.stringify(hours)}} minutes15={[]} climate={[]} timezone='UTC' unit={q.get('unit')} onSelectedDate={()=>{}} anchor={{active:false}} canonicalNowcast={true} location={{latitude:50.82,longitude:7.04,elevation:50}} showDwdPrecipitationTypeRadar={false}/></div></section></div>);`;
const css=[...readFileSync('src/main.tsx','utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>`<link rel="stylesheet" href="/src/${m[1]}">`).join('');
const compiled=await transform(entry,{loader:'tsx',jsx:'automatic',format:'esm'});
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{name:'round-wind-fixture',enforce:'pre',transform(code,id){if(id.split('?')[0]===join(process.cwd(),'src/ForecastCockpit.tsx'))return code+'\nexport{ShortTermRibbon};';},configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url?.startsWith('/__wind316')){res.setHeader('Content-Type','text/html');res.end(`<html><meta name="viewport" content="width=device-width,initial-scale=1">${css}<body style="margin:0"><div id="root"></div><script type="module" src="/qa-wind316.tsx"></script></body></html>`)}else next()})},resolveId(id){if(id==='/qa-wind316.tsx')return '\0wind316.tsx'},load(id){if(id==='\0wind316.tsx')return compiled.code}}]});await server.listen();
const browser=await chromium.launch({...(process.env.MID_CHROMIUM_EXECUTABLE?{executablePath:process.env.MID_CHROMIUM_EXECUTABLE}:{}),headless:true,args:['--no-sandbox']}),out='/tmp/mid316-wind-qa';mkdirSync(out,{recursive:true});let count=0;
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[320,740],[390,844],[844,390],[768,1024],[1024,768],[1440,900]])for(const theme of ['light','dark'])for(const [unit,factor]of [['kn',1],['kmh',1.852],['ms',.514444],['mph',1.15078]]){
  await page.setViewportSize({width,height});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__wind316?unit=${unit}&theme=${theme}`);await page.locator('.profile-axis.wind-axis text').first().waitFor();
  const ticks=(await page.locator('.profile-axis.wind-axis text').allTextContents()).map(v=>Number(v.replace(',','.')));
  assert.ok(ticks.every(Number.isInteger),'Round visible wind ticks');assert.ok(Math.max(...ticks)>=peak*factor,'Extreme gust is inside scale');assert.ok(ticks.includes(0));
  const rain=(await page.locator('.profile-axis.precipitation-axis text').allTextContents()).map(v=>Number(v.replace(',','.')));assert.ok(Math.max(...rain)>=2.7);assert.ok(!rain.some(v=>v===.75||v===1.75));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow');
  if(unit==='kmh')await page.locator('.cockpit-weather-profile').screenshot({path:`${out}/${width}-${theme}.png`});count++;
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${count} real 24-h profile viewport/theme/unit cases: round wind/rain ticks, 83.7 kt gust retained, no overflow · ${out}`);
}finally{await browser.close();await server.close()}

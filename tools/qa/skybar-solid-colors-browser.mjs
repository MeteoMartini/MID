// Real browser qualification of production components. No runtime dependency.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';

const root=process.cwd(),out=process.env.MID_SKYBAR_QA_DIR??mkdtempSync(join(tmpdir(),'mid-solid-colors-'));
mkdirSync(out,{recursive:true});
const {chromium}=await import(process.env.MID_PLAYWRIGHT_MODULE??'playwright');
const entry=`import React from'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'./src/ForecastCockpit';import{detailSkyBarTimedSegments,detailSkyBarHourCells}from'./src/detailSkyBar';import{SkyBarSegmentsSvg,SkyBarHourCellsSvg}from'./src/SkyBarSegments';
const q=new URLSearchParams(location.search),mode=q.get('mode')??'band',kind=q.get('kind')??'sun',start=Date.UTC(2026,5,21,10),step=3600000,shares=[.55,.68,.80,.95];Date.now=()=>start;
function sample(i,duration=step){const share=shares[Math.floor(i/2)%4],direct=i%2===0;return{epoch:start+i*duration,time:new Date(start+i*duration).toISOString(),timezone:'Europe/Oslo',precipitationIntervalStartEpoch:start+i*duration,precipitationIntervalEndEpoch:start+(i+1)*duration,isDay:true,temperature:10,apparent:9,humidity:60,dewPoint:3,pressure:1010,wind:3,gust:6,direction:180,cloud:kind==='cloud'?share*100:direct?0:(1-share)*100,lowCloud:10,midCloud:0,highCloud:0,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:1,sunshineDuration:direct&&kind==='sun'?share*duration/1000:null}}
window.__qa=[];function Track({hours}){const rows=Array.from({length:hours},(_,i)=>sample(i)),segments=detailSkyBarTimedSegments(rows,start,start+hours*step,0,0,1000,12);window.__qa.push({hours,segments});return <section data-track={hours}><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 24' role='img' aria-label={hours+' Stunden Skybar'}><SkyBarSegmentsSvg segments={segments}/></svg></section>}
const hours=Array.from({length:337},(_,i)=>sample(i));createRoot(document.getElementById('root')).render(<><section className='forecast-cockpit modern-workspace' data-workspace-mode='true'><div className='cockpit-body'><ShortTermRibbon hours={hours.slice(0,27)} minutes15={Array.from({length:7},(_,i)=>sample(i,step/4))} climate={[]} timezone='Europe/Oslo' unit='kn' onSelectedDate={()=>{}} anchor={{active:false}} location={{latitude:69.65,longitude:18.96,timezone:'Europe/Oslo'}} showDwdPrecipitationTypeRadar={false} skybarDisplayMode={mode}/></div></section>{[12,24,168,336].map(n=><Track key={n} hours={n}/>)}<svg data-color-cells='true' viewBox='0 0 1000 24'><SkyBarHourCellsSvg cells={detailSkyBarHourCells(hours.slice(0,8))} left={0} right={0} chartW={1000} centerY={12}/></svg></>);`;
await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},plugins:[{name:'qa-export',setup(b){b.onLoad({filter:/ForecastCockpit\.tsx$/},()=>({contents:readFileSync('src/ForecastCockpit.tsx','utf8')+'\nexport{ShortTermRibbon};',loader:'tsx',resolveDir:join(root,'src')}))}}],bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...readFileSync('src/main.tsx','utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang='de' data-mid-design='next' data-theme='${u.searchParams.get('theme')==='dark'?'dark':'light'}'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{margin:0;padding:8px}#root{max-width:1200px;margin:auto}[data-track] svg,[data-color-cells]{display:block;width:100%}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`)}
 else if(u.pathname==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(readFileSync(join(out,'qa.js')))}
 else if(sheets.some(s=>u.pathname==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(readFileSync(join(root,u.pathname.slice(1))))}
 else{res.statusCode=404;res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}),results=[];
try{
 for(const [width,height] of [[320,740],[390,844],[430,932],[844,390],[834,1194],[1194,834],[1024,768],[1440,900]])for(const theme of ['light','dark'])for(const mode of ['band','squares'])for(const kind of ['sun','cloud']){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1024}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?theme=${theme}&mode=${mode}&kind=${kind}`);await page.waitForSelector('[data-track="336"] svg');
  const result=await page.evaluate(async()=>{
   const tracks=[];
   for(const track of window.__qa){
    const svg=document.querySelector('[data-track="'+track.hours+'"] svg'),image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));await image.decode();
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=24;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,1000,24);
    const pixels=track.segments.map(s=>({color:s.color,opacity:s.opacity,width:s.strokeWidth,pixel:[...ctx.getImageData(Math.floor((s.x1+s.x2)/2),12,1,1).data]}));
    tracks.push({hours:track.hours,pixels,png:canvas.toDataURL('image/png').startsWith('data:image/png;base64,iVBOR'),titles:[...svg.querySelectorAll('title')].map(t=>t.textContent),styles:[...svg.querySelectorAll('[data-skybar-level]')].map(g=>({fill:getComputedStyle(g).fill,opacity:getComputedStyle(g).opacity}))});
   }
   const cells=[...document.querySelectorAll('[data-color-cells] [data-skybar-hour]')].map(g=>{const rect=g.querySelectorAll('rect')[1];return{fill:rect.getAttribute('fill'),opacity:getComputedStyle(rect).opacity}});
   return{overflow:document.documentElement.scrollWidth>innerWidth+1,slots:document.querySelectorAll('.cockpit-now90-slot').length,tracks,cells};
  });
  assert.deepEqual(errors,[]);assert.equal(result.overflow,false,`${width}/${height}/${theme}/${mode}/${kind}: overflow`);assert.equal(result.slots,6);
  for(const track of result.tracks){
   assert.equal(track.png,true);assert.equal(track.titles.length,track.hours);
   assert.deepEqual([...new Set(track.pixels.map(p=>p.width))].sort(),[2.4,3.6,4.8,6]);
   const expected=kind==='sun'?[255,194,41,255]:[174,179,185,255];
   for(const p of track.pixels){assert.equal(p.opacity,1);assert.deepEqual(p.pixel,expected,'Export color must be exact and independent of source/thickness/theme')}
   for(const style of track.styles){assert.equal(style.opacity,'1');assert.equal(style.fill,kind==='sun'?'rgb(255, 194, 41)':'rgb(174, 179, 185)')}
   if(kind==='sun'){assert.ok(track.titles.some(t=>t.includes('Sonnenscheindauer')));assert.ok(track.titles.some(t=>t.includes('Wolkenlücken')))}
  }
  for(let i=0;i<8;i+=2)assert.deepEqual(result.cells[i],result.cells[i+1],'Same square class has same fill/opacity across provenance');
  assert.equal(new Set(result.cells.map(c=>c.fill)).size,4,'Square class shades preserved');
  if(width===390&&mode==='band')await page.screenshot({path:join(out,kind+'-'+theme+'.png'),fullPage:true});
  results.push({width,height,theme,mode,kind,tracks:4,svgPng:true,exactColors:true,overflow:false});await page.close();
 }
 const report={schema:1,version:'0.9.85.358',browser:browser.version(),kind:'production ShortTermRibbon/shared SVG renderer fixture, not physical devices',cases:results.length,trackChecks:results.length*4,results};
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.cases,trackChecks:report.trackChecks,browser:report.browser,report:join(out,'report.json')}));
}finally{await browser.close();await new Promise(r=>server.close(r))}

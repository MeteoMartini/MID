// Optional real-browser qualification. No application/runtime dependency added.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),out=process.env.MID_SKYBAR_QA_DIR??mkdtempSync(join(tmpdir(),'mid-polar-browser-'));
mkdirSync(out,{recursive:true});
const {chromium}=await import(process.env.MID_PLAYWRIGHT_MODULE??'playwright');
const {outputFiles}=await build({entryPoints:['src/astronomy.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {astronomicalIsDayAt,solarTimelineWindow}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const HOUR=3600000,locations={tromso:{latitude:69.65,longitude:18.96,timezone:'Europe/Oslo'},berlin:{latitude:52.52,longitude:13.405,timezone:'Europe/Berlin'}};
const scenarios=[['polar-day','2026-06-21T10:00:00Z','tromso'],['polar-night','2026-12-21T10:00:00Z','tromso'],['single-rise','2026-05-15T22:00:00Z','tromso'],['reversed-events','2026-05-16T22:00:00Z','tromso'],['spring-DST','2026-03-28T23:00:00Z','berlin'],['autumn-DST','2026-10-24T22:00:00Z','berlin']].map(([id,date,place])=>{
 const location=locations[place],start=Date.parse(date),sample=(epoch,step)=>({epoch,time:new Date(epoch).toISOString(),timezone:location.timezone,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+step,isDay:astronomicalIsDayAt(epoch,location,false),temperature:10,apparent:9,humidity:60,dewPoint:3,pressure:1010,wind:3,gust:6,direction:180,cloud:20,lowCloud:10,midCloud:0,highCloud:0,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:1,sunshineDuration:null});
 return{id,start,location,hours:Array.from({length:337},(_,i)=>sample(start+i*HOUR,HOUR)),quarters:Array.from({length:7},(_,i)=>sample(start+i*HOUR/4,HOUR/4))};
});
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{ShortTermRibbon}from'./src/ForecastCockpit';import{detailSkyBarTimedSegments,detailSkyBarHourCells}from'./src/detailSkyBar';import{SkyBarSegmentsSvg,SkyBarHourCellsSvg}from'./src/SkyBarSegments';import{solarTimelineWindow}from'./src/astronomy';const fixtures=${JSON.stringify(scenarios)},q=new URLSearchParams(location.search),f=fixtures.find(s=>s.id===q.get('case'));Date.now=()=>f.start;const mode=q.get('mode')??'band';window.__qa=[];function Track({hours}){const end=f.start+hours*3600000,rows=f.hours.slice(0,hours),sky=solarTimelineWindow(f.start,end,f.location),segments=detailSkyBarTimedSegments(rows,f.start,end,0,0,1000,12,sky.nightBands);window.__qa.push({hours,segments,nightBands:sky.nightBands});return <section data-track={hours}><svg viewBox='0 0 1000 24' role='img' aria-label={hours+' Stunden Skybar'}><SkyBarSegmentsSvg segments={segments}/></svg></section>}createRoot(document.getElementById('root')).render(<><section className='forecast-cockpit modern-workspace' data-workspace-mode='true'><div className='cockpit-body'><ShortTermRibbon hours={f.hours.slice(0,27)} minutes15={f.quarters} climate={[]} timezone={f.location.timezone} unit='kn' onSelectedDate={()=>{}} anchor={{active:false}} location={f.location} showDwdPrecipitationTypeRadar={false} skybarDisplayMode={mode}/></div></section>{[12,24,168,336].map(hours=><Track key={hours} hours={hours}/>)}</>);`;
await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},plugins:[{name:'qa-export',setup(b){b.onLoad({filter:/ForecastCockpit\.tsx$/},()=>({contents:readFileSync('src/ForecastCockpit.tsx','utf8')+'\nexport{ShortTermRibbon};',loader:'tsx',resolveDir:join(root,'src')}))}}],bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...readFileSync('src/main.tsx','utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const server=createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang='de' data-mid-design='next' data-theme='${u.searchParams.get('theme')}'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{margin:0;padding:8px}#root{max-width:1200px;margin:auto}[data-track] svg{display:block;width:100%}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`)}else if(u.pathname==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(sheets.some(s=>u.pathname==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(readFileSync(join(root,u.pathname.slice(1))))}else{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
const results=[];
try{
 for(const width of [320,390,430,834,1024,1440])for(const theme of ['light','dark'])for(const mode of ['band','squares'])for(const fixture of scenarios){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<1024}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?case=${fixture.id}&theme=${theme}&mode=${mode}`);await page.waitForSelector('[data-track="336"] svg');
  const result=await page.evaluate(async()=>{
   const svg=document.querySelector('[data-track="24"] svg'),xml=new XMLSerializer().serializeToString(svg),image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml)));await image.decode();
   const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=24;canvas.getContext('2d').drawImage(image,0,0,1000,24);
   return{overflow:document.documentElement.scrollWidth>innerWidth+1,slots:document.querySelectorAll('.cockpit-now90-slot').length,tracks:window.__qa,exportMidPixel:[...canvas.getContext('2d').getImageData(500,12,1,1).data],pngPrefix:canvas.toDataURL('image/png').slice(0,30),titles:[...svg.querySelectorAll('title')].map(t=>t.textContent)};
  });
  assert.deepEqual(errors,[]);assert.equal(result.overflow,false,`${width}/${theme}/${mode}/${fixture.id}: overflow`);assert.equal(result.slots,6);assert.equal(result.tracks.length,4);assert.ok(result.pngPrefix.startsWith('data:image/png;base64,iVBOR'));
  for(const track of result.tracks){const span=track.hours*HOUR;for(const segment of track.segments){assert.ok(segment.x1>=0&&segment.x2<=1000&&segment.x2>segment.x1);if(segment.color==='#ffc229')for(const night of track.nightBands)assert.ok(segment.x2<=(night.startEpoch-fixture.start)/span*1000+1e-7||segment.x1>=(night.endEpoch-fixture.start)/span*1000-1e-7,'No yellow inside an actual night');}
   if(fixture.id==='polar-day')assert.equal(track.nightBands.length,0);
   if(fixture.id==='polar-night')assert.equal(track.segments.length,0);
  }
  if(fixture.id==='polar-day'){assert.ok(result.exportMidPixel[0]>240&&result.exportMidPixel[1]>160&&result.exportMidPixel[2]<80&&result.exportMidPixel[3]>150,'Rasterized exported SVG contains actual yellow');assert.ok(result.titles.some(t=>t.includes('Wolkenlücken')))}
  if(fixture.id==='polar-night')assert.equal(result.exportMidPixel[3],0,'Rasterized polar night has no fabricated sunshine');
  if(width===390&&theme==='light'&&mode==='band')await page.screenshot({path:join(out,fixture.id+'.png'),fullPage:true});
  results.push({width,theme,mode,case:fixture.id,overflow:false,tracks:4,svgPng:true});await page.close();
 }
 const report={schema:1,version:'0.9.85.357',browser:browser.version(),kind:'Chromium shared-renderer and ShortTermRibbon fixture, not physical devices',cases:results.length,trackChecks:results.length*4,results};writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:results.length,trackChecks:report.trackChecks,browser:report.browser,report:join(out,'report.json')}));
}finally{await browser.close();await new Promise(r=>server.close(r))}

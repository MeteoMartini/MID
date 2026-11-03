import {build} from 'esbuild';
import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid145-views-')),read=p=>readFileSync(join(root,p));
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim(),base=dirname(dirname(realpathSync(cli))),{chromium}=await import(pathToFileURL(join(base,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});
const dates=Array.from({length:336},(_,i)=>new Date(Date.UTC(2026,9,2)+i*3600000).toISOString().slice(0,16));
const hours=dates.map((time,i)=>({time,epoch:Date.parse(time+'Z'),temperature:15+5*Math.sin(i%24/24*2*Math.PI),isDay:i%24>=7&&i%24<19,code:1,cloud:20,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:1800,gust:5,wind:3}));
const days=Array.from({length:14},(_,i)=>({date:dates[i*24].slice(0,10),min:10,max:20,code:1,cloud:20,precipitation:.01,probability:1,wind:6,gust:10,direction:45,uvMax:4,sunshineDuration:10*3600,sunrise:dates[i*24].slice(0,10)+'T07:00',sunset:dates[i*24].slice(0,10)+'T19:00'}));
const ensemble=days.map(day=>({...day,memberCount:71,modelCount:2,maxMean:16,minMean:8,precipitationMean:.01,precipitationProbability:1,windLow:2,windQ25:4,windQ75:6,windHigh:8,windMedian:5,windMean:5,gustMean:18,maxLow:12,maxQ25:14,maxQ75:18,maxHigh:20,maxMedian:16,minLow:4,minQ25:6,minQ75:10,minHigh:12,minMedian:8,precipitationLow:0,precipitationQ25:0,precipitationQ75:.05,precipitationHigh:.08,precipitationMedian:.01,gustLow:10,gustQ25:14,gustQ75:20,gustHigh:26,gustMedian:18,temperatureHours:hours.filter(h=>h.time.startsWith(day.date)).map(h=>({time:h.time,epoch:h.epoch,p25:h.temperature-2,p50:h.temperature,p75:h.temperature+2,memberCount:12,modelFamilyCount:2}))}));
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{SevenDayBand,FourteenDayHorizon}from'./src/ForecastCockpit';const hours=${JSON.stringify(hours)},days=${JSON.stringify(days)},ensemble=${JSON.stringify(ensemble)};createRoot(document.getElementById('root')).render(<section className='app'><section className='forecast-cockpit mode-cockpit-ribbons modern-workspace' data-workspace-mode='true'><div className='cockpit-body'>{location.search.includes('fourteen')?<FourteenDayHorizon days={days} hours={hours} ensemble={ensemble} scenarios={[]} climate={[]} timezone='GMT' location={{latitude:52.52,longitude:13.405,elevation:35}} unit={new URLSearchParams(location.search).get('unit')||'kn'} selectedDate={days[0].date} onSelectedDate={()=>{}} loading={false} advancedMode={false} confidenceDisplayMode='signal'/>:<SevenDayBand days={days} hours={hours} ensemble={ensemble} minutes15={[]} climate={[]} timezone='GMT' location={{latitude:52.52,longitude:13.405,elevation:35}} unit={new URLSearchParams(location.search).get('unit')||'kn'} selectedDate={days[0].date} onSelectedDate={()=>{}}/>}</div></section></section>);`,resolveDir:root,loader:'tsx'},plugins:[{name:'qa-export',setup(build){build.onLoad({filter:/ForecastCockpit\.tsx$/},()=>({contents:read('src/ForecastCockpit.tsx').toString()+'\nexport{SevenDayBand,FourteenDayHorizon};',loader:'tsx',resolveDir:join(root,'src')}))}}],bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]).concat('radarForecastReadability.css','midDesignWeSeven.css','midDesignWeFourteen.css');
const html=`<!doctype html><html data-mid-design='next' data-theme='light'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{padding:12px;margin:0}#root{max-width:1200px;margin:auto}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`;
const server=createServer((req,res)=>{const url=req.url.split('?')[0];if(url==='/')res.end(html);else if(url==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(sheets.some(s=>url==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(read(url.slice(1)))}else{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const width of [320,390,402,844,1024,1440])for(const theme of ['light','dark'])for(const mode of ['seven','fourteen'])for(const unit of ['kn','kmh','ms','mph']){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto(`http://127.0.0.1:${server.address().port}/?${mode}&unit=${unit}`);
  await page.waitForSelector(mode==='seven'?'.mid-we-seven-daycard':'.mid-we-fourteen-daytile');
  if(mode==='seven'){
   const row=page.locator('.mid-we-seven-daycard').first();
   assert.equal(await page.locator('.mid-we-seven-daycard').count(),7,'Seven-day A must show seven actual compact concept cards');
   assert.equal(await page.locator('[data-mid-forecast-detail="seven"]').count(),0,'Seven-day A must not pre-expand any old day detail');
   await row.click();
   await page.waitForSelector('[data-mid-forecast-detail="seven"] .forecast-range-guide');
   assert.equal(await page.locator('[data-mid-forecast-detail="seven"]').count(),1,'Exactly one canonical detail is revealed by tapping A');
   await row.click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-mid-forecast-detail="seven"]').length===0);
   await row.click();
   await page.waitForSelector('[data-mid-forecast-detail="seven"] .forecast-range-guide');
  }else{
   assert.equal(await page.locator('.mid-we-fourteen-daytile').count(),14,'Fourteen-day A must show 14 real day tiles in two weekly tracks');
   assert.equal(await page.locator('.cockpit-fourteen-card:visible').count(),0,'Old full-detail cards must stay collapsed initially');
   await page.locator('.mid-we-fourteen-daytile').first().click();
   await page.waitForSelector('#mid-fourteen-full-details[open] .cockpit-fourteen-card');
   await page.waitForFunction(()=>document.querySelectorAll('.forecast-range-guide').length===14);
  }
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const metrics=await page.evaluate(mode=>{const clipped=e=>{const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect();for(let parent=e;parent&&parent!==document.body;parent=parent.parentElement){const style=getComputedStyle(parent),box=parent.getBoundingClientRect();if(/hidden|clip/.test(style.overflowX)&&(text.left<box.left-1||text.right>box.right+1))return true;}return e.scrollWidth>e.clientWidth+1;};return ({
   overflow:document.documentElement.scrollWidth>innerWidth+1,
   prefixes:[...document.querySelectorAll('.forecast-range-bounds')].filter(e=>/P(?:25|75)/i.test(e.textContent)).length,
   bounds:[...document.querySelectorAll('.forecast-range-bounds')].map(e=>({text:e.textContent.trim(),clipped:clipped(e),diagnostics:clipped(e)?(()=>{const items=[];for(let p=e;p&&p!==document.body;p=p.parentElement){const b=p.getBoundingClientRect(),s=getComputedStyle(p);items.push({class:typeof p.className==='string'?p.className.slice(0,100):'',width:b.width,left:b.left,right:b.right,clientWidth:p.clientWidth,scrollWidth:p.scrollWidth,overflowX:s.overflowX,gridColumns:s.gridTemplateColumns});}return items;})():[]})),
   compactSevenCards:[...document.querySelectorAll('.mid-we-seven-daycard')].map(e=>({text:e.textContent.trim(),clipped:clipped(e)})),
   // Week cards outside the horizontally scrollable viewport are intentionally offscreen.
   // Check each card's own content bounds, not a clipping ancestor beyond its scroll region.
   weekScrolls:[...document.querySelectorAll('.mid-we-fourteen-weekscroll')].map(e=>({client:e.clientWidth,scroll:e.scrollWidth,tabIndex:e.tabIndex})),
   compactFourteenCards:[...document.querySelectorAll('.mid-we-fourteen-daytile')].map(e=>{const box=e.getBoundingClientRect(),values=[...e.querySelectorAll('.mid-we-fourteen-temps,.mid-we-fourteen-rain>b,.mid-we-fourteen-wind>b,.mid-we-fourteen-range')],clippedValues=values.some(c=>{const b=c.getBoundingClientRect();return c.scrollWidth>c.clientWidth+1||b.left<box.left-1||b.right>box.right+1;});return {text:e.textContent.trim(),clipped:e.scrollWidth>e.clientWidth+1||clippedValues,diagnostics:clippedValues||e.scrollWidth>e.clientWidth+1?{width:box.width,client:e.clientWidth,scroll:e.scrollWidth,values:values.map(c=>({class:c.className,client:c.clientWidth,scroll:c.scrollWidth}))}:null};}),
   temperaturePairs:[...document.querySelectorAll('.cockpit-seven-grid .cockpit-day-temps')].map(e=>({label:e.getAttribute('aria-label'),fields:[...e.querySelectorAll(':scope>.climate-tone-daily>small,:scope>.climate-tone-daily>span')].map(v=>({text:v.textContent,visible:v.getBoundingClientRect().width>0,clipped:clipped(v),width:v.getBoundingClientRect().width,scroll:v.scrollWidth,client:v.clientWidth,font:getComputedStyle(v).fontSize,parents:clipped(v)?(()=>{const values=[];for(let p=v.parentElement;p&&p!==document.body;p=p.parentElement){const b=p.getBoundingClientRect(),s=getComputedStyle(p);values.push({class:p.className,left:b.left,right:b.right,width:b.width,display:s.display,gridColumns:s.gridTemplateColumns,gridColumn:s.gridColumn,gridRow:s.gridRow,overflow:s.overflowX});}return values;})():[]}))})),
   amounts:[...document.querySelectorAll(mode==='fourteen'?'.cockpit-fourteen-precip-values>b':'.cockpit-day-rain>b')].map(e=>({text:e.textContent.replace(/\s/g,''),clipped:clipped(e),ellipsis:getComputedStyle(e).textOverflow==='ellipsis'}))
  });},mode);
  assert.equal(metrics.overflow,false,`${mode} ${width}px ${theme} ${unit}: horizontal overflow`);
  assert.equal(metrics.prefixes,0,`${mode}: visible P25/P75 prefixes`);
  assert.ok(metrics.amounts.length>0,`${mode}: primary rain values missing`);
  if(mode==='seven'){
   assert.equal(metrics.compactSevenCards.length,7,'seven: all seven compact A cards must render');
   assert.ok(metrics.compactSevenCards.every(card=>card.text.includes('10')&&card.text.includes('20')&&!card.clipped),`${mode} ${width}px ${theme}: missing or clipped A temperature`);
   assert.equal(metrics.temperaturePairs.length,1,'seven: only selected original card, no seven duplicated legacy cards');
   for(const pair of metrics.temperaturePairs){assert.deepEqual(pair.fields.map(f=>f.text),['Tmin','10°','Tmax','20°']);for(const field of pair.fields){assert.equal(field.visible,true,`${mode} ${width}px: temperature label/value hidden`);assert.equal(field.clipped,false,`${mode} ${width}px ${theme} ${unit}: temperature label/value clipped ${JSON.stringify(field)}`);}}}
  if(mode==='fourteen'){
   assert.equal(metrics.compactFourteenCards.length,14,'fourteen: 14 A cards must render');
   assert.ok(metrics.compactFourteenCards.every(card=>card.text.includes('10')&&card.text.includes('20')&&!card.clipped),`${mode} ${width}px ${theme} ${unit}: missing or clipped weekly card ${JSON.stringify(metrics.compactFourteenCards.filter(card=>!card.text.includes('10')||!card.text.includes('20')||card.clipped).slice(0,2))}`);
   assert.equal(metrics.weekScrolls.length,2,'14d A requires two independent week scrollers');
   if(width<=402)assert.ok(metrics.weekScrolls.every(w=>w.scroll>w.client+20&&w.tabIndex===0),`${mode} ${width}px: both week strips must be keyboard-focusable and horizontally scrollable`);
  }
  for(const amount of metrics.amounts){assert.equal(amount.text,'<0,1mm');assert.equal(amount.clipped,false,`${mode} ${width}px: trace amount clipped`);}
  for(const bound of metrics.bounds)assert.equal(bound.clipped,false,`${mode} ${width}px ${theme} ${unit}: bounds clipped ${JSON.stringify(bound)}`);
  if(unit==='kmh')await page.screenshot({path:join(out,`${mode}-${width}-${theme}.png`)});
   // Reach an offscreen card through the real scroll container at narrow widths.
   if(mode==='fourteen'&&width<=402&&unit==='kn'){const reachable=await page.locator('.mid-we-fourteen-weekscroll').first().evaluate(e=>{e.scrollLeft=e.scrollWidth;return e.scrollLeft>0&&Math.abs(e.scrollLeft-(e.scrollWidth-e.clientWidth))<=2;});assert.ok(reachable,`${mode} ${width}px: last week card must be reachable by horizontal scrolling`);}

  // B/C must display distinct surfaces and preserve the canonical day drilldown.
  // Run the added interactions for one wind unit while keeping all 96 geometry/unit cases.
  if(unit==='kn'){
   if(mode==='seven'){
    await page.locator('.mid-we-seven-switch-primary button').nth(1).click();
    await page.waitForSelector('.mid-we-seven-charts article');
    assert.equal(await page.locator('.mid-we-seven-charts article').count(),5,'7d B: five distinct parameter charts');
    await page.locator('.mid-we-seven-switch-primary button').nth(2).click();
    await page.waitForSelector('.mid-we-seven-table-scroll tbody tr');
    assert.equal(await page.locator('.mid-we-seven-table-scroll tbody tr').count(),7,'7d C: seven comparable days');
    await page.locator('.mid-we-seven-table-scroll tbody button').first().click();
    await page.waitForSelector('[data-mid-seven-view="standard"] [data-mid-forecast-detail="seven"]');
   }else{
    await page.locator('.mid-we-fourteen-switch button').nth(1).click();
    await page.waitForSelector('.mid-we-fourteen-charts article');
    assert.equal(await page.locator('.mid-we-fourteen-charts article').count(),4,'14d B: four distinct parameter charts');
    await page.locator('.mid-we-fourteen-switch button').nth(2).click();
    await page.waitForSelector('.mid-we-fourteen-table-scroll tbody tr');
    assert.equal(await page.locator('.mid-we-fourteen-table-scroll tbody tr').count(),14,'14d C: fourteen comparable days');
    await page.locator('.mid-we-fourteen-table-scroll tbody button').first().click();
    await page.waitForSelector('#mid-fourteen-full-details[open] .cockpit-fourteen-card');
   }
  }
  await page.close();
 }
 console.log('MID145: 96 full seven/fourteen viewport/theme/wind-unit cases; trace amounts and units intact, no visible P25/P75 prefixes, no bounds clipping or horizontal overflow; QA '+out);
}finally{await browser.close();await new Promise(r=>server.close(r));if(process.env.MID_KEEP_BROWSER_QA!=='1')rmSync(out,{recursive:true,force:true})}

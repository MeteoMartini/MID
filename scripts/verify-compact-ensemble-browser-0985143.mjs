import {build} from 'esbuild';
import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid144-range-qa-')),read=p=>readFileSync(join(root,p));
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim(),base=dirname(dirname(realpathSync(cli))),{chromium}=await import(pathToFileURL(join(base,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});
const dryDay={memberCount:12,modelCount:2,maxLow:8,maxQ25:10,maxQ75:15,maxHigh:19,maxMedian:13,minLow:-28,minQ25:-24,minQ75:-18,minHigh:-13,minMedian:-21,precipitationLow:0,precipitationQ25:.02,precipitationQ75:.07,precipitationHigh:.3,precipitationMedian:.05,windLow:.8,windQ25:1.2,windQ75:2.4,windHigh:5,windMedian:1.8,gustLow:1.2,gustQ25:2.5,gustQ75:4.8,gustHigh:8,gustMedian:3.6};
const wetDay={...dryDay,maxLow:27,maxQ25:32,maxQ75:39,maxHigh:44,maxMedian:36,minLow:18,minQ25:21,minQ75:26,minHigh:30,minMedian:24,precipitationLow:8,precipitationQ25:29.4,precipitationQ75:82.7,precipitationHigh:130,precipitationMedian:48,windLow:30,windQ25:42,windQ75:85,windHigh:120,windMedian:65,gustLow:45,gustQ25:70,gustQ75:170,gustHigh:240,gustMedian:115};
const cases=['7d','14d'].flatMap(mode=>['dry','large'].flatMap(sample=>['kn','kmh','ms','mph'].map(unit=>({mode,sample,unit}))));
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ForecastRangeGuide}from'./src/ForecastRangeGuide';const dry=${JSON.stringify(dryDay)},large=${JSON.stringify(wetDay)},days=[...Array(7).fill(dry),...Array(7).fill(large)],cases=${JSON.stringify(cases)},missing={...dry,precipitationQ25:undefined,precipitationQ75:undefined,gustQ25:undefined,gustQ75:undefined,maxMedian:undefined};createRoot(document.getElementById('root')).render(<main className='forecast-cockpit'>{cases.map(({mode,sample,unit})=>{const compact=mode==='7d',day=sample==='dry'?dry:large,tag=mode+'-'+unit+'-'+sample;return <section className='qa-guide-case' data-case={tag} key={tag}>{compact?<div className='cockpit-seven-grid'><article className='cockpit-day mid-forecast-row'><ForecastRangeGuide day={day} days={days} temperature={0} compact unit={unit}/></article></div>:<div className='cockpit-fourteen-grid'><article className='cockpit-fourteen-card mid-forecast-row'><ForecastRangeGuide day={day} days={days} temperature={0} unit={unit}/></article></div>}</section>})}<div id='missing-check' hidden><ForecastRangeGuide day={missing} days={[missing]} temperature={0}/></div></main>);`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]).concat('radarForecastReadability.css');
const html=`<!doctype html><html data-mid-design='next' data-theme='light'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{padding:0;margin:0}#root{width:100%;max-width:none;margin:auto}.qa-guide-case{width:100%;margin:0 auto 12px}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`;
const server=createServer((req,res)=>{const url=req.url.split('?')[0];if(url==='/')res.end(html);else if(url==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(sheets.some(s=>url==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(read(url.slice(1)))}else{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const expectedSmallGust={kn:'3–5 kt',kmh:'5–9 km/h',ms:'1–2 m/s',mph:'3–6 mph'},expectedLargeGust={kn:'70–170 kt',kmh:'130–315 km/h',ms:'36–87 m/s',mph:'81–196 mph'};
try{
 for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('[data-case="7d-kn-dry"] .forecast-range-guide').waitFor();
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  assert.equal(await page.locator('[data-case]').count(),16,`${width}px ${theme} case count`);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme);
  assert.equal(await page.locator('#missing-check .parameter-rain').count(),0);
  assert.equal(await page.locator('#missing-check .parameter-gust').count(),0);
  assert.equal(await page.locator('#missing-check .parameter-temperature .point').count(),0);
  for(const {mode,sample,unit} of cases){
   const tag=`${mode}-${unit}-${sample}`,caseRoot=page.locator(`[data-case="${tag}"]`),guide=caseRoot.locator('.forecast-range-guide'),compact=mode==='7d';
   assert.equal(await guide.getAttribute('data-range-layout'),compact?'seven-day-compact':'fourteen-day-detail',`${tag} layout`);
   assert.equal(await caseRoot.locator('.forecast-parameter-range').count(),4,`${tag} parameter coverage`);
   assert.equal(await caseRoot.locator('.parameter-wind').count(),0,`${tag} mean-wind remains excluded`);
   const tempPair=caseRoot.locator('.forecast-temperature-pair');
   assert.equal(await tempPair.getAttribute('data-temperature-pair'),'shared-scale',`${tag} shared temperature scale`);
   assert.deepEqual(await tempPair.locator('.forecast-range-label').allTextContents(),['Tmin','Tmax'],`${tag} Tmin/Tmax order`);
   const minStart=parseFloat(await caseRoot.locator('.parameter-minimum .forecast-range-track').evaluate(e=>e.style.getPropertyValue('--range-start'))),maxStart=parseFloat(await caseRoot.locator('.parameter-temperature .forecast-range-track').evaluate(e=>e.style.getPropertyValue('--range-start'))),expectedMinStart=((sample==='dry'?-28:18)+28)/72*100,expectedMaxStart=((sample==='dry'?8:27)+28)/72*100;
   assert.ok(Math.abs(minStart-expectedMinStart)<.0001,`${tag} Tmin uses shared full-days scale`);
   assert.ok(Math.abs(maxStart-expectedMaxStart)<.0001,`${tag} Tmax uses shared full-days scale`);
   assert.equal(await caseRoot.locator('.parameter-rain .forecast-range-bounds').textContent(),sample==='dry'?'<0,1 mm':'29,4–82,7 mm',`${tag} precipitation values and unit`);
   assert.equal(await caseRoot.locator('.parameter-gust .forecast-range-bounds').textContent(),sample==='dry'?expectedSmallGust[unit]:expectedLargeGust[unit],`${tag} gust values and wind unit`);
   assert.match(await caseRoot.locator('.parameter-temperature').getAttribute('aria-label'),/P25–P75 .* Median/,`${tag} retained quantiles and median`);
   for(const bounds of await caseRoot.locator('.forecast-range-bounds').all()){
    const text=await bounds.textContent();
    assert.doesNotMatch(text,/\bP(?:25|75)\b/,`${tag} visible boundary prefixes`);
    assert.ok(text.trim().length>0,`${tag} visible boundaries`);
   }
   assert.equal(await caseRoot.locator('.forecast-range-track>.point').count(),4,`${tag} real medians`);
   assert.notEqual(await caseRoot.locator('.parameter-temperature .core').evaluate(e=>getComputedStyle(e).backgroundColor),await caseRoot.locator('.parameter-minimum .core').evaluate(e=>getComputedStyle(e).backgroundColor),`${tag} temperature colors`);
   const metrics=await caseRoot.evaluate((root,compact)=>{
    const guide=root.querySelector('.forecast-range-guide'),guideRect=guide.getBoundingClientRect(),rows=[...guide.querySelectorAll('.forecast-parameter-range')];
    return {guideWidth:guideRect.width,guideScroll:guide.scrollWidth,guideClient:guide.clientWidth,guideHeight:guideRect.height,rows:rows.map(row=>{const label=row.querySelector('.forecast-range-label').getBoundingClientRect(),bounds=row.querySelector('.forecast-range-bounds').getBoundingClientRect(),track=row.querySelector('.forecast-range-track').getBoundingClientRect(),value=row.querySelector('.forecast-range-bounds');return {horizontalOverlap:label.right>bounds.left+.5,compactOverlap:compact&& (label.right>track.left+.5||track.right>bounds.left+.5),outside:bounds.right>guideRect.right+.5||label.right>guideRect.right+.5||track.right>guideRect.right+.5,clipped:value.scrollWidth>value.clientWidth+1}})};
   },compact);
   assert.ok(metrics.guideWidth>0,`${tag} guide is visible`);
   assert.ok(metrics.guideScroll<=metrics.guideClient+1,`${width}px ${theme} ${tag} guide clips content`);
   for(const row of metrics.rows){assert.equal(row.horizontalOverlap,false,`${width}px ${theme} ${tag} label/value overlap`);assert.equal(row.compactOverlap,false,`${width}px ${theme} ${tag} compact track overlap`);assert.equal(row.outside,false,`${width}px ${theme} ${tag} content exceeds guide`);assert.equal(row.clipped,false,`${width}px ${theme} ${tag} value clipping`)}
   assert.ok(metrics.guideHeight<=(compact?125:260),`${width}px ${theme} ${tag} unexpected layout height ${metrics.guideHeight}`);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}px ${theme} horizontal overflow`);
  await page.close();
 }
 console.log('MID-C12: 10 viewport/theme scenarios; 160 rendered 7d/14d range cases across tiny/large values and all four wind units, with shared temperature scales, median/quantile accessibility, no clipped bounds, overlaps, or horizontal overflow.');
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 if(process.env.MID_KEEP_BROWSER_QA!=='1')rmSync(out,{recursive:true,force:true});
}

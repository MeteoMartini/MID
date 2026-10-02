import {build} from 'esbuild';
import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid143-qa-')),read=p=>readFileSync(join(root,p));
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim(),base=dirname(dirname(realpathSync(cli))),{chromium}=await import(pathToFileURL(join(base,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});
const day={memberCount:12,modelCount:2,maxLow:12,maxQ25:14,maxQ75:18,maxHigh:20,maxMean:99,maxMedian:16,minLow:4,minQ25:6,minQ75:10,minHigh:12,minMedian:8,precipitationLow:0,precipitationQ25:0,precipitationQ75:2,precipitationHigh:8,precipitationMedian:1,gustLow:10,gustQ25:14,gustQ75:20,gustHigh:26,gustMedian:18};
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ForecastRangeGuide}from'./src/ForecastRangeGuide';const day=${JSON.stringify(day)},missingDay={...day,precipitationQ25:undefined,precipitationQ75:undefined,gustQ25:undefined,gustQ75:undefined,maxMedian:undefined};createRoot(document.getElementById('root')).render(<section className='forecast-cockpit'><article id='active-guide' className={location.search.includes('compact')?'cockpit-day mid-forecast-row':'cockpit-fourteen-card mid-forecast-row'}><ForecastRangeGuide day={day} days={[day]} temperature={99} compact={location.search.includes('compact')} unit='kmh'/></article><div id='missing-check' hidden><ForecastRangeGuide day={missingDay} days={[missingDay]} temperature={99}/></div></section>);`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]).concat('radarForecastReadability.css');
const html=`<!doctype html><html data-mid-design='next' data-theme='light'><meta name='viewport' content='width=device-width,initial-scale=1'>${sheets.map(s=>`<link rel='stylesheet' href='/src/${s}'>`).join('')}<style>body{padding:12px;margin:0}#root{max-width:800px;margin:auto}</style><div id='root'></div><script type='module' src='/qa.js'></script></html>`;
const server=createServer((req,res)=>{const url=req.url.split('?')[0];if(url==='/')res.end(html);else if(url==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(sheets.some(s=>url==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(read(url.slice(1)))}else{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for (const width of [320,390,844,1024,1440]) for (const compact of [true,false]) for (const theme of ['light','dark']) {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(`http://127.0.0.1:${server.address().port}/?${compact?'compact':'full'}`);
  await page.locator('#active-guide .forecast-range-guide').waitFor();
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  assert.equal(await page.locator('#active-guide .forecast-parameter-range').count(),4);
  assert.equal(await page.locator('#active-guide .parameter-wind').count(),0);
  const metrics=await page.evaluate(()=>{
   const guide=document.querySelector('#active-guide .forecast-range-guide'),rect=guide.getBoundingClientRect();
   return {
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    height:rect.height,
    rows:[...guide.querySelectorAll('.forecast-parameter-range')].map(row=>{
     const rowRect=row.getBoundingClientRect(),label=row.querySelector('.forecast-range-label').getBoundingClientRect(),track=row.querySelector('.forecast-range-track').getBoundingClientRect(),bounds=row.querySelector('.forecast-range-bounds').getBoundingClientRect();
     return {overlap:label.right>track.left+.5||track.right>bounds.left+.5||bounds.right>rowRect.right+.5};
    })
   };
  });
  assert.equal(metrics.overflow,false,`${width}px ${theme} horizontal overflow`);
  assert.ok(metrics.height<90,JSON.stringify(metrics));
  for(const row of metrics.rows)assert.equal(row.overlap,false,`${width}px ${theme} row overlap`);
  assert.match(await page.locator('#active-guide .parameter-temperature').getAttribute('aria-label'),/Median 16/);
  const compactText=async selector=>(await page.locator(selector).textContent()).replaceAll(' ','').replaceAll(String.fromCharCode(10),'');
  assert.equal(await compactText('#active-guide .parameter-temperature .forecast-range-bounds'),'P2514°CP7518°C');
  assert.equal(await compactText('#active-guide .parameter-rain .forecast-range-bounds'),'P250mmP752mm');
  assert.equal(await compactText('#active-guide .parameter-gust .forecast-range-bounds'),'P2526km/hP7537km/h');
  assert.equal(await page.locator('#missing-check .parameter-rain').count(),0);
  assert.equal(await page.locator('#missing-check .parameter-gust').count(),0);
  assert.equal(await page.locator('#missing-check .parameter-temperature .point').count(),0);
  assert.notEqual(await page.locator('#active-guide .parameter-temperature .core').evaluate(e=>getComputedStyle(e).backgroundColor),await page.locator('#active-guide .parameter-minimum .core').evaluate(e=>getComputedStyle(e).backgroundColor));
  await page.screenshot({path:join(out,`${width}-${compact}-${theme}.png`)});
  await page.close();
 }
 console.log('MID-C12: 20 viewport/theme/compact cases; P25/P75 values and units, missing-value filtering, median marker, no overlap or horizontal overflow');
} finally {
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 if(process.env.MID_KEEP_BROWSER_QA!=='1')rmSync(out,{recursive:true,force:true});
}

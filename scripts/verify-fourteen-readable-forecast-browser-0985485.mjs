import assert from 'node:assert/strict';
import {readFileSync,realpathSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {midCssQaBrowserExecutable} from './lib/cssQaBrowserExecutable.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const exe=midCssQaBrowserExecutable();
assert.ok(exe,'MID Design 1.4 browser QA requires a real executable Chromium; no silent skip');
// Playwright CLI resolution gets an isolated npm cache: this Vitest suite runs
// concurrently with the existing smoke test, which uses the default _npx path.
// Never mutate or delete the shared npm cache, and never mask a missing browser.
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{
 encoding:'utf8',timeout:80000,env:{...process.env,npm_config_cache:join(tmpdir(),'mid-design14-playwright-npx-cache')}
}).trim());
const {chromium}=require(join(dirname(dirname(cli)),'playwright'));
const iso='2026-11-16',baseDate=Date.parse(iso+'T00:00:00Z');
const location={id:'design14-qa',name:'Niederkassel-Rheidt · Testort',latitude:50.8,longitude:7.05,elevation:55,country:'Deutschland',country_code:'DE',timezone:'Europe/Berlin'};
const days=Array.from({length:14},(_,i)=>{
 const date=new Date(baseDate+i*86400000).toISOString().slice(0,10);
 return {date,min:3,max:11,code:3,cloud:80,precipitation:2,probability:65,sunshineDuration:7200,
  wind:6,gust:12,direction:230,sunrise:date+'T07:00',sunset:date+'T17:00'};
});
const hours=days.flatMap(day=>Array.from({length:24},(_,i)=>{
 const time=day.date+'T'+String(i).padStart(2,'0')+':00';
 return {time,epoch:Date.parse(time+'Z'),temperature:8,apparent:7,dewPoint:4,humidity:75,isDay:i>=7&&i<=17,
  code:3,cloud:80,precipitation:.1,rain:.1,showers:0,snowfall:0,probability:60,sunshineDuration:300,
  wind:6,gust:12,direction:230};
}));
const source=readFileSync(join(root,'src/ForecastCockpit.tsx'),'utf8');
assert.ok(source.includes('function FourteenDayHorizon('),'Real 14-day component missing; cannot use synthetic replacement');
assert.ok(source.includes('data-mid-forecast-list="fourteen"'),'Real 14-day DOM contract missing');
const css=readFileSync(join(root,'src/midPresentation.css'),'utf8');
assert.ok(css.includes("overflow-wrap:anywhere!important;"),'Readability fix not present in canonical stylesheet');
const entry=join(root,'src/__mid_design14_entry_qa.tsx');
const fixture=join(root,'src/__mid_design14_fixture_qa.tsx');
const fixtureSource=[
 "import React from 'react';",
 "import {createRoot} from 'react-dom/client';",
 "import {FourteenDayHorizon} from 'virtual:mid-design14-entry';",
 "import '/src/midPresentation.css';",
 'const days='+JSON.stringify(days)+';',
 'const hours='+JSON.stringify(hours)+';',
 'const location='+JSON.stringify(location)+';',
 "function QA(){return <div className='app navigation-bottom-tabs'><main className='forecast-cockpit modern-workspace' data-workspace-mode='true'><FourteenDayHorizon ensemble={[]} days={days} hours={hours} scenarios={[]} climate={[]} selectedDate={days[0].date} onSelectedDate={()=>{}} loading={false} unit='kn' advancedMode={false} confidenceDisplayMode='standard' timezone='Europe/Berlin' location={location}/></main></div>}",
 "createRoot(document.getElementById('root')).render(<QA/>);"
].join('\n');
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{
 name:'design14-real-component-qa',
 resolveId(id){if(id==='virtual:mid-design14-entry')return entry;if(id==='virtual:mid-design14-fixture')return fixture;},
 load(id){if(id===entry)return source+'\nexport {FourteenDayHorizon};';if(id===fixture)return fixtureSource;},
 configureServer(vite){vite.middlewares.use('/__design14',async(req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(await vite.transformIndexHtml('/__design14','<!doctype html><html lang="de" data-mid-design="next"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import "virtual:mid-design14-fixture";</script></body></html>'));
 });}
}]});
const browser=await chromium.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const url='http://127.0.0.1:'+((await server.listen()).httpServer.address().port)+'/__design14';
const out=join(root,'coverage','mid-design14-browser-qa');
mkdirSync(out,{recursive:true});
const longText='Zunächst zeitweise kräftige Regenschauer, später einzelne Gewitter mit stürmischen Böen und länger anhaltenden Niederschlägen';
const report={schema:'mid.design14.real-react-css-browser-qa.v1',scope:'Actual FourteenDayHorizon React component plus canonical MID CSS in Vite; synthetic meteorological fixtures and injected long text, NOT full production app or real iOS',source:'src/ForecastCockpit.tsx',stylesheet:'src/midPresentation.css',browser:browser.version(),executable:exe,results:[]};
async function one(width,height,theme){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e?.message||e)));
 await page.addInitScript(theme=>{
  localStorage.setItem('theme',theme);
  const set=()=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');};
  if(document.documentElement)set();else document.addEventListener('DOMContentLoaded',set,{once:true});
 },theme);
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('summary').filter({hasText:'Alle 14 Tageswerte'}).waitFor({timeout:30000});
  assert.equal(await page.locator('.cockpit-fourteen-card').count(),14,'All fourteen cards remain in the closed details DOM');
  assert.equal(await page.locator('.cockpit-fourteen-card').first().isVisible(),false,'14-day cards must start visually hidden');
  await page.locator('summary').filter({hasText:'Alle 14 Tageswerte'}).click();
  await page.locator('.cockpit-fourteen-card').first().waitFor({timeout:30000});
  assert.equal(await page.locator('.cockpit-fourteen-card').first().isVisible(),true,'14-day cards must be visible once details is opened');
  assert.equal(await page.locator('.cockpit-fourteen-card').count(),14,'All 14 day cards must render');
  await page.locator('.cockpit-fourteen-weather-label').first().evaluate((node,t)=>{node.textContent=t;},longText);
  await page.evaluate(()=>document.fonts.ready);
  const measure=await page.evaluate(()=>{
   const card=document.querySelector('.cockpit-fourteen-card'),label=document.querySelector('.cockpit-fourteen-weather-label'),grid=document.querySelector('.cockpit-fourteen-grid');
   const r=card.getBoundingClientRect(),l=label.getBoundingClientRect(),g=grid.getBoundingClientRect(),style=getComputedStyle(label);
   const range=document.createRange();range.selectNodeContents(label);
   const lineRects=[...range.getClientRects()].map(q=>({left:q.left,right:q.right,top:q.top,bottom:q.bottom}));
   return {card:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,scroll:card.scrollWidth,client:card.clientWidth},
    grid:{left:g.left,right:g.right,scroll:grid.scrollWidth,client:grid.clientWidth},
    label:{left:l.left,right:l.right,top:l.top,bottom:l.bottom,height:l.height,scroll:label.scrollHeight,client:label.clientHeight,text:label.textContent},
    fontPx:Number.parseFloat(style.fontSize),whiteSpace:style.whiteSpace,overflowWrap:style.overflowWrap,textOverflow:style.textOverflow,lineRects,
    viewport:document.documentElement.clientWidth,rootOverflow:document.documentElement.scrollWidth};
  });
  assert.deepEqual(errors,[],'React/browser runtime errors');
  assert.equal(measure.label.text,longText,'Long meteorological description missing');
  assert.equal(measure.whiteSpace,'normal','Long weather label must wrap');
  assert.equal(measure.overflowWrap,'anywhere','Long compound words must wrap');
  assert.equal(measure.textOverflow,'clip','Label must not be ellipsized');
  assert.ok(measure.fontPx>=11,'Weather text must remain readable at '+width+'px');
  assert.ok(measure.label.scroll<=measure.label.client+2,'Weather text itself is vertically clipped');
  assert.ok(measure.lineRects.length>0,'Rendered weather text is not visible');
  assert.ok(measure.lineRects.every(q=>q.left>=measure.card.left-2&&q.right<=measure.card.right+2&&q.top>=measure.card.top-2&&q.bottom<=measure.card.bottom+2),
   'Rendered long weather text extends outside its forecast card');
  assert.ok(measure.card.right<=width+2&&measure.card.left>=-2,'14-day card horizontally outside viewport');
  assert.ok(measure.grid.scroll<=measure.grid.client+2,'14-day grid horizontally overflows');
  if(width<=375){
   assert.ok(measure.lineRects.length>=2,'Long weather label must wrap on narrow screens');
   assert.ok(measure.lineRects.length<=8,'Mobile weather label still stacked into an excessively narrow text column');
   assert.ok(measure.card.bottom-measure.card.top<=235,'14-day forecast card exceeds the compact mobile height budget');
  }
  if(width>375&&width<=430)assert.ok(measure.card.bottom-measure.card.top<=200,'Medium-phone layout regressed into an excessively tall card');
  if([320,375,390,834,1440].includes(width)){
   const shot=join(out,'fourteen-'+width+'-'+theme+'.png');
   await page.locator('.cockpit-fourteen-card').first().screenshot({path:shot,animations:'disabled'});
   report.results.push({width,height,theme,status:'PASS',measure,screenshot:shot.split('/').pop()});
  }else report.results.push({width,height,theme,status:'PASS',measure});
  console.log('MID design14 real React/CSS Chromium '+width+'x'+height+' '+theme+': PASS; '+measure.lineRects.length+' text fragments');
 }finally{await context.close();}
}
try{
 for(const [width,height] of [[320,740],[360,780],[375,812],[390,844],[430,932],[834,1112],[1024,768],[1440,900]])
  for(const theme of ['light','dark'])await one(width,height,theme);
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('MID DESIGN14 BROWSER QA SUCCESS: '+report.results.length+' real React/CSS viewport/theme contexts; screenshots + evidence in coverage/mid-design14-browser-qa. NO iOS/VoiceOver/full-app parity claim.');
}finally{await browser.close();await server.close();}

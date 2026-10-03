import {readFileSync,readdirSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid141-browser-')),read=p=>readFileSync(join(root,p)),worker=readdirSync(join(root,'dist/assets')).find(p=>/^maplibre-gl-worker-.*\.js$/.test(p));if(!worker)throw new Error('Build required');
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim(),playwrightRoot=dirname(dirname(realpathSync(cli))),{chromium}=await import(pathToFileURL(join(playwrightRoot,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});
const now=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),lats=[47,51.1,55.2],lons=[5.5,10.55,15.6],products={},objects={};
for(const [kind,unit] of [['temperature','°C'],['precipitation','mm/1 h'],['wind','km/h'],['gust','km/h']]){products[kind]={unit,frames:[]};for(const hour of [1,3,6]){const time=new Date(Date.parse(now)+hour*3600000).toISOString(),file=`${kind}-${String(hour).padStart(3,'0')}.${kind==='precipitation'?'bin':'json'}`,field={schema:'mid.icon-d2.field.v1',run:now,time,kind,unit,scale:.1,lats,lons,values:kind==='wind'||kind==='gust'?[185,200,210,240,370+hour,380,410,460,500]:Array(9).fill(kind==='temperature'?150+hour:hour),isobars:[]},raw=Buffer.from(JSON.stringify(field)),bytes=kind==='precipitation'?gzipSync(raw):raw,sha256=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');products[kind].frames.push({...(kind==='precipitation'?{encoding:'gzip-json',decodedBytes:raw.length}:{}),hour,time,file,bytes:bytes.length,sha256,intervalHours:kind==='precipitation'?1:0});objects[file]=bytes}}
const index={schema:'mid.icon-d2.fields.v1',run:now,products};
// Exercise the exact production portal/primary-tab JSX under a transformed
// dashboard parent. A fixed descendant must not become parent-relative.
const appSource=read('src/App.tsx').toString(),tabsStart=appSource.indexOf(' const forecastCandidateSource:'),tabsEnd=appSource.indexOf('\n return <>',tabsStart),portalStart=appSource.indexOf('createPortal(',tabsEnd),portalEnd=appSource.indexOf(',document.body)',portalStart)+',document.body)'.length;
assert.ok(tabsStart>=0&&portalStart>tabsEnd&&portalEnd>portalStart,'Parallel viewport correction must be a real production portal');
const navigationFixture=`import React from 'react';import {createRoot} from 'react-dom/client';import {createPortal} from 'react-dom';import {Sun,Clock3,CalendarDays,Monitor,Menu} from 'lucide-react';type DashboardModuleId=string;type ReactNode=React.ReactNode;function Navigation(){const forecastTarget='forecast',drawerOpen=false,activeId='current',available=['current','short-term','forecast','composite'],MODERN_MAP_MODULES=['composite','weather-maps'],bottomBarBehavior='fixed',warmCompositePanel=()=>{},navigate=(id:string)=>{document.getElementById('status')!.textContent=id},onDrawerOpen=()=>{document.getElementById('status')!.textContent='more'},persistLastPrimaryNavigationArea=()=>{};${appSource.slice(tabsStart,tabsEnd)}return ${appSource.slice(portalStart,portalEnd)};}createRoot(document.getElementById('root')!).render(<div className='app navigation-bottom-tabs with-section-navigation' style={{transform:'translateZ(0)',contain:'paint',minHeight:1800}}><div id='status'>current</div><Navigation/></div>);`;
await build({stdin:{contents:navigationFixture,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'navigation.js'),logLevel:'silent'});
const totalsData=observed=>({schema:observed?'mid.radolan.observed.v1':'mid.icon-d2.totals.v1',...(observed?{kind:'observed'}:{}),run:now,scale:.1,lats,lons,frames:(observed?[1,6,12,24,48]:[6,12,24,48]).map(hours=>({hours,...(observed?{validFrom:new Date(Date.parse(now)-hours*3600000).toISOString()}:{}),validTo:observed?now:new Date(Date.parse(now)+hours*3600000).toISOString(),values:[observed?-1:0,1,2,3,4,5,10,12,15],maximum:1.5}))});
await build({stdin:{contents:"import React,{useState} from 'react';import{createRoot}from'react-dom/client';import NativeModelMap from './src/NativeModelMap';import PrecipitationTotalsMap from './src/PrecipitationTotalsMap';function Harness(){const[unit,setUnit]=useState('kn');const kind=location.search.includes('rain')?'precipitation':location.search.includes('gust')?'gust':location.search.includes('wind')?'wind':'temperature';return <><div role='group' aria-label='Einheiten-QA'>{['kn','kmh','ms','mph'].map(u=><button key={u} onClick={()=>setUnit(u)} aria-pressed={unit===u}>{'Einheit '+u}</button>)}</div>{location.search.includes('totals')||location.search.includes('observed')?<PrecipitationTotalsMap embedded basemap='light' kind={location.search.includes('observed')?'observed':'forecast'} favorites={[{id:'1',name:'Testort',latitude:51.1,longitude:10.55},{id:'missing',name:'Datenlücke',latitude:47,longitude:5.5}]}/>:<NativeModelMap kind={kind} unit={unit} label='ICON-D2 Wetterkarte' basemap='light' favorites={[{id:'1',name:'Testort',latitude:51.1,longitude:10.55}]}/>}</>}createRoot(document.getElementById('root')).render(<Harness/>);",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty','.json':'json'},plugins:[{name:'qa-worker-url',setup(b){b.onResolve({filter:/\?worker&url$/},()=>({path:'worker',namespace:'qa-worker'}));b.onLoad({filter:/.*/,namespace:'qa-worker'},()=>({contents:`export default '/dist/assets/${worker}'`,loader:'js'}))}}],logLevel:'silent'});
const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]).concat('weatherMapsTotals.css','modelMapScaleLegend.css'),html=`<!doctype html><html data-mid-design="next" data-theme="light"><meta name="viewport" content="width=device-width,initial-scale=1">${sheets.map(s=>`<link rel="stylesheet" href="/src/${s}">`).join('')}<link rel="stylesheet" href="/maplibre.css"><style>body{margin:0;padding:12px}#root{max-width:1200px;margin:auto}</style><div id="root"></div><script type="module" src="/qa.js"></script></html>`;
const server=createServer((req,res)=>{try{const url=req.url.split('?')[0];if(url==='/')res.end(req.url.includes('navigation')?html.replace('/qa.js','/navigation.js'):html);else if(url==='/navigation.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'navigation.js')))}else if(url==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}else if(url==='/ruc/latest.json')res.end(JSON.stringify({modelFields:{key:'runs/test/model-fields/index.json'},precipitationTotals:{key:'runs/test/precipitation-totals.json'},observedPrecipitation:{key:'runs/test/observed-precipitation.json'}}));else if(url==='/ruc/runs/test/precipitation-totals.json')res.end(JSON.stringify(totalsData(false)));else if(url==='/ruc/runs/test/observed-precipitation.json')res.end(JSON.stringify(totalsData(true)));else if(url==='/ruc/runs/test/model-fields/index.json')res.end(JSON.stringify(index));else if(url.startsWith('/ruc/runs/test/model-fields/'))setTimeout(()=>res.end(objects[url.split('/').at(-1)]),80);else if(url==='/modelMapGeography.json')res.end(read('src/modelMapGeography.json'));else if(url==='/maplibre.css'){res.setHeader('Content-Type','text/css');res.end(read('node_modules/maplibre-gl/dist/maplibre-gl.css'))}else if(sheets.some(s=>url==='/src/'+s)){res.setHeader('Content-Type','text/css');res.end(read(url.slice(1)))}else if(url==='/dist/assets/'+worker){res.setHeader('Content-Type','application/javascript');res.end(read(url.slice(1)))}else{res.statusCode=404;res.end()}}catch(e){res.statusCode=500;res.end(String(e))}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
async function assertLegend(page){
 const measurements=await page.locator('.mid-model-map-legend').evaluate(root=>{
  const bounds=root.getBoundingClientRect(),ticks=[...root.querySelectorAll('.mid-model-map-legend__tick')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right}});
  const clipped=[...root.querySelectorAll('.mid-model-map-legend__tick,.mid-model-map-legend__unit-value,.mid-model-map-legend__mode,.mid-model-map-legend__title')].filter(e=>{
   const r=e.getBoundingClientRect();for(let p=e.parentElement;p;p=p.parentElement){const style=getComputedStyle(p),b=p.getBoundingClientRect(),paint=/paint|strict|content/.test(style.contain);if((paint||/hidden|clip/.test(style.overflowX))&&(r.left<b.left-1||r.right>b.right+1))return true;if((paint||/hidden|clip/.test(style.overflowY))&&(r.top<b.top-1||r.bottom>b.bottom+1))return true}return false;
  }).map(e=>e.textContent);
  return {left:bounds.left,right:bounds.right,ticks,clipped,gradient:getComputedStyle(root.querySelector('.mid-model-map-legend__gradient')).backgroundImage,buttons:[...root.querySelectorAll('button')].map(e=>e.getBoundingClientRect().height)};
 });
 assert.equal(measurements.ticks.length,3,'Numeric legend exposes three readable values');
 assert.deepEqual(measurements.clipped,[],'Actual legend values and controls must not be hidden by any ancestor clipping/containment');
 assert.ok(measurements.gradient.startsWith('linear-gradient'),'Actual app CSS must render the supplied continuous scale');
 assert.ok(measurements.buttons.every(height=>height>=44),'Scale controls retain 44px touch targets');
 for(let i=0;i<measurements.ticks.length;i++){
  const tick=measurements.ticks[i];assert.ok(tick.left>=measurements.left-1&&tick.right<=measurements.right+1,'Legend values are not clipped');
  if(i)assert.ok(measurements.ticks[i-1].right<=tick.left+1,'Adjacent legend values do not overlap');
 }
}
try{for(const [width,height] of [[320,640],[390,844],[844,390],[1024,768],[1440,900]])for(const kind of ['temperature','rain']){const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));await page.goto(`http://127.0.0.1:${server.address().port}/?${kind}`);await page.getByRole('button',{name:'PNG herunterladen'}).waitFor();await page.waitForFunction(()=>!document.querySelector('.weather-precipitation-exports button').disabled);assert.match(await page.locator('tbody').innerText(),kind==='rain'?/0,6/:/15,6/);await page.getByRole('button',{name:'+1 h',exact:true}).click();await page.waitForFunction(expected=>document.querySelector('tbody')?.innerText.includes(expected)&&!document.querySelector('.weather-precipitation-exports button').disabled,kind==='rain'?'0,1 mm/1 h':'15,1 °C');assert.match(await page.locator('tbody').innerText(),kind==='rain'?/0,1/:/15,1/);const download=page.waitForEvent('download');await page.getByRole('button',{name:'SVG herunterladen'}).click();assert.match((await download).suggestedFilename(),/\.svg$/);const pngDownload=page.waitForEvent('download');await page.getByRole('button',{name:'PNG herunterladen'}).click();assert.match((await pngDownload).suggestedFilename(),/\.png$/);for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${theme}: overflow`);await page.screenshot({path:join(out,`${width}-${height}-${kind}-${theme}.png`),fullPage:true});}assert.equal(errors.length,0,errors.join('; '));await page.close();console.log(`MID141 native map ${width}×${height} ${kind}: terms, raster values, PNG/SVG download, lossless raster and no overflow verified`)}
 for(const [width,height] of [[320,640],[390,844],[844,390],[1024,768],[1440,900]])for(const kind of ['wind','gust']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/model-fields/'))requests.push(r.url())});
  await page.route('https://**/*',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
  await page.goto(`http://127.0.0.1:${server.address().port}/?${kind}`);
  await page.waitForFunction(()=>!document.querySelector('.weather-precipitation-exports button')?.disabled);
  const loaded=requests.length,expected={kn:'20 kt',kmh:'38 km/h',ms:'10,4 m/s',mph:'23 mph'};
  for(const unit of ['kn','kmh','ms','mph']){
   await page.getByRole('button',{name:'Einheit '+unit,exact:true}).click();
   await page.waitForFunction(v=>document.querySelector('tbody')?.innerText.includes(v),expected[unit]);
   assert.equal(requests.length,loaded,'Unit switches must not refetch or alter immutable model fields');
   for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${kind} ${unit} ${theme}: overflow`);
    const clipped=await page.locator('tbody td').first().evaluate(e=>{
     const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();
     for(let p=e;p;p=p.parentElement){const style=getComputedStyle(p),bounds=p.getBoundingClientRect();if(/hidden|clip/.test(style.overflowX)&&(r.left<bounds.left-1||r.right>bounds.right+1))return true}return e.scrollWidth>e.clientWidth+1;
    });
    assert.equal(clipped,false,'Selected-unit favorite value must not be clipped');
    await assertLegend(page);
    assert.equal(await page.locator('.mid-model-map-legend__unit-value').innerText(),expected[unit].split(' ').at(-1),'Legend and favorites share the selected unit');
    await page.screenshot({path:join(out,`${width}-${kind}-${unit}-${theme}.png`),fullPage:true});
   }
   const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'SVG herunterladen'}).click();
   const file=await downloaded;const path=join(out,`export-${width}-${kind}-${unit}.svg`);await file.saveAs(path);
   const svg=readFileSync(path,'utf8');assert.ok(svg.includes(expected[unit]));assert.ok(svg.includes('Wertebereich · relative Farbskala'));
   if(unit!=='kmh')assert.ok(!svg.includes('km/h'),'Export must not mix raw and selected wind units');
  }
  await page.getByRole('button',{name:'Feste Skala',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Feste Skala',exact:true}).getAttribute('aria-pressed'),'true');
  const fixedDownload=page.waitForEvent('download');await page.getByRole('button',{name:'SVG herunterladen'}).click();const fixedFile=await fixedDownload,fixedPath=join(out,`fixed-${width}-${kind}.svg`);await fixedFile.saveAs(fixedPath);assert.ok(readFileSync(fixedPath,'utf8').includes('Feste Skala'));
  await page.getByRole('button',{name:'Wertebereich',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Wertebereich',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Animation starten',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.mid-model-map-legend__mode[aria-pressed="true"]')?.textContent.includes('Feste Skala'));
  assert.equal(await page.getByRole('button',{name:'Wertebereich',exact:true}).isDisabled(),true,'Animation locks the relative scale');
  assert.equal(await page.getByRole('button',{name:'Feste Skala',exact:true}).isDisabled(),true,'Animation scale cannot flicker');
  await page.getByRole('button',{name:'Animation pausieren',exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'PNG herunterladen'}).click();assert.match((await downloaded).suggestedFilename(),/\.png$/);
  assert.equal(errors.length,0,errors.join('; '));await page.close();
  console.log(`MID148 native ${width}×${height} ${kind}: four live units, SVG parity, PNG, fixed animation scale and both themes verified`);
 }

 for(const [width,height] of [[320,640],[390,844],[844,390],[1024,768],[1440,900]])for(const kind of ['totals','observed']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
  await page.goto(`http://127.0.0.1:${server.address().port}/?${kind}`);
  await page.waitForFunction(()=>!document.querySelector('.weather-precipitation-exports button')?.disabled);
  assert.match(await page.locator('tbody').innerText(),/0,4 mm/);
  if(kind==='observed')assert.match(await page.locator('tbody').innerText(),/kein verifiziertes Raster/);
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${kind} ${theme}: overflow`);
   await assertLegend(page);
   await page.screenshot({path:join(out,`${width}-${kind}-${theme}.png`),fullPage:true});
  }
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'SVG herunterladen'}).click();const file=await downloaded,path=join(out,`export-${width}-${kind}.svg`);await file.saveAs(path);
  const svg=readFileSync(path,'utf8');assert.ok(svg.includes('Wertebereich · relative Farbskala'));assert.ok(svg.includes('0,4 mm'));
  if(kind==='observed')assert.ok(svg.includes('grau = fehlende Messdaten'));
  await page.getByRole('button',{name:'Feste Skala',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Feste Skala',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Wertebereich',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Wertebereich',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(errors.length,0,errors.join('; '));await page.close();console.log(`MID148 ${width}×${height} ${kind}: continuous scale, matching SVG values and missing-data semantics verified`);
 }
 for(const [width,height] of [[320,640],[390,844],[844,390],[1024,768],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const theme of ['light','dark']){
   await page.goto(`http://127.0.0.1:${server.address().port}/?navigation`);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const navigation=page.getByRole('navigation',{name:'Hauptnavigation'});await navigation.waitFor();assert.equal(await navigation.getByRole('button').count(),5);
   const before=await navigation.boundingBox();assert.ok(before&&before.x>=0&&before.y>=0&&before.x+before.width<=width+1&&before.y+before.height<=height+1,'Portalled navigation remains inside the viewport');
   assert.equal(await navigation.evaluate(e=>getComputedStyle(e).position),'fixed');
   assert.equal(await navigation.evaluate(e=>e.parentElement.parentElement===document.body),true,'Production portal escapes the transformed/contained dashboard');
   await page.evaluate(()=>scrollTo(0,800));await page.waitForTimeout(100);const after=await navigation.boundingBox();assert.ok(Math.abs(before.y-after.y)<1,'Bottom/side navigation is viewport-fixed while scrolling');
   await page.getByRole('button',{name:'Karten',exact:true}).click();assert.equal(await page.locator('#status').innerText(),'composite');
   await page.getByRole('button',{name:'Mehr',exact:true}).click();assert.equal(await page.locator('#status').innerText(),'more');
   const heights=await navigation.getByRole('button').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().height));assert.ok(heights.every(h=>h>=44),'Navigation preserves touch targets');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Portal does not add horizontal overflow');
   await page.screenshot({path:join(out,`${width}-navigation-${theme}.png`),fullPage:false});
  }
  assert.equal(errors.length,0,errors.join('; '));await page.close();console.log(`MID148 navigation ${width}×${height}: actual production portal, five controls, transformed parent, scroll and both themes verified`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));if(process.env.MID_KEEP_BROWSER_QA!=='1')rmSync(out,{recursive:true,force:true})}

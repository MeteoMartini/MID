/** Real Chromium + React map-handoff QA; no native iOS/WebKit certification.
 * An intentional synthetic descendant render failure tests React containment;
 * real CurrentSurroundings -> MapWorkspacePanel mounts both real MapLibre maps.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {realpathSync} from 'node:fs';
import {createServer} from 'vite';

const require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],
 {encoding:'utf8',timeout:90000,stdio:['ignore','pipe','inherit']}).trim());
const pw=require(join(dirname(dirname(cli)),'playwright'));
assert.equal(require(join(dirname(cli),'package.json')).version,'1.56.1');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>html,body{margin:0;font:14px system-ui;background:#dce5ec}*{box-sizing:border-box}'+
 '.qa-app{padding:8px;max-width:1200px;margin:0 auto}.qa-app>h1{font-size:1.1rem}'+
 '.qa-app .current-surroundings-map{height:260px}.qa-app .map-workspace-shell{min-height:480px}'+
 '.qa-app .composite-maplibre{min-height:420px;height:480px}</style></head><body>'+
 '<div id="root"></div><script type="module" src="/scripts/fixtures/surroundings-real-map-open-recovery-browser.tsx"></script></body></html>';
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},
 plugins:[{name:'mid-surroundings-open-crash-qa',configureServer(vite){
  vite.middlewares.use('/__mid_map_open_qa',async(req,res)=>{
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.end(await vite.transformIndexHtml('/__mid_map_open_qa',html));
  });
 }}]});
await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await pw.chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const contexts=[];

async function verify(width,theme){
 const page=await browser.newPage({viewport:{width,height:850},colorScheme:theme});
 const unexpected=[];
 page.on('pageerror',e=>unexpected.push(e.message));
 try{
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_map_open_qa',{waitUntil:'domcontentloaded',timeout:45000});
  const button=page.getByRole('button',{name:'Karte öffnen',exact:true});
  await button.waitFor({timeout:35000});
  await page.locator('.current-surroundings-maplibre canvas').first().waitFor({timeout:35000});
  const target=await page.locator('.current-surroundings-maplibre canvas').first().boundingBox();
  assert.ok(target&&target.width>100&&target.height>100,'Compact map has a real canvas before navigation');
  await button.click();
  await page.getByTestId('qa-full-map').waitFor({timeout:15000});
  await page.locator('.composite-maplibre canvas').first().waitFor({timeout:35000});
  await page.waitForFunction(()=>{
   const el=document.querySelector('.composite-maplibre canvas');
   return Boolean(el&&el.width>0&&el.height>0);
  },null,{timeout:20000});
  const request=await page.evaluate(()=>window.__midMapOpenRequest);
  assert.ok(request&&Number.isFinite(request.lat)&&Number.isFinite(request.lon));
  assert.ok([request.bounds.west,request.bounds.south,request.bounds.east,request.bounds.north].every(Number.isFinite));
  assert.ok(request.bounds.west<request.bounds.east&&request.bounds.south<request.bounds.north);
  // A user opening the larger map must not leave two live WebGL maps mounted.
  await page.waitForFunction(()=>document.querySelectorAll('.maplibregl-map').length===1,null,{timeout:8000})
   .catch(async(error)=>{
    const detail=await page.evaluate(()=>({
     count:document.querySelectorAll('.maplibregl-map').length,
     items:[...document.querySelectorAll('.maplibregl-map')].map(el=>({
      classes:el.className,parent:el.parentElement?.className,
      parent2:el.parentElement?.parentElement?.className,
      rect:el.getBoundingClientRect().toJSON()
     })),
     fullCount:document.querySelectorAll('.composite-maplibre').length,
     compactCount:document.querySelectorAll('.current-surroundings-maplibre').length,
     pageText:document.body?.innerText.slice(0,2500),
     localReactError:sessionStorage.getItem('mid:map:last-render-error'),
     lastOpenIntent:sessionStorage.getItem('mid:map:last-open-intent'),
     recentPageErrors:window.__qaPageErrors??null
    }));
    throw new Error('Real MapLibre handoff map count diagnostics '+JSON.stringify(detail)+' | '+String(error));
   });
  assert.equal(await page.locator('.current-surroundings-maplibre').count(),0);
  assert.equal(await page.locator('.composite-maplibre').count(),1);
  assert.equal(await page.getByTestId('qa-app-alive').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false);
  assert.deepEqual(unexpected,[],'No unexpected React crash on actual component navigation '+width+'/'+theme);
  contexts.push({width,theme,realMapHandoff:true,singleWebglMap:true,appAlive:true});
 }finally{await page.close()}
}
async function verifyFault(){
 const page=await browser.newPage({viewport:{width:390,height:840},colorScheme:'dark'});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/__mid_map_open_qa?fault=1',{waitUntil:'domcontentloaded'});
  const alert=page.getByRole('alert',{name:'Kartenansicht konnte nicht dargestellt werden'});
  await alert.waitFor({timeout:20000});
  assert.ok((await alert.textContent()).includes('Die übrigen Wetteransichten bleiben verfügbar'));
  assert.equal(await page.getByTestId('qa-app-alive').count(),1);
  const button=alert.getByRole('button',{name:'Karte erneut versuchen'});
  const box=await button.boundingBox();
  assert.ok(box&&box.height>=44,'Recover button meets WCAG touch target');
  await button.click();
  await page.getByTestId('qa-map-recovered').waitFor({timeout:12000});
  assert.equal(await page.getByRole('alert').count(),0);
  assert.equal(await page.getByTestId('qa-app-alive').count(),1);
  assert.ok(errors.every(s=>s.includes('SYNTHETIC_MAP_QA_RENDER_FAILURE')),
   'A synthetic intentional error may be reported, but no other page error is permitted');
  return {faultContained:true,retryWorks:true,appAlive:true,syntheticErrors:errors.length};
 }finally{await page.close()}
}
try{
 for(const width of [390,834])for(const theme of ['light','dark'])await verify(width,theme);
 const fault=await verifyFault();
 console.log('MID_REAL_MAP_OPEN_CRASH_CONTAINMENT_BROWSER '+JSON.stringify({
  chromium:true,caseCount:contexts.length,cases:contexts,fault,
  synthetic:true,nativeIos:false,fullAppState:false,weatherNetwork:false}));
}finally{await browser.close();await server.close()}

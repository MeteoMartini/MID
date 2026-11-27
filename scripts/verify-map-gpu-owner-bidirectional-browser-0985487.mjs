/** True Chromium and two React panels. Not native iOS, full app, real weather network or GPU memory. */
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
 '.qa-app{padding:8px;max-width:1200px;margin:0 auto}.qa-app h1{font-size:1.1rem}'+
 '.qa-app nav{display:flex;flex-wrap:wrap;gap:8px}.qa-app nav button{min-height:44px}'+
 '.qa-app .current-surroundings-map{height:260px}.qa-app .composite-maplibre{min-height:420px;height:440px}'+
 '.qa-app .map-workspace-shell{min-height:420px}</style></head><body>'+
 '<div id="root"></div><script type="module" src="/scripts/fixtures/map-gpu-owner-bidirectional-browser.tsx"></script></body></html>';
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},
 plugins:[{name:'mid-bidirectional-gpu-qa',configureServer(vite){
  vite.middlewares.use('/__mid_bidirectional_map_qa',async(req,res)=>{
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.end(await vite.transformIndexHtml('/__mid_bidirectional_map_qa',html));
  });
 }}]});
await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await pw.chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const contexts=[];
async function check(page,owner,width,theme){
 const target=owner==='compact'?'.current-surroundings-maplibre':'.composite-maplibre';
 try{
  await page.waitForFunction(({owner,target})=>{
   const count=document.querySelectorAll('.maplibregl-map').length;
   const current=document.querySelector('[data-testid="qa-owner"]')?.textContent;
   const canvas=document.querySelector(target+' canvas.maplibregl-canvas');
   return current===owner&&count===(owner==='none'?0:1)&&
    (owner==='none'||Boolean(canvas&&canvas.width>0&&canvas.height>0));
  },{owner,target},{timeout:28000});
 }catch(error){
  const detail=await page.evaluate(()=>({
   owner:document.querySelector('[data-testid="qa-owner"]')?.textContent,
   maps:[...document.querySelectorAll('.maplibregl-map')].map(x=>x.className),
   compact:document.querySelectorAll('.current-surroundings-maplibre').length,
   full:document.querySelectorAll('.composite-maplibre').length,
   renderError:document.querySelector('.mid-map-workspace-error')?.textContent??null,
   text:document.body.innerText.slice(0,750)
  }));
  throw new Error('Real MapLibre GPU owner failed '+width+'/'+theme+'/'+owner+' '+JSON.stringify(detail)+' '+String(error));
 }
 assert.equal(await page.locator('[data-testid="qa-compact"]').count(),1);
 assert.equal(await page.locator('[data-testid="qa-full"]').count(),1);
 assert.equal(await page.locator('.current-surroundings-maplibre').count(),owner==='compact'?1:0);
 assert.equal(await page.locator('.composite-maplibre').count(),owner==='workspace'?1:0);
}
async function verify(width,theme,iterations){
 const page=await browser.newPage({viewport:{width,height:850},colorScheme:theme});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_bidirectional_map_qa',{waitUntil:'domcontentloaded',timeout:45000});
  await check(page,'compact',width,theme);
  for(let i=0;i<iterations;i++){
   await page.getByRole('button',{name:'Karte öffnen',exact:true}).click();
   await check(page,'workspace',width,theme);
   // Both panels are mounted: a deliberate pause is not a meteorological NoData result.
   const sources=page.locator('[data-testid="qa-compact"] .current-surroundings-sources');
   await sources.locator('summary').click();
   assert.match(await sources.innerText(),/Wetterbild und Umfeldtemperaturen pausiert/);
   assert.doesNotMatch(await sources.innerText(),/Kein zeitlich und räumlich belegtes Temperaturfeld verfügbar|Originalbeobachtung|Bild gültig/);
   await sources.locator('summary').click();
   await page.getByTestId('qa-current').click();
   await check(page,'compact',width,theme);
   await page.getByTestId('qa-warnings').click();
   await check(page,'none',width,theme);
   await page.getByTestId('qa-current').click();
   await check(page,'compact',width,theme);
  }
  assert.equal(await page.getByTestId('qa-app-alive').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,
   'No horizontal overflow at '+width+'/'+theme);
  assert.deepEqual(errors,[],'Unexpected actual React/MapLibre errors');
  contexts.push({width,theme,cycles:iterations,owners:['compact','workspace','none'],
   bothPanelsMounted:true,atMostOneWebglMap:true});
 }finally{await page.close()}
}
async function verifyWebglContextRecovery(){
 const page=await browser.newPage({viewport:{width:390,height:850},colorScheme:'dark'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_bidirectional_map_qa',{waitUntil:'domcontentloaded',timeout:45000});
  await check(page,'compact',390,'dark');
  const hasExtension=await page.evaluate(()=>{
   const canvas=document.querySelector('.current-surroundings-maplibre canvas.maplibregl-canvas');
   if(!(canvas instanceof HTMLCanvasElement))return false;
   const extension=canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
   if(!extension)return false;
   window.__midQaContextExtension=extension;extension.loseContext();return true;
  });
  assert.ok(hasExtension,'Real WEBGL_lose_context is required; no skipped GPU recovery proof');
  await page.waitForFunction(()=>{
   const el=document.querySelector('.current-surroundings-maplibre .map-availability-error');
   return Boolean(el?.textContent?.includes('Grafiksitzung'));
  },null,{timeout:15000});
  assert.equal(await page.locator('.current-surroundings-center-marker').count(),0);
  await page.evaluate(()=>window.__midQaContextExtension.restoreContext());
  await page.waitForFunction(()=>Boolean(
   document.querySelector('.current-surroundings-center-marker') &&
   !document.querySelector('.current-surroundings-maplibre .map-availability-error') &&
   document.querySelectorAll('.maplibregl-map').length===1
  ),null,{timeout:20000});
  await page.getByTestId('qa-composite').click();await check(page,'workspace',390,'dark');
  await page.getByTestId('qa-current').click();await check(page,'compact',390,'dark');
  assert.deepEqual(errors,[],'GPU recovery must not raise uncaught JS errors');
  return {realWebgl2Loss:true,realWebgl2Restore:true,midLayersRemountedAfterStyleLoad:true,
   nativeIos:false,deviceMemory:false};
 }finally{await page.close()}
}
async function verifyUnacknowledgedNavigation(){
 const page=await browser.newPage({viewport:{width:390,height:850},colorScheme:'dark'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_bidirectional_map_qa',{waitUntil:'domcontentloaded',timeout:45000});
  await check(page,'compact',390,'dark');
  await page.getByTestId('qa-stall-open').click();
  await page.getByRole('button',{name:'Karte öffnen',exact:true}).click();
  const busy=page.getByRole('button',{name:'Karte wird geöffnet …',exact:true});
  await busy.waitFor({timeout:2500});
  assert.equal(await busy.isDisabled(),true,'In-flight map button blocks duplicate taps');
  // The React effect owns and clears its bounded 8s timer.
  await page.locator('.current-surroundings-map-open-error[role="alert"]').waitFor({timeout:11500});
  assert.equal(await page.getByRole('button',{name:'Karte öffnen',exact:true}).isEnabled(),true);
  assert.ok((await page.locator('.current-surroundings-map-open-error').textContent()).includes('nicht bestätigt'));
  await page.getByTestId('qa-restore-open').click();
  await page.getByRole('button',{name:'Karte öffnen',exact:true}).click();
  await check(page,'workspace',390,'dark');
  await page.getByTestId('qa-current').click();
  await check(page,'compact',390,'dark');
  assert.equal(await page.getByRole('button',{name:'Karte öffnen',exact:true}).isEnabled(),true,
   'Successful navigation and return must reset opening latch');
  assert.deepEqual(errors,[],'No React errors in failed navigation and recovered click');
  return {unconfirmedActionUnlocked:true,duplicateGuard:true,acknowledgedRetry:true,
   returnReenablesButton:true,timeoutMs:8000,nativeIos:false};
 }finally{await page.close()}
}
try{
 for(const width of [320,390,430,834,1024,1440])
  for(const theme of ['light','dark'])await verify(width,theme,width===390&&theme==='dark'?16:2);
 const recovery=await verifyWebglContextRecovery();
 const navigation=await verifyUnacknowledgedNavigation();
 console.log('MID_MAP_GPU_OWNER_BIDIRECTIONAL_CHROMIUM '+JSON.stringify({
  chromium:true,cases:contexts,recovery,navigation,nativeIos:false,weatherNetwork:false,fullAppNavigation:false,gpuMemory:false
 }));
}finally{await browser.close();await server.close()}
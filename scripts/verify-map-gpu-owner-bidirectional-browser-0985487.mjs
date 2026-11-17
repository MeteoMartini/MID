/** True Chromium and two React panels. Not native iOS, full app, real weather network or GPU memory. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {isAbsolute,join} from 'node:path';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const playwrightPath=process.env.MID_QA_PLAYWRIGHT_DIR??'';
assert(isAbsolute(playwrightPath),'Set MID_QA_PLAYWRIGHT_DIR to an independently provisioned Playwright 1.56.1 package');
assert.equal(require(join(playwrightPath,'package.json')).version,'1.56.1');
const pw=require(playwrightPath);
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
let browser;
try{browser=await pw.chromium.launch({headless:true,chromiumSandbox:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});}
catch(error){await server.close();throw error;}
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
try{
 for(const width of [320,390,430,834,1024,1440])
  for(const theme of ['light','dark'])await verify(width,theme,width===390&&theme==='dark'?16:2);
 console.log('MID_MAP_GPU_OWNER_BIDIRECTIONAL_CHROMIUM '+JSON.stringify({
  chromium:true,cases:contexts,nativeIos:false,weatherNetwork:false,fullAppNavigation:false,gpuMemory:false
 }));
}finally{await browser.close();await server.close()}

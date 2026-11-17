/**
 * Real Chromium browser probe against MID's productive MidMapLibre in two
 * independent compact/full containers. No weather network or official pixels.
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
 '<style>*{box-sizing:border-box}body{margin:0;font:14px system-ui}h1{font-size:1.1rem}h2{font-size:1rem}'+
 '.qa-responsive-app{padding:8px;max-width:1600px;margin:auto}.qa-two-maps{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px}'+
 '@media(max-width:650px){.qa-two-maps{grid-template-columns:minmax(0,1fr)}}'+
 '.qa-two-maps article{min-width:0;border:1px solid #9ab0c0;border-radius:8px;padding:6px}'+
 '.qa-map-canvas{width:100%;height:280px;min-height:200px}.qa-map-large{height:390px}'+
 'button{min-height:44px}</style></head><body><div id="root"></div>'+
 '<script type="module" src="/scripts/fixtures/map-dual-responsive-resize-browser.tsx"></script></body></html>';
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},
 plugins:[{name:'mid-map-resize-qa',configureServer(vite){
  vite.middlewares.use('/__mid_map_resize_qa',async(req,res)=>{
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.end(await vite.transformIndexHtml('/__mid_map_resize_qa',html));
  });
 }}]});
await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await pw.chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

function jsSnapshot(){
 const maps=window.__midResizeMaps??{};
 const names=['surroundings','composite'];
 return Object.fromEntries(names.map(name=>{
  const map=maps[name];if(!map)return [name,null];
  const container=map.getContainer(),canvas=map.getCanvas(),center=map.getCenter();
  return[name,{zoom:map.getZoom(),center:[center.lat,center.lng],
   width:container.clientWidth,height:container.clientHeight,
   canvasWidth:canvas.width,canvasHeight:canvas.height,
   dpr:devicePixelRatio,resizeCalls:window.__midResizeCalls?.[name]??0}];
 }));
}
function normalized(snap){
 return Object.fromEntries(Object.entries(snap).map(([name,obj])=>[name,obj?{
  zoom:obj.zoom,center:obj.center,width:obj.width,height:obj.height,
  canvasWidth:obj.canvasWidth,canvasHeight:obj.canvasHeight,
  dpr:obj.dpr,resizeCalls:obj.resizeCalls}:null]));
}
async function ready(page){
 await page.waitForFunction(()=>{
  const m=window.__midResizeMaps??{};
  return ['surroundings','composite'].every(id=>{
   const map=m[id];
   if(!map||!map.loaded())return false;
   const c=map.getContainer(),canvas=map.getCanvas();
   return c.clientWidth>150&&c.clientHeight>150&&
    Math.abs(canvas.width-c.clientWidth*devicePixelRatio)<3&&
    Math.abs(canvas.height-c.clientHeight*devicePixelRatio)<3;
  });
 },null,{timeout:30000});
}
async function twoFrames(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function verify(width,theme){
 const page=await browser.newPage({viewport:{width,height:920},colorScheme:theme,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errors.push(m.text())});
 try{
  // This fixture cannot silently use weather tile APIs or download official data.
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_map_resize_qa',{waitUntil:'domcontentloaded',timeout:30000});
  await ready(page);await twoFrames(page);
  await page.evaluate(()=>{window.__midResizeBaselineMaps={...window.__midResizeMaps}});
  const baseline=await page.evaluate(jsSnapshot);
  const initial=normalized(baseline);
  assert.equal(Object.keys(initial).length,2);
  assert.ok(initial.surroundings.width>=150&&initial.composite.width>=150);
  // Flood both window and ResizeObserver-driven layout notifications without a
  // real size change. The single owner must NOT redundantly invoke Map.resize().
  await page.evaluate(()=>{
   for(let i=0;i<75;i++)window.dispatchEvent(new Event('resize'));
  });
  await twoFrames(page);
  const noChange=normalized(await page.evaluate(jsSnapshot));
  for(const id of ['surroundings','composite'])
   assert.equal(noChange[id].resizeCalls,initial[id].resizeCalls,
    width+'/'+theme+': unchanged layout generated an unnecessary GPU map resize for '+id);
  // Actual compact/full container and height changes without changing viewport,
  // exercising CSS flex/grid changes that window-only listeners miss.
  await page.evaluate(()=>{
   const small=document.querySelector('.qa-surroundings .qa-map-canvas');
   const big=document.querySelector('.qa-composite .qa-map-canvas');
   small.style.width='72%';small.style.height='240px';
   big.style.width='84%';big.style.height='320px';
  });
  await page.waitForFunction(()=>{
   return ['surroundings','composite'].every(id=>{
    const m=window.__midResizeMaps[id];if(!m)return false;
    const c=m.getContainer(),canvas=m.getCanvas();
    return Math.abs(c.clientWidth*devicePixelRatio-canvas.width)<3&&
     Math.abs(c.clientHeight*devicePixelRatio-canvas.height)<3&&
     (id==='surroundings'?c.clientHeight===240:c.clientHeight===320);
   });
  },null,{timeout:20000});
  const changed=normalized(await page.evaluate(jsSnapshot));
  for(const id of ['surroundings','composite']){
   assert.ok(changed[id].resizeCalls>noChange[id].resizeCalls,
    id+': real container size change must reach actual Map.resize');
   assert.ok(changed[id].resizeCalls-noChange[id].resizeCalls<=3,
    id+': two CSS changes in one style update must not cause a resize storm');
  }
  const sameObjects=await page.evaluate(()=>{
   const maps=window.__midResizeMaps,initial=window.__midResizeBaselineMaps;
   return Object.keys(initial).every(id=>maps[id]===initial[id]);
  });
  assert.equal(sameObjects,true,'Responsive size change must retain same MapLibre map objects');
  for(const id of ['surroundings','composite']){
   assert.equal(changed[id].zoom,initial[id].zoom,'Resize must not change original map zoom');
   assert.deepEqual(changed[id].center,initial[id].center,'Resize must not shift actual map coordinates');
  }
  // Closing / reopening the two map cards must not leave a stale resize owner.
  await page.getByRole('button',{name:'Karten umschalten'}).click();
  await page.waitForFunction(()=>Object.keys(window.__midResizeMaps??{}).length===0);
  await page.getByRole('button',{name:'Karten umschalten'}).click();
  await ready(page);
  assert.equal(await page.locator('.maplibregl-map').count(),2,'Exactly two maps after remount, no orphan canvases');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow');
  assert.deepEqual(errors,[],'No browser/React error during two-map responsive resizing');
  return{width,theme,initialSize:[initial.surroundings.width,initial.composite.width],
   compactResizes:changed.surroundings.resizeCalls-noChange.surroundings.resizeCalls,
   fullResizes:changed.composite.resizeCalls-noChange.composite.resizeCalls,
   unchangedSizeExtraResizes:0};
 }finally{await page.close()}
}
try{
 const cases=[];
 for(const width of [320,390,430,834,1024,1440])for(const theme of ['light','dark'])
  cases.push(await verify(width,theme));
 console.log('MID_DUAL_MAP_RESPONSIVE_RESIZE_BROWSER '+JSON.stringify({
  engine:'Chromium',weatherData:'none-synthetic-map-shells',cases,
  allViewportCases:cases.length,dprUnitCheck:'separate-vitest',
  visualGpuPixelParity:'not-claimed',nativeIos:'not-tested'}));
}finally{await browser.close();await server.close()}

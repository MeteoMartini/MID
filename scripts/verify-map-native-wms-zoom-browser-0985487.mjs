/** Real Chromium / MID MapLibre+React source-identity QA for radar/satellite WMS zoom.
 * All weather-colored tiles are LOCAL SYNTHETIC PNGs: no false claims about
 * DWD product validity, external network, performance or native iOS QA.
 * Run on the final LC SHA after selective import:
 *   node scripts/verify-map-native-wms-zoom-browser-0985487.mjs
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {realpathSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createServer} from 'vite';

const TEST_OBS='2026-11-17T06:15:00.000Z';
const TEST_FUTURE='2026-11-17T06:20:00.000Z';
const require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],
 {encoding:'utf8',timeout:90000,stdio:['ignore','pipe','inherit']}).trim());
const pw=require(join(dirname(dirname(cli)),'playwright'));
assert.equal(require(join(dirname(cli),'package.json')).version,'1.56.1','Pinned Playwright runtime required');

function crc32(bytes){
 let value=0xffffffff;
 for(const byte of bytes){value^=byte;for(let bit=0;bit<8;bit++)value=(value&1)?(value>>>1)^0xedb88320:value>>>1}
 return(value^0xffffffff)>>>0;
}
function pngChunk(name,payload){
 const tag=Buffer.from(name,'ascii'),result=Buffer.alloc(payload.length+12);
 result.writeUInt32BE(payload.length,0);tag.copy(result,4);payload.copy(result,8);
 result.writeUInt32BE(crc32(result.subarray(4,8+payload.length)),8+payload.length);
 return result;
}
function localSyntheticPng([red,green,blue]){
 const width=256,height=256,scan=Buffer.alloc(height*(1+width*4)),stride=1+width*4;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const index=y*stride+1+x*4;scan[index]=red;scan[index+1]=green;scan[index+2]=blue;scan[index+3]=255;
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),
  pngChunk('IDAT',deflateSync(scan,{level:1})),pngChunk('IEND',Buffer.alloc(0))]);
}
const originalPng=localSyntheticPng([17,140,212]);
const nowcastPng=localSyntheticPng([243,146,29]);
const livePng=localSyntheticPng([147,104,191]);
const requests=[];
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{font:14px system-ui;background:#dfe7ec;margin:0}.qa-container{max-width:1250px;margin:auto;padding:8px}'+
 '.qa-maplibre{width:100%;height:520px;min-height:400px}.mid-zoom-qa-controls{display:flex;gap:6px;flex-wrap:wrap;padding:8px}'+
 '.mid-zoom-qa-controls button{min-height:44px}.mid-zoom-qa-controls output{font-size:12px}</style></head>'+
 '<body><div id="root"></div><script type="module" src="/scripts/fixtures/map-native-wms-zoom-browser.tsx"></script></body></html>';
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},
 plugins:[{name:'mid-native-wms-zoom-qa',configureServer(vite){
  vite.middlewares.use(async(req,res,next)=>{
   try{
    const url=new URL(req.url??'/', 'http://127.0.0.1');
    if(url.pathname==='/__mid_qa_wms'){
     assert.equal(url.searchParams.get('service')?.toUpperCase(),'WMS');
     assert.equal(url.searchParams.get('request')?.toUpperCase(),'GETMAP');
     const when=url.searchParams.get('time');
     assert.ok(when===null||when===TEST_OBS||when===TEST_FUTURE,
      'An unsupported or invented source time must not become a test PNG');
     const png=when===TEST_OBS?originalPng:when===TEST_FUTURE?nowcastPng:livePng;
     requests.push({time:when,revision:url.searchParams.get('revision'),bbox:url.searchParams.get('bbox')});
     res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store',
      'Content-Length':String(png.length),'X-MID-QA-Source':'synthetic-local-only'});
     res.end(png);return;
    }
    if(url.pathname==='/__mid_zoom_qa'){
     res.setHeader('Content-Type','text/html; charset=utf-8');
     res.end(await vite.transformIndexHtml('/__mid_zoom_qa',html));return;
    }
    next();
   }catch(error){next(error)}
  });
 }}]});
await server.listen();
const address=server.httpServer.address(),base='http://127.0.0.1:'+address.port;
const browser=await pw.chromium.launch({headless:true,
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

async function state(page){
 return page.evaluate(()=>{
  const map=window.__midWmsZoomMap;
  if(!map)return null;
  const sources=map.getStyle()?.sources??{};
  const wms=Object.keys(sources).filter(id=>/^wms-.*-source$/.test(id));
  const quad=Object.keys(sources).filter(id=>/^qa-surroundings-original-source/.test(id));
  return {zoom:map.getZoom(),wms,quad,
   wmsUrls:wms.flatMap(id=>sources[id].tiles??[]),
   wmsReady:wms.every(id=>map.isSourceLoaded(id)),
   quadReady:quad.every(id=>map.isSourceLoaded(id))};
 });
}
async function waitReady(page,needQuad=true){
 await page.waitForFunction(needQuad=>{
  const map=window.__midWmsZoomMap;
  if(!map)return false;
  const sources=Object.keys(map.getStyle()?.sources??{}),
   wms=sources.filter(id=>/^wms-.*-source$/.test(id)),
   quad=sources.filter(id=>/^qa-surroundings-original-source/.test(id));
  return wms.length===1&&(!needQuad||quad.length===1)&&
   wms.every(id=>map.isSourceLoaded(id))&&quad.every(id=>map.isSourceLoaded(id));
 },needQuad,{timeout:24000});
}
async function verify(width,theme){
 const page=await browser.newPage({viewport:{width,height:780},colorScheme:theme,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/*',route=>new URL(route.request().url()).host===new URL(base).host?
   route.continue():route.abort('blockedbyclient'));
  await page.goto(base+'/__mid_zoom_qa',{waitUntil:'domcontentloaded',timeout:30000});
  await page.getByRole('button',{name:'MapLibre zoom +1'}).waitFor();
  await waitReady(page);
  const initial=await state(page);
  assert.equal(initial.wms.length,1,'One active real MapLibre WMS source');
  assert.equal(initial.quad.length,1,'One active real surroundings ImageQuad source');
  assert.ok(initial.wmsUrls.some(url=>new URL(url).searchParams.get('time')===TEST_OBS),
   'Initial WMS is the EXACT observed UTC original');
  await page.evaluate(()=>{
   const map=window.__midWmsZoomMap,ids=Object.keys(map.getStyle().sources);
   window.__midZoomOriginalWms=map.getSource(ids.find(id=>/^wms-.*-source$/.test(id)));
   window.__midZoomOriginalQuad=map.getSource(ids.find(id=>/^qa-surroundings-original-source/.test(id)));
  });
  await page.getByRole('button',{name:'MapLibre zoom +1'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-testid="qa-zooming"]')?.textContent==='zooming',{timeout:10000});
  const during=await page.evaluate(()=>{
   const map=window.__midWmsZoomMap,ids=Object.keys(map.getStyle().sources);
   return{sameWms:ids.some(id=>map.getSource(id)===window.__midZoomOriginalWms),
    sameQuad:ids.some(id=>map.getSource(id)===window.__midZoomOriginalQuad)};
  });
  assert.deepEqual(during,{sameWms:true,sameQuad:true},
   'Dated original map+surroundings raster sources remain mounted DURING animated zoom');
  await page.waitForFunction(()=>document.querySelector('[data-testid="qa-revision"]')?.textContent==='1'&&
   document.querySelector('[data-testid="qa-zooming"]')?.textContent==='idle',null,{timeout:15000});
  await waitReady(page);
  const after=await state(page);
  const same=await page.evaluate(()=>{
   const map=window.__midWmsZoomMap,ids=Object.keys(map.getStyle().sources);
   return{sameWms:ids.some(id=>map.getSource(id)===window.__midZoomOriginalWms),
    sameQuad:ids.some(id=>map.getSource(id)===window.__midZoomOriginalQuad)};
  });
  assert.deepEqual(same,{sameWms:true,sameQuad:true},
   'No WMS source remount or ImageQuad blanking at zoomend');
  assert.deepEqual(after.wmsUrls,initial.wmsUrls,
   'Original WMS TIME, layer/BBOX template and revision must NOT change because of zoom');
  assert.ok(after.zoom>initial.zoom+.8,'Actual MapLibre zoom advanced');
  await page.getByRole('button',{name:'DWD nowcast original'}).click();
  await waitReady(page);
  const future=await state(page);
  assert.ok(future.wmsUrls.every(url=>new URL(url).searchParams.get('time')===TEST_FUTURE),
   'Future Nowcast original is a distinct UTC source, not relabelled old pixels');
  await page.getByRole('button',{name:'Untimed latest snapshot'}).click();
  await waitReady(page,false);
  const untimed=await state(page);
  assert.equal(untimed.quad.length,0,'No observed satellite/quad image is shown for future mutable latest');
  assert.ok(untimed.wmsUrls.every(url=>!new URL(url).searchParams.has('time')),
   'Latest snapshot has NO fabricated TIME parameter');
  await page.evaluate(()=>{
   const map=window.__midWmsZoomMap,ids=Object.keys(map.getStyle().sources);
   window.__midZoomMutable=map.getSource(ids.find(id=>/^wms-.*-source$/.test(id)));
  });
  await page.getByRole('button',{name:'MapLibre zoom +1'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-testid="qa-revision"]')?.textContent==='2'&&
   document.querySelector('[data-testid="qa-zooming"]')?.textContent==='idle',null,{timeout:15000});
  await waitReady(page,false);
  const mutable=await state(page);
  const replaced=await page.evaluate(()=>{
   const map=window.__midWmsZoomMap,ids=Object.keys(map.getStyle().sources);
   return ids.every(id=>map.getSource(id)!==window.__midZoomMutable);
  });
  assert.ok(replaced,'Untimed latest WMS MUST remount/refetch on zoom');
  assert.ok(mutable.wmsUrls[0].includes('revision=2'),'Mutable latest WMS revision advances');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
   'No viewport overflow at '+width+' / '+theme);
  assert.deepEqual(errors,[],'No React or MapLibre errors '+width+' / '+theme);
  assert.equal(await page.getByTestId('qa-wms-error').textContent(),'0');
  return{width,theme,timedSourceRetained:true,quadSourceRetained:true,
   latestRefreshed:true,originalTimePreserved:true,requestCount:requests.length};
 }finally{await page.close()}
}
try{
 const cases=[];
 for(const width of [390,1024])for(const theme of ['light','dark'])cases.push(await verify(width,theme));
 assert.ok(requests.some(x=>x.time===TEST_OBS)&&requests.some(x=>x.time===TEST_FUTURE)&&
  requests.some(x=>x.time===null),'All three synthetic WMS products were genuinely requested');
 console.log('MID_MAPLIBRE_NATIVE_WMS_ZOOM_BROWSER '+JSON.stringify({engine:'Chromium',synthetic:true,
  cases,requests:requests.length,originalTime:TEST_OBS,nowcastTime:TEST_FUTURE}));
}finally{await browser.close();await server.close()}

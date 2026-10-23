import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {realpathSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';

const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(!process.env.MID_CHROMIUM_EXECUTABLE)execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});

const entry=`
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MidMapLibre,MapFitBounds,useMidMap} from '/src/MapLibreCore.tsx';
import {NativeScalarOverlay} from '/src/NativeScalarMapOverlay.tsx';
const base={schema:'mid.icon-d2.field.v1',run:'2026-10-23T00:00Z',time:'2026-10-23T01:00Z',kind:'temperature',unit:'°C',scale:1,lats:[48,49,50],lons:[7,8,9],values:[0,0,0,0,20,0,0,0,0],isobars:[]};
function Content(){
 const map=useMidMap(),[field,setField]=useState(base);
 useEffect(()=>{window.__midTestMap=map;window.__midTestSetField=setField},[map]);
 return <><MapFitBounds south={47.9} west={6.9} north={50.1} east={9.1} maxZoom={6} padding={10}/><NativeScalarOverlay field={field} unit="kn" extremes={true} lines={false}/></>;
}
document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')||'light';
createRoot(document.getElementById('root')).render(<MidMapLibre center={[49,8]} zoom={5} className="mid-viewport-test-map" navigationControl={false}><Content/></MidMapLibre>);
`;
const compiled=await transform(entry,{loader:'tsx',jsx:'automatic',format:'esm'});
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null,hmr:false},plugins:[{
 name:'mid-viewport-extrema-browser-fixture',
 configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url?.startsWith('/__mid_viewport_317')){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}.mid-viewport-test-map{height:390px;width:100%}</style><div id="root"></div><script type="module" src="/__mid_viewport_entry.tsx"></script></html>')}else next()})},
 resolveId(id){if(id==='/__mid_viewport_entry.tsx')return '\\0mid-viewport-entry.tsx'},
 load(id){if(id==='\\0mid-viewport-entry.tsx')return compiled.code}
}]});
await server.listen();
const browser=await chromium.launch({headless:true,...(process.env.MID_CHROMIUM_EXECUTABLE?{executablePath:process.env.MID_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const out='/tmp/mid317-viewport-extremes';mkdirSync(out,{recursive:true});
let count=0;
try{
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const labels=()=>page.locator('.native-raster-extreme span');
 for(const [width,height]of [[320,740],[390,844],[844,390],[1024,768],[1440,900]])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__mid_viewport_317?theme=${theme}`);
  await page.waitForFunction(()=>!!window.__midTestMap);
  await page.waitForFunction(()=>document.querySelectorAll('.native-raster-extreme span').length===2);
  assert.deepEqual((await labels().allTextContents()).sort(),['0','20']);
  assert.ok((await labels().evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).color==='rgb(255, 255, 255)'&&node.textContent?.trim()!=='Min'&&node.textContent?.trim()!=='Max'))),'Numbers must be white without Min/Max labels');
  await page.evaluate(()=>window.__midTestMap.jumpTo({center:[8,49],zoom:9}));
  await page.waitForFunction(()=>document.querySelectorAll('.native-raster-extreme span').length===1);
  assert.equal((await labels().first().textContent())?.trim(),'20','Zoom selects one real center cell, not full raster extrema');
  await page.evaluate(()=>window.__midTestMap.jumpTo({center:[12,52],zoom:9}));
  await page.waitForFunction(()=>document.querySelectorAll('.native-raster-extreme span').length===0);
  await page.evaluate(()=>window.__midTestMap.jumpTo({center:[8,49],zoom:9}));
  await page.waitForFunction(()=>document.querySelectorAll('.native-raster-extreme span').length===1);
  assert.equal(await labels().first().getAttribute('tabindex'),'0','Numeric marker keyboard focus preserved');
  await page.evaluate(()=>window.__midTestSetField(current=>({...current,values:[0,0,0,0,NaN,0,0,0,0]})));
  await page.waitForFunction(()=>document.querySelectorAll('.native-raster-extreme span').length===0);
  if(width===320)await page.locator('.mid-viewport-test-map').screenshot({path:`${out}/${width}-${theme}.png`});
  assert.equal(await page.locator('.map-availability-error').count(),0,'MapLibre rendered without a WebGL error');
  count++;
 }
 assert.deepEqual(errors,[],'Browser/React/MapLibre runtime errors');
 console.log(`PASS ${count} real MapLibre viewport/theme cases: initial extrema, pan/zoom, NoData, keyboard, white numeric labels · ${out}`);
}finally{await browser.close();await server.close()}

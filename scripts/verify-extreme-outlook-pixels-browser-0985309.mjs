// MID v0.9.85.309: fail-closed browser pixel QA of actual React/MapLibre overlay.
// Synthetic fixture is explicitly NOT a live forecast or real-device approval.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';

const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const evidenceDir=process.env.MID_EXTREME_QA_DIR||'artifacts/extreme-browser-qa';
mkdirSync(evidenceDir,{recursive:true});
const report={schema:'mid.extreme-outlook.browser-pixels.v1',version:'0.9.85.309',commit:process.env.GITHUB_SHA||null,origin:'real MID React/MapLibre component; deterministic synthetic fields, not an official warning',cases:[],errors:[],ready:false};
const server=await createServer({cacheDir:'node_modules/.vite-mid-extreme-qa',server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});
await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader'],...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});
async function delta(page,a,b){
 return page.evaluate(async values=>{
  const read=async base64=>{
   const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
   const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
   const context=surface.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
   return context.getImageData(0,0,surface.width,surface.height).data;
  };
  const left=await read(values[0]),right=await read(values[1]);let changed=0;
  if(left.length!==right.length)throw Error('Screenshot geometry changed');
  for(let index=0;index<left.length;index+=4)if(Math.abs(left[index]-right[index])+Math.abs(left[index+1]-right[index+1])+Math.abs(left[index+2]-right[index+2])>72)changed++;
  return changed;
 },[a.toString('base64'),b.toString('base64')]);
}
try{
 for(const [width,height] of [[320,680],[390,844],[430,920],[834,1112],[1024,768],[1440,900]])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,deviceScaleFactor:1,hasTouch:width<=834});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.goto(base+'/tests/visual/extreme-outlook-qa.html?theme='+theme,{waitUntil:'domcontentloaded'});
  assert.ok(await page.evaluate(()=>Boolean(document.createElement('canvas').getContext('webgl2')||document.createElement('canvas').getContext('webgl'))),'No WebGL: cannot approve native fill pixels');
  await page.waitForFunction(()=>Boolean(window.__midPolygonQaMap?.getLayer('extreme-outlook-contours-fill')),null,{timeout:30000});
  await page.waitForFunction(()=>Boolean(document.querySelector('.extreme-map-label')),null,{timeout:30000});
  await page.waitForFunction(()=>window.__midPolygonQaMap?.isSourceLoaded('extreme-outlook-contours-source')===true,null,{timeout:30000});
  await page.waitForFunction(()=>window.__midPolygonQaMap?.queryRenderedFeatures({layers:['extreme-outlook-contours-fill']}).length>0,null,{timeout:30000});
  const state=await page.evaluate(()=>({
   n:window.__midPolygonQaMap.queryRenderedFeatures({layers:['extreme-outlook-contours-fill']}).length,
   layers:window.__midPolygonQaMap.getStyle().layers.filter(layer=>layer.id.startsWith('extreme-outlook-contours-')).map(layer=>layer.id),
   overflow:document.documentElement.scrollWidth>window.innerWidth+1
  }));
  assert.ok(state.n>0&&state.layers.length>=3,'GeoJSON must contain actual modelled fill features');
  assert.equal(state.overflow,false,'Horizontal overflow at '+width+'px '+theme);
  assert.equal(await page.locator('.extreme-map-layer-fallback-status').count(),0,'Native should initially be healthy');
  if([390,1024].includes(width))await page.screenshot({path:join(evidenceDir,'native-'+width+'-'+theme+'.png'),animations:'disabled',fullPage:true});
  const map=page.locator('.qa-map');
  const mask=await page.addStyleTag({content:'.extreme-map-label,.extreme-map-layer-fallback-status,canvas.extreme-outlook-native-fallback{visibility:hidden!important}'});
  const realPixels=await map.screenshot({animations:'disabled'});
  await page.evaluate(()=>window.__midPolygonQaMap.setLayoutProperty('extreme-outlook-contours-fill','visibility','none'));
  await page.waitForFunction(()=>document.querySelector('.extreme-map-layer-fallback-status'),null,{timeout:12000});
  await page.waitForTimeout(450);
  const hiddenPixels=await map.screenshot({animations:'disabled'});
  const changed=await delta(page,realPixels,hiddenPixels);
  assert.ok(changed>300,'Native polygon paint not visible: '+changed+' pixel differences at '+width+'px '+theme);
  await mask.evaluate(element=>element.remove());
  await page.waitForFunction(()=>{
   const canvas=document.querySelector('canvas.extreme-outlook-native-fallback');
   if(!canvas)return false;
   const pixels=canvas.getContext('2d')?.getImageData(0,0,canvas.width,canvas.height).data;
   if(!pixels)return false;let visible=0;
   for(let index=3;index<pixels.length;index+=4)if(pixels[index]>50)visible++;
   return visible>300;
  },null,{timeout:12000});
  const fallback=await page.evaluate(()=>{
   const canvas=document.querySelector('canvas.extreme-outlook-native-fallback'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let colored=0;
   for(let index=3;index<pixels.length;index+=4)if(pixels[index]>50)colored++;
   return{colored,opacity:Number(getComputedStyle(canvas).opacity)};
  });
  assert.ok(fallback.colored>300&&fallback.opacity>.9,'Canvas pixels or on-screen opacity missing');
  if([390,1024].includes(width))await page.screenshot({path:join(evidenceDir,'fallback-'+width+'-'+theme+'.png'),animations:'disabled',fullPage:true});
  await page.evaluate(()=>window.__midPolygonQaReset());
  await page.waitForFunction(()=>window.__midPolygonQaMap?.getLayer('extreme-outlook-contours-fill')&&!document.querySelector('.extreme-map-layer-fallback-status'),null,{timeout:18000});
  await page.evaluate(()=>window.__midPolygonQaSetValid(false));
  await page.waitForFunction(()=>document.querySelectorAll('.extreme-map-label').length===0,null,{timeout:18000});
  assert.equal(await page.locator('.extreme-map-layer-fallback-status').count(),0,'Empty forecast must not synthesize hazards');
  assert.deepEqual(errors,[],'Unexpected browser error at '+width+'/'+theme);
  report.cases.push({width,height,theme,nativeFeatures:state.n,nativeChangedPixels:changed,fallbackColoredPixels:fallback.colored,recovered:true,missingNoFakeHazards:true,overflow:false});
  console.log('MID visual QA passed '+width+'px '+theme+' / nativeDelta='+changed+' / fallbackPixels='+fallback.colored);
  await context.close();
 }
 report.ready=true;
 console.log('MID WebGL/Canvas acceptance succeeded: '+report.cases.length+' viewport/theme cases');
}catch(error){report.errors.push(error instanceof Error?error.stack:String(error));throw error;
}finally{
 writeFileSync(join(evidenceDir,'evidence.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();await server.close();
}

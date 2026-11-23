/**
 * MID Karten QA: browser-rendered smoke for the EXACT current redraw helper.
 *
 * This deliberately uses synthetic visibilitychange events: headless Chromium
 * does not reliably mark a previous tab hidden when Playwright opens a new tab.
 * The script exercises real Chromium rAF, DOM events and Canvas 2D pixels,
 * but is NOT native iOS, full MID App, actual GPU/MapLibre or real tab-QA.
 *
 * Run after installing existing locked MID dev dependencies:
 *   CHROMIUM_PATH=/usr/bin/chromium node scripts/qa/verify-map-canvas-resume-browser.mjs
 * Uses the existing MID pinned Playwright 1.56.1 resolver; no CI bypass.
 */
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import ts from 'typescript-strada';

const require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',[
 'exec','--yes','--package=playwright@1.56.1','--','which','playwright'
],{encoding:'utf8',timeout:120000}).trim());
const playwright=require(join(dirname(dirname(cli)),'playwright'));
const raw=readFileSync(new URL('../../src/mapCanvasCrossfadePolicy.ts',import.meta.url),'utf8');
assert.match(raw,/export function createMapCanvasRedrawScheduler\(/);
const compile=ts.transpileModule(raw,{compilerOptions:{
 target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext
},reportDiagnostics:true});
assert.equal(compile.diagnostics?.length??0,0,'Canvas helper has TS transpile diagnostics');
const js=compile.outputText.replace(/^export\s+/gm,'');
assert.doesNotMatch(js,/^\s*(?:import|export)\s/m,'Browser probe requires a self-contained helper');
assert.match(js,/function createMapCanvasRedrawScheduler\(/);

const fixture=`
window.__mid={
 count:0,colors:[],visible:true,wanted:'#d22',revision:1
};
const canvas=document.querySelector('canvas');
const ctx=canvas.getContext('2d',{willReadFrequently:true});
const scheduler=createMapCanvasRedrawScheduler(()=>{
 ctx.fillStyle=window.__mid.wanted;
 ctx.fillRect(0,0,canvas.width,canvas.height);
 window.__mid.count++;
 window.__mid.colors.push(Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3).join(','));
},callback=>requestAnimationFrame(callback),id=>cancelAnimationFrame(id),()=>window.__mid.visible);
const mapEvents=new EventTarget();
mapEvents.addEventListener('render',()=>scheduler.request());
const onVisibility=()=>scheduler.visibilityChange(window.__mid.visible);
document.addEventListener('visibilitychange',onVisibility);
window.__mid.burst=n=>{for(let i=0;i<n;i++)mapEvents.dispatchEvent(new Event('render'))};
window.__mid.visibility=(v,paint)=>{
 window.__mid.visible=v;
 if(paint)window.__mid.wanted=paint;
 document.dispatchEvent(new Event('visibilitychange'));
};
window.__mid.dispose=()=>{
 scheduler.dispose();
 document.removeEventListener('visibilitychange',onVisibility);
};
`;

const scenarios=[
 [320,568,1,'light'],[390,844,3,'dark'],[430,932,3,'light'],
 [834,1112,2,'dark'],[1024,768,2,'light'],[1440,900,1,'dark']
];
const browser=await playwright.chromium.launch({
 headless:true,args:['--no-sandbox'],
 ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})
});
try{
 for(const [width,height,dpr,scheme] of scenarios){
  const context=await browser.newContext({
   viewport:{width,height},deviceScaleFactor:dpr,colorScheme:scheme
  });
  try{
   const page=await context.newPage();
   await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><canvas width="300" height="150" style="display:block;width:100%;height:64px"></canvas></body></html>`);
   await page.addScriptTag({content:js+'\n'+fixture});
   await page.evaluate(()=>window.__mid.burst(40));
   await page.waitForFunction(()=>window.__mid.count===1);
   let output=await page.evaluate(()=>({count:window.__mid.count,colors:window.__mid.colors}));
   assert.deepEqual(output,{count:1,colors:['221,34,34']});
   await page.evaluate(()=>{
    window.__mid.visibility(false,'#26f');
    window.__mid.burst(80);
   });
   output=await page.evaluate(()=>({count:window.__mid.count,colors:window.__mid.colors}));
   assert.deepEqual(output,{count:1,colors:['221,34,34']},
    'hidden-event burst must not paint or invent a new source image');
   await page.evaluate(()=>window.__mid.visibility(true));
   await page.waitForFunction(()=>window.__mid.count===2);
   output=await page.evaluate(()=>({
    count:window.__mid.count,colors:window.__mid.colors,
    overflow:document.documentElement.scrollWidth>innerWidth
   }));
   assert.deepEqual(output,{count:2,colors:['221,34,34','34,102,255'],overflow:false});
   await page.evaluate(()=>{window.__mid.dispose();window.__mid.burst(20)});
   await page.waitForTimeout(75);
   assert.equal(await page.evaluate(()=>window.__mid.count),2,'disposal must prevent more drawing');
   console.log(`PASS ${width}x${height} DPR${dpr} ${scheme}: 40→1, 80 hidden→0, resume→1, no post-dispose draw, pixels valid`);
  }finally{await context.close()}
 }
 console.log('MID isolated Chromium Canvas redraw smoke: all six scenarios passed; synthetic visibility, NOT full MID/WebKit/iOS.');
}finally{await browser.close()}

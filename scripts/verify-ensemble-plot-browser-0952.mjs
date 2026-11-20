/** MID #952: genuine React/Recharts browser geometry. No mock SVG or official forecast.
 * Run explicitly on a locally checked-out QA HEAD: node scripts/verify-ensemble-plot-browser-0952.mjs
 * This pilot does NOT satisfy Safari/iOS/VoiceOver, source gate, installer or Stable promotion. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,realpathSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {midCssQaBrowserExecutable} from './lib/cssQaBrowserExecutable.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
const browserExecutable=process.env.MID_BROWSER_EXECUTABLE||midCssQaBrowserExecutable();
if(process.env.GITHUB_ACTIONS==='true'&&!browserExecutable)execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const evidenceDir=resolve(root,process.env.MID_ENSEMBLE_BROWSER_QA_DIR||'artifacts/ensemble-952-browser-qa');
mkdirSync(evidenceDir,{recursive:true});
const report={schema:'mid.ensemble-952.real-render-geometry.v1',version:pkg.version,head:process.env.GITHUB_SHA||null,
fixture:'14 fully synthetic deterministic dates; original EnsemblePanel/Recharts module; no real forecast',
browser:null,cases:[],errors:[],passed:false};
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false,watch:null},cacheDir:'node_modules/.vite-ensemble-952-qa'});
let browser;
const viewports=[[320,568],[390,844],[430,932],[834,1112],[1024,768],[1440,900],[1920,1080]];
try{
 await server.listen();
 const origin='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await chromium.launch({headless:true,...(browserExecutable?{executablePath:browserExecutable}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 report.browser=browser.version();
 for(const [width,height] of viewports)for(const theme of ['light','dark'])for(const fontScale of [1,...([390,1024].includes(width)?[2]:[])]){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,deviceScaleFactor:1,hasTouch:width<=834,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],externalRequests=[];
  try{
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(origin+'/'))return route.continue();
    externalRequests.push(url.split('?')[0]);return route.abort();
   });
   await page.addInitScript(({scale,theme})=>{
    const epoch=Date.UTC(2026,10,20,12),OriginalDate=Date;
    class FrozenDate extends OriginalDate{
     constructor(...args){if(args.length===0)super(epoch);else if(args.length===1)super(args[0]);else super(...args);}
     static now(){return epoch}
    }
    window.Date=FrozenDate;
    localStorage.setItem('theme',theme);
    const applyFont=()=>{if(document.documentElement)document.documentElement.style.fontSize=(scale*100)+'%';};
    if(document.documentElement)applyFont();else document.addEventListener('DOMContentLoaded',applyFont,{once:true});
   },{scale:fontScale,theme});
   await page.goto(origin+'/tests/visual/ensemble-geometry-qa.html?theme='+theme,{waitUntil:'domcontentloaded'});
   const canvas=page.locator('.ensemble-temperature-canvas');
   await canvas.locator('svg.recharts-surface').waitFor({timeout:25000});
   await canvas.locator('svg.ensemble-temperature-weather-overlay.weather .ensemble-sky-strip-outline').waitFor({timeout:25000});
   await page.waitForFunction(()=>document.querySelectorAll('.ensemble-temperature-canvas .ensemble-temperature-value text').length>=14,null,{timeout:12000});
   const measure=await canvas.evaluate(host=>{
    const finite=value=>Number.isFinite(value);
    const pickRect=node=>({x:Number(node.getAttribute('x')),y:Number(node.getAttribute('y')),width:Number(node.getAttribute('width')),height:Number(node.getAttribute('height'))});
    const clipRects=[...host.querySelectorAll('svg.recharts-surface clipPath rect')].map(pickRect).filter(r=>Object.values(r).every(finite)&&r.width>100&&r.height>50);
    if(!clipRects.length)throw Error('Missing actual Recharts SVG plot clip rectangle');
    const mainPlot=clipRects.sort((a,b)=>b.width*b.height-a.width*a.height)[0];
    const band=host.querySelector('svg.ensemble-temperature-weather-overlay.weather .ensemble-sky-strip-outline');
    if(!band)throw Error('Missing original MID weatherband SVG');
    const weather=pickRect(band),allLabels=[...host.querySelectorAll('.ensemble-temperature-value text')];
    // Screen-space bounds include Recharts <g> transforms. getBBox() alone is local to
    // the nearest SVG coordinate system and would falsely validate/deny moved ticks.
    const surface=host.querySelector('svg.recharts-surface');
    if(!surface)throw Error('Missing Recharts surface for transformed label geometry');
    const svgTop=surface.getBoundingClientRect().top;
    const labels=allLabels.map(text=>{const rect=text.getBoundingClientRect();return{x:rect.x,y:rect.top-svgTop,width:rect.width,height:rect.height,value:text.textContent}});
    const xAxisText=[...host.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick text')].map(text=>{const rect=text.getBoundingClientRect();return {y:rect.top-svgTop,height:rect.height,text:text.textContent}});
    const lines=host.querySelectorAll('svg.recharts-surface .recharts-line .recharts-curve').length;
    const size=host.getBoundingClientRect();
    return{plot:mainPlot,weather,labels,xAxisText,lines,width:size.width,height:size.height,
     pageOverflow:document.documentElement.scrollWidth>innerWidth+2,
     theme:document.documentElement.dataset.theme};
   });
   assert.ok(measure.plot.y>=0&&measure.plot.height>60,'No valid real chart plot rectangle');
   const bottom=measure.plot.y+measure.plot.height;
   assert.ok(measure.weather.y>=bottom+8,'Weatherband intrudes into the real Recharts temperature plot');
   assert.ok(measure.weather.y+measure.weather.height<measure.height-7,'Weatherband clipped by chart frame');
   assert.ok(measure.labels.length>=14,'Not all Best Match temperature labels rendered');
   assert.ok(measure.labels.every(l=>finiteNumber(l.y)&&l.y>=measure.plot.y-1&&l.y+l.height<=bottom+1),'Best Match label overlaps weatherband or leaves plot');
   assert.ok(measure.lines>=2,'Temperature min/max source paths missing');
   assert.ok(measure.xAxisText.length>=7,'Daily ticks not rendered in real Recharts');
   assert.ok(measure.xAxisText.every(l=>l.y>=measure.weather.y+measure.weather.height-2),'Date tick text overlaps weatherband');
   assert.equal(measure.theme,theme,'Light/Dark theme missing');
   assert.equal(measure.pageOverflow,false,'Horizontal viewport overflow');
   assert.deepEqual(errors,[],'Browser JS errors');
   // Screenshots are evidence only, never a substitute for the geometric assertions.
   const suffix=width+'-'+theme+'-'+Math.round(fontScale*100)+'pct';
   await canvas.screenshot({path:join(evidenceDir,suffix+'.png'),animations:'disabled'});
   report.cases.push({width,height,theme,fontScale,measure,synthetic:true,passed:true,externalRequests:externalRequests.length});
  }catch(error){
   const label=width+'-'+theme+'-'+Math.round(fontScale*100)+'pct';
   report.errors.push({case:label,error:String(error),pageErrors:errors,externalRequests:externalRequests.slice(0,10)});
   await page.screenshot({path:join(evidenceDir,'failed-'+label+'.png'),animations:'disabled'}).catch(()=>{});
  }finally{await context.close()}
 }
 report.passed=report.errors.length===0&&report.cases.length===18;
 assert.equal(report.passed,true,'Ensemble visual QA failed closed: '+JSON.stringify(report.errors).slice(0,3500));
 console.log('MID #952 REAL browser SVG geometry PASS '+report.cases.length+' cases Chromium '+report.browser);
}catch(error){report.errors.push({fatal:String(error)});throw error}
finally{
 writeFileSync(join(evidenceDir,'report.json'),JSON.stringify(report,null,2));
 await browser?.close().catch(()=>{});
 await server.close();
}
function finiteNumber(value){return Number.isFinite(value)}

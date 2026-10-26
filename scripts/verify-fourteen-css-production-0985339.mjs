import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,symlink,mkdir,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const root=resolve(import.meta.dirname,'..'),reference=resolve(process.env.MID_CSS_PARITY_BASE||root);
const cli=await realpath(process.env.MID_PLAYWRIGHT_CLI||execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const require=createRequire(import.meta.url),engines=require(join(dirname(dirname(cli)),'playwright'));
const browserNames=(process.env.MID_CSS_BROWSER_ENGINES||'chromium,webkit').split(',');
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','--with-deps',...browserNames],{stdio:'inherit',timeout:240000});
const temp=await mkdtemp(join(tmpdir(),'mid-css-production-'));
const rows=Array.from({length:14},(_,i)=>({date:`2026-10-${String(i+7).padStart(2,'0')}`,meanDayTemperature:12,regimeText:i<4?'Ruhig':'Regen',bestMax:18+i/3,bestMin:6+i/4,maxLow:14,maxQ25:15,maxQ75:19,maxHigh:23,minLow:2,minQ25:4,minQ75:7,minHigh:9,ensembleAvailable:i!==4,assessment:{agreement:'high',confidenceScore:90,dataQuality:'good',limiting:[]}}));
async function fixture(project,name,baseline){
 const dir=join(temp,name);await mkdir(dir);await symlink(join(root,'node_modules'),join(dir,'node_modules'));
 // Reconstruct Stable's last eager stylesheet without requiring an old checkout in CI.
 let css=await readFile(join(project,'src/midPresentation.css'),'utf8');
 if(baseline&&!css.includes('[data-fourteen-development]'))css+='\n'+await readFile(join(project,'src/midC28MapPhase.css'),'utf8');
 await writeFile(join(dir,'base.css'),css);
 await writeFile(join(dir,'index.html'),'<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/entry.jsx"></script></body></html>');
 await writeFile(join(dir,'entry.jsx'),`import React,{lazy,Suspense,useState} from 'react';import{createRoot}from'react-dom/client';import './base.css';import '${project}/src/horizonInstruments.css';const Panel=lazy(()=>import('${project}/src/FourteenDayDevelopment.tsx').then(m=>({default:m.FourteenDayDevelopment})));const theme=new URLSearchParams(location.search).get('theme');document.documentElement.dataset.theme=theme;document.documentElement.dataset.midDesign='next';function QA(){const[open,setOpen]=useState(false);return <main className="app"><button id="open" onClick={()=>setOpen(v=>!v)}>Entwicklung öffnen</button>{open&&<Suspense fallback={<p role="status">Laden</p>}><Panel series={${JSON.stringify(rows)}}/></Suspense>}</main>}createRoot(document.getElementById('root')).render(<QA/>);`);
 await build({root:dir,configFile:false,plugins:[baseline&&{name:'stable-development-css-reference',enforce:'pre',transform(code,id){if(id===join(project,'src/FourteenDayDevelopment.tsx'))return code.replace("import './midC28MapPhase.css';\n",'');}},react()],logLevel:'error',build:{outDir:'dist',target:'es2020',cssMinify:'lightningcss',minify:'oxc',reportCompressedSize:false}});
 let cssRequests=0;const server=createServer(async(req,res)=>{try{const path=resolve(dir,'dist','.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));assert.ok(path.startsWith(join(dir,'dist')+'/'));const file=path.endsWith('/')?join(path,'index.html'):path;if(/FourteenDayDevelopment-.*\.css$/.test(file))cssRequests++;res.setHeader('Cache-Control',file.endsWith('.html')?'no-store':'public, max-age=31536000, immutable');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,cssRequests:()=>cssRequests,url:`http://127.0.0.1:${server.address().port}/`};
}
let active,stable,cases=0;
async function snapshot(page){return page.locator('[data-fourteen-development]').evaluate(el=>[...el.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {tag:n.tagName,text:n.children.length?'':n.textContent,box:[r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100),style:['display','color','backgroundColor','fontSize','fontWeight','lineHeight','padding','margin','border','borderRadius','gridTemplateColumns','gap','fill','stroke','opacity'].map(k=>s[k])};}));}
try{
 active=await fixture(root,'active',false);stable=await fixture(reference,'stable',true);
 for(const name of browserNames){const browser=await engines[name].launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});try{
 for(const [width,height]of [[320,568],[390,844],[430,932],[844,390],[834,1194],[1194,834],[1440,900]])for(const theme of ['light','dark','high-contrast']){
  const contexts=await Promise.all([active,stable].map(async(target)=>{const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(target.url+'?theme='+theme);await page.locator('#open').waitFor();return {context,page,errors};}));
  try{for(const cache of ['cold','warm']){const requestsBefore=active.cssRequests();
   for(const {page}of contexts){if(cache==='warm'){await page.reload();await page.locator('#open').waitFor();}assert.equal(await page.locator('[data-fourteen-development]').count(),0);assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(e=>/FourteenDayDevelopment-.*\.css/.test(e.name))),false,'Closed component must not fetch its CSS');await page.locator('#open').click();await page.locator('[data-signal-series="tmin"] circle').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(60);}
   const cssResources=await contexts[0].page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/FourteenDayDevelopment-.*\.css/.test(e.name)).map(e=>({transfer:e.transferSize,size:e.decodedBodySize})));assert.equal(cssResources.length,1,'One exclusive CSS chunk loaded');if(cache==='cold')assert.ok(cssResources[0].size>0);assert.equal(active.cssRequests()-requestsBefore,cache==='cold'?1:0,'Cold CSS fetched exactly once, warm CSS reused without HTTP');assert.ok(await contexts[0].page.evaluate(()=>[...document.styleSheets].some(s=>/FourteenDayDevelopment-.*\.css/.test(s.href||'')&&s.cssRules.length>0)),'Deferred stylesheet has actual CSS rules');if(cache==='warm')assert.equal(cssResources[0].transfer,0,'Warm run must use cached CSS');
   assert.deepEqual(await snapshot(contexts[0].page),await snapshot(contexts[1].page),`${name}/${width}/${theme}/${cache}: computed/layout parity`);
   for(const {page,errors}of contexts){assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.locator('[data-signal-series="tmin"] g[role="button"]').first().focus();await page.keyboard.press('Enter');assert.match(await page.getByRole('status').innerText(),/P10–P90/);}
   assert.equal(await contexts[0].page.locator('[data-fourteen-development] svg').first().evaluate(n=>n.outerHTML),await contexts[1].page.locator('[data-fourteen-development] svg').first().evaluate(n=>n.outerHTML),'Shared SVG geometry and accessible data');
   const images=await Promise.all(contexts.map(({page})=>page.locator('[data-fourteen-development]').screenshot({animations:'disabled'})));assert.ok(images[0].equals(images[1]),`${name}/${width}/${theme}/${cache}: pixel parity`);cases++;console.log(`${name} ${width}/${theme}/${cache}: parity passed`);
  }}finally{await Promise.all(contexts.map(({context})=>context.close()));}
 }
 }finally{await browser.close();}}
 console.log(`Production CSS parity: ${cases} engine/viewport/theme/cache cases; exact pixels, computed layout, keyboard, overflow and SVG passed. Browser engines only, no physical iOS/VoiceOver approval.`);
}finally{for(const target of [active,stable])if(target)await new Promise(r=>target.server.close(r));await rm(temp,{recursive:true,force:true});}

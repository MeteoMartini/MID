// Actual React + durable storage, synthetic UI consumers; no full-app/device approval.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {realpathSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';
import {transform} from 'esbuild';
const require=createRequire(import.meta.url);
const playwright=process.env.MID_PLAYWRIGHT_MODULE||join(dirname(dirname(realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim()))),'playwright');
const {chromium}=require(playwright);
const fixture=`import React from 'react';
import {createRoot} from 'react-dom/client';
import {useDisplayPreference,displayBoolean,displayChoice} from '/src/useDisplayPreference.ts';
import {initializeStorageSafety} from '/src/storageSafety.ts';
await initializeStorageSafety();
function Panel({id}){const [on,set]=useDisplayPreference(id,true,displayBoolean);return <button id={id} onClick={()=>set(v=>!v)}>{String(on)}</button>}
function App(){const [mounted,setMounted]=React.useState(true);const [mode,setMode]=useDisplayPreference('browser.mode','field',displayChoice('field','absolute'));return <><button id="mount" onClick={()=>setMounted(v=>!v)}>mount</button>{mounted&&<Panel id="browser.shared"/>}<Panel id="browser.independent"/><select id="mode" value={mode} onChange={e=>setMode(e.target.value)}><option>field</option><option>absolute</option></select></>}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`;
const server=await createServer({cacheDir:'node_modules/.vite-mid-display-qa',plugins:[{name:'display-fixture',configureServer(s){s.middlewares.use('/display-qa',async(req,res)=>{const html='<div id="root"></div><script type="module" src="/display-fixture.tsx"></script>';res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/display-qa',html))})},resolveId(id){if(id==='/display-fixture.tsx')return '\0display-fixture.tsx'},async load(id){if(id==='\0display-fixture.tsx')return (await transform(fixture,{loader:'tsx',jsx:'transform',target:'esnext'})).code}}],server:{host:'127.0.0.1',port:0,hmr:false,watch:null}});
await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});
let cases=0;
try{
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 for(const width of [320,390,430,834,1024,1440])for(const colorScheme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme}),a=await context.newPage(),b=await context.newPage(),errors=[];
  for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
  await a.goto(base+'/display-qa');await a.locator('#browser\\.shared').waitFor();
  await b.goto(base+'/display-qa');await b.locator('#browser\\.shared').waitFor();
  const shared=p=>p.locator('[id="browser.shared"]');
  assert.equal(await shared(a).textContent(),'true');await shared(a).click();
  await b.waitForFunction(()=>document.getElementById('browser.shared')?.textContent==='false');
  await shared(b).click();await a.waitForFunction(()=>document.getElementById('browser.shared')?.textContent==='true');
  await shared(a).click();await a.locator('#mode').selectOption('absolute');
  await a.locator('#mount').click();await a.locator('#mount').click();assert.equal(await shared(a).textContent(),'false');
  assert.equal(await a.locator('[id="browser.independent"]').textContent(),'true');
  await a.reload();await shared(a).waitFor();assert.equal(await shared(a).textContent(),'false');assert.equal(await a.locator('#mode').inputValue(),'absolute');
  assert.deepEqual(errors,[]);await context.close();cases++;
 }
 console.log('PASS actual React StrictMode/durable storage: '+cases+' viewport/theme cases; cross-tab live updates, remount, reload, enum and independent keys; synthetic consumers, not complete app/device QA');
}finally{await browser.close();await server.close()}

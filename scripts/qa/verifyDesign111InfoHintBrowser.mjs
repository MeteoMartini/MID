// MID Design111. Actual React InfoHint/Portal; isolated CSS and synthetic content.
// Run explicitly: node scripts/qa/verifyDesign111InfoHintBrowser.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:120000}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const dir=process.env.MID_DESIGN111_QA_DIR||'artifacts/design111-browser-qa';
mkdirSync(dir,{recursive:true});
const report={schema:'mid.design111.infohint.browser.v1',commit:process.env.GITHUB_SHA||null,syntheticFixture:true,ready:false,cases:[],errors:[]};
let browser,server;
try{
 server=await createServer({cacheDir:'node_modules/.vite-mid-design111-qa',server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});
 await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,680],[390,844],[834,1112],[1440,900]])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<=834,reducedMotion:'reduce'});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   await page.goto(base+'/tests/visual/design111-infohint-qa.html?theme='+theme,{waitUntil:'domcontentloaded'});
   const first=page.getByRole('button',{name:'Info-Test eins'}),second=page.getByRole('button',{name:'Info-Test zwei'});
   await first.waitFor({state:'visible'});
   assert.equal(await first.getAttribute('aria-expanded'),'false');
   assert.equal(await first.getAttribute('aria-controls'),null);
   const hit=await first.boundingBox();
   assert.ok(hit&&hit.width>=44&&hit.height>=44,'Touch target under 44px');
   await first.click();
   const dialog=page.getByRole('dialog',{name:'Info-Test eins'});
   await dialog.waitFor({state:'visible'});
   const id=await first.getAttribute('aria-controls');
   assert.ok(id&&id===await dialog.getAttribute('id'),'Trigger-to-portal ID mismatch');
   assert.equal(await dialog.getAttribute('aria-modal'),'true');
   const box=await dialog.boundingBox();
   assert.ok(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Portal outside viewport');
   await page.evaluate(()=>window.__midInfoHintQaRerender?.());
   await page.waitForFunction(()=>document.querySelector('.qa-shell')?.getAttribute('data-render-revision')==='1');
   assert.equal(await first.getAttribute('aria-controls'),id,'Dialog ID drift on parent rerender');
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   assert.equal(await first.getAttribute('aria-expanded'),'false');
   assert.equal(await first.getAttribute('aria-controls'),null);
   await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Info-Test eins',null,{timeout:3500});
   await second.focus();
   await page.keyboard.press('Enter');
   const secondDialog=page.getByRole('dialog',{name:'Info-Test zwei'});
   await secondDialog.waitFor({state:'visible'});
   const secondId=await second.getAttribute('aria-controls');
   assert.ok(secondId&&secondId!==id&&secondId===await secondDialog.getAttribute('id'),'Nonunique controlled dialogs');
   await page.locator('[data-qa-backdrop]').click();
   await secondDialog.waitFor({state:'hidden'});
   assert.equal(await second.getAttribute('aria-controls'),null);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.body.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,'Fixture overflow');
   assert.deepEqual(errors,[],'Browser exceptions');
   report.cases.push({width,height,theme,uniqueId:true,escape:true,focusRestored:true,keyboard:true,outsidePointer:true,overflow:false});
  }finally{await context.close()}
 }
 assert.equal(report.cases.length,8);
 report.ready=true;
}catch(error){report.errors.push(error instanceof Error?error.stack:String(error));throw error}
finally{
 writeFileSync(join(dir,'evidence.json'),JSON.stringify(report,null,2)+'\n');
 await browser?.close();
 await server?.close();
}

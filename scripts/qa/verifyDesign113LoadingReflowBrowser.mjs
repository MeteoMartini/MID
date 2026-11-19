/**
 * MID Design113: explicitly opt-in, real React loading-state reflow browser QA.
 * No source checkout mutation, no real weather API, no official warning claim.
 * Run on exact tested source SHA: node scripts/qa/verifyDesign113LoadingReflowBrowser.mjs
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';

const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:120000}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const dir=process.env.MID_DESIGN113_QA_DIR||'artifacts/design113-loading-reflow';
mkdirSync(dir,{recursive:true});
const evidence={schema:'mid.design113.loading-reflow.browser.v1',commit:process.env.GITHUB_SHA||null,kind:'actual MID React component with synthetic status labels and isolated fixture styles; NOT a full-app or iOS test',ready:false,cases:[],errors:[]};
let server,browser;
try{
 server=await createServer({cacheDir:'node_modules/.vite-mid-design113-qa',server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});
 await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});
 for(const [width,height] of [[320,680],[360,740],[390,844],[430,920],[834,1112],[1024,768],[1440,900]])for(const theme of ['light','dark'])for(const scale of [1,2]){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce',hasTouch:width<=834,deviceScaleFactor:1});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
   await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   await page.goto(base+'/tests/visual/design113-loading-reflow-qa.html?theme='+theme,{waitUntil:'domcontentloaded'});
   await page.addStyleTag({content:'html{font-size:'+16*scale+'px!important}'});
   await page.locator('.qa-panel .module-loading-state').first().waitFor({state:'visible'});
   const geometry=await page.evaluate(()=>{
    const panels=[...document.querySelectorAll('.qa-panel')];
    return {
     viewportOverflow:document.documentElement.scrollWidth>innerWidth+1||document.body.scrollWidth>innerWidth+1,
     panels:panels.map(panel=>{
      const status=panel.querySelector('.module-loading-state'),label=status?.querySelector('span'),decoration=status?.querySelector('[aria-hidden="true"]');
      if(!(status instanceof HTMLElement)||!(label instanceof HTMLElement)||!(decoration instanceof HTMLElement))throw Error('Real component DOM/accessible decoration missing');
      return {kind:panel.getAttribute('data-kind'),overflow:panel.scrollWidth>panel.clientWidth+1||status.scrollWidth>status.clientWidth+1||label.scrollWidth>label.clientWidth+1,
       wrap:getComputedStyle(label).overflowWrap,fontPx:parseFloat(getComputedStyle(label).fontSize),live:status.getAttribute('aria-live'),role:status.getAttribute('role'),
       gridColumns:getComputedStyle(status).gridTemplateColumns,hasText:label.textContent?.includes('NiederkasselUndSeineUntrennbarenKartennamen'),visible:label.getBoundingClientRect().width>0,
       decorationHidden:decoration.getAttribute('aria-hidden')==='true',noFalseData:!status.textContent?.includes('°C')&&!status.textContent?.includes('mm/h')};
     })
    };
   });
   assert.equal(geometry.viewportOverflow,false,'Viewport overflow '+width+'px '+theme+' scale '+scale);
   assert.equal(geometry.panels.length,2,'Both map and chart shared skeletons must be rendered');
   assert.deepEqual(geometry.panels.map(row=>row.kind),['map','chart']);
   for(const item of geometry.panels){
    assert.equal(item.overflow,false,'Clipped long label '+item.kind+' at '+width+'px '+theme+' scale '+scale);
    assert.equal(item.wrap,'anywhere','Missing emergency text wrap');
    assert.equal(item.role,'status');
    assert.equal(item.live,'polite');
    assert.equal(item.hasText,true,'Unbroken status label was truncated');
    assert.equal(item.visible,true,'Status label invisible');
    assert.equal(item.decorationHidden,true,'Decorative skeleton exposed to assistive technologies');
    assert.equal(item.noFalseData,true,'Synthetic weather value leaked into loading state');
    assert.ok(item.fontPx>=16*scale,'Text scale not inherited');
    assert.ok(item.gridColumns.length>0,'Missing shrinkable grid track');
   }
   assert.deepEqual(errors,[],'Runtime errors');
   evidence.cases.push({width,height,theme,scale,renderedKinds:geometry.panels.map(row=>row.kind),overflow:false,labelsComplete:true});
  }finally{await context.close()}
 }
 assert.equal(evidence.cases.length,28,'Incomplete browser matrix');
 evidence.ready=true;
 console.log('MID Design113: 28 contexts / 56 actual-component states passed');
}catch(error){evidence.errors.push(error instanceof Error?error.stack:String(error));throw error}
finally{
 writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
 await browser?.close();
 await server?.close();
}

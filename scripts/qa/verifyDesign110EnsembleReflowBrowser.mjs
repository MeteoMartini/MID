/**
 * MID Design 1.10: actual React component browser QA with synthetic inputs.
 * Manual, fail-closed opt-in: node scripts/qa/verifyDesign110EnsembleReflowBrowser.mjs
 * It does not validate forecast skill, official warnings, native WKWebView or VoiceOver.
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
const evidenceDir=process.env.MID_DESIGN110_QA_DIR||'artifacts/design110-browser-qa';
mkdirSync(evidenceDir,{recursive:true});
const report={schema:'mid.design110.ensemble-reflow.browser.v1',source:'actual MID React EnsembleAssessmentDetails; synthetic layout labels, no weather data',commit:process.env.GITHUB_SHA||null,ready:false,cases:[],errors:[]};
let browser,server;
try{
 server=await createServer({cacheDir:'node_modules/.vite-mid-design110-qa',server:{host:'127.0.0.1',port:0,watch:null,hmr:false}});
 await server.listen();
 const base='http://127.0.0.1:'+server.httpServer.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});
 const widths=[[320,680],[360,740],[390,844],[430,920],[834,1112],[1024,768],[1440,900]];
 for(const [width,height]of widths)for(const theme of ['light','dark'])for(const scale of [1,2]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce',hasTouch:width<=834});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   await page.goto(base+'/tests/visual/design110-ensemble-reflow-qa.html?theme='+theme,{waitUntil:'domcontentloaded'});
   await page.addStyleTag({content:'html{font-size:'+16*scale+'px!important}'});
   await page.locator('.mid-ensemble-assessment dt b').first().waitFor({state:'visible'});
   const layout=await page.evaluate(()=>{
    const root=document.documentElement,body=document.body,panel=document.querySelector('.qa-panel'),detail=document.querySelector('.mid-ensemble-assessment'),label=document.querySelector('.mid-ensemble-assessment dt b'),summary=document.querySelector('.mid-ensemble-assessment summary'),row=document.querySelector('.mid-ensemble-assessment dt');
    if(!panel||!detail||!label||!summary||!row)throw new Error('Actual ensemble detail DOM is missing');
    const rowStyle=getComputedStyle(row),labelStyle=getComputedStyle(label),summaryRect=summary.getBoundingClientRect();
    return{
     overflow:root.scrollWidth>innerWidth+1||body.scrollWidth>innerWidth+1,
     panelOverflow:panel.scrollWidth>panel.clientWidth+1,
     detailOverflow:detail.scrollWidth>detail.clientWidth+1,
     labelOverflow:label.scrollWidth>label.clientWidth+1,
     fontPx:parseFloat(getComputedStyle(detail).fontSize),
     rowWrap:rowStyle.flexWrap,
     labelWrap:labelStyle.overflowWrap,
     targetHeight:summaryRect.height,
     available:detail.textContent?.includes('nicht bewertbar')&&label.textContent?.includes('ExtremLangeTemperaturKonfidenz'),
     textHeight:label.getBoundingClientRect().height
    };
   });
   assert.equal(layout.available,true,'Missing/altered genuine data-quality wording '+width+'px '+theme);
   assert.equal(layout.overflow,false,'Root horizontal overflow '+width+'px '+theme+' scale '+scale);
   assert.equal(layout.panelOverflow,false,'Panel horizontal overflow '+width+'px '+theme+' scale '+scale);
   assert.equal(layout.detailOverflow,false,'Detail horizontal overflow '+width+'px '+theme+' scale '+scale);
   assert.equal(layout.labelOverflow,false,'Label horizontal overflow '+width+'px '+theme+' scale '+scale);
   assert.equal(layout.rowWrap,'wrap','Real parameter row may not wrap');
   assert.equal(layout.labelWrap,'anywhere','Long parameter name must break safely');
   assert.ok(layout.fontPx>=13*scale,'Text must honor root scaling');
   assert.ok(layout.targetHeight>=44,'Methodology summary touch target is too short');
   await page.locator('.mid-ensemble-assessment summary').focus();
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('.mid-ensemble-assessment details').evaluate(element=>element.open),true,'Native keyboard disclosure failed');
   assert.deepEqual(errors,[],'Unexpected React/browser exception');
   report.cases.push({width,height,theme,scale,fontPx:layout.fontPx,touchHeight:layout.targetHeight,overflow:false,keyboardOpen:true});
   console.log('MID Design110 browser PASS '+width+'px '+theme+' text '+scale+'x');
  }finally{await context.close()}
 }
 report.ready=true;
 console.log('MID Design110 browser QA: '+report.cases.length+' actual-component viewport/theme/text cases passed');
}catch(error){report.errors.push(error instanceof Error?error.stack:String(error));throw error}
finally{
 writeFileSync(join(evidenceDir,'evidence.json'),JSON.stringify(report,null,2)+'\n');
 await browser?.close();await server?.close();
}

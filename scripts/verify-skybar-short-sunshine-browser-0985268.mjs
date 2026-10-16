import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
const require=createRequire(import.meta.url),{build}=require('esbuild');
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=require(join(dirname(dirname(cli)),'playwright'));
const result=await build({stdin:{contents:`import {createRoot} from 'react-dom/client';import {detailSkyBarSegments,detailSkyBarHourCells} from './detailSkyBar';import {SkyBarSegmentsSvg,SkyBarHourCellsSvg} from './SkyBarSegments';const samples=[0,900,1800].map(sunshineDuration=>({isDay:true,cloud:10,sunshineDuration,precipitation:0}));createRoot(document.getElementById('root')).render(<svg viewBox="0 0 300 64" width="100%"><SkyBarSegmentsSvg segments={detailSkyBarSegments(samples,0,0,300,16)}/><SkyBarHourCellsSvg cells={detailSkyBarHourCells(samples)} left={0} right={0} chartW={300} centerY={44}/></svg>);`,resolveDir:resolve('src'),loader:'tsx'},bundle:true,platform:'browser',format:'iife',jsx:'automatic',write:false,logLevel:'silent'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const theme of ['light','dark'])for(const [width,height] of [[320,740],[390,844],[844,390],[768,1024],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});await page.setContent(`<body style="margin:0;background:${theme==='dark'?'#0c1828':'white'}"><div id="root"></div>`);await page.addScriptTag({content:result.outputFiles[0].text});await page.waitForSelector('[data-skybar-hour]');
  assert.equal(await page.locator('[data-skybar-level]').count(),1,'All three equal cloud-gap bands form one continuous visible run');
  assert.equal(await page.locator('[data-skybar-hour][data-skybar-state="weather"]').count(),3);
  assert.equal(await page.locator('[data-skybar-level] > rect').first().getAttribute('width'),'300');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`/tmp/mid268-skybar-${width}-${theme}.png`});
 }
 assert.deepEqual(errors,[]);console.log('Skybar shared SVG renderer: 12 phone/tablet/desktop light/dark fixtures passed; no overflow or missing daytime bands.');
}finally{await browser.close()}

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {realpathSync} from 'node:fs';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const pw=require(join(dirname(dirname(cli)),'playwright'));
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'map-loading-qa',configureServer(vite){vite.middlewares.use('/__loading',async(req,res)=>{
 res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__loading','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/unified-map-browser.tsx"></script></body></html>'));
})}}]});
await server.listen();
const browser=await pw.chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,430,1024,1440])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme});
  // Hold the real deferred component to inspect its actual styled Suspense fallback.
  await page.route('**/src/UnifiedWeatherMap.tsx*',()=>new Promise(()=>{}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__loading`,{waitUntil:'domcontentloaded'});
  const status=page.getByRole('status').filter({hasText:'Kartenprodukt wird geladen'});await status.waitFor();
  const box=await status.boundingBox();assert.ok(box.height>=419,`Reserved map height: ${width}/${theme}: ${box.height}`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Loading state must not overflow');
  console.log(`Loading layout ${width}px ${theme}: ${Math.round(box.height)}px, status visible, no overflow`);
  await page.close();
 }
}finally{await browser.close();await server.close()}

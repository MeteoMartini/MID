import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {realpathSync,readFileSync} from 'node:fs';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim()),pw=require(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const imports=[...readFileSync('src/main.tsx','utf8').matchAll(/^import '\.\/(.*\.css)';/gm)].map(m=>`import '/src/${m[1]}';`).join('\n')+"\nimport '/src/v078.css';\nimport '/scripts/fixtures/maintenance-browser.tsx';";
const server=await createServer({server:{host:'127.0.0.1',port:0},plugins:[{name:'maintenance-qa',configureServer(vite){vite.middlewares.use('/__maintenance-qa',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__maintenance-qa',`<!doctype html><html data-mid-design="next"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">${imports}</script></body></html>`))})}}]});await server.listen();
const browser=await pw.chromium.launch({headless:true,args:['--no-sandbox']}),url=`http://127.0.0.1:${server.httpServer.address().port}/__maintenance-qa`;let count=0;
try{for(const[width,height]of[[320,568],[390,844],[412,915],[844,390],[834,1194],[1024,768],[1440,900]])for(const theme of['light','dark']){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme}),page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(url);await page.locator('.favorite-bubbles>button').first().waitFor();await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark')},theme);
 assert.ok(!requests.some(u=>/\/src\/(?:AppleWidgetSettings|DashboardModuleSettings)\.tsx/.test(u)),'Optional settings must not load on startup');
 if(width<=850){for(const selector of['.compact-actions>button','.secondary.locate','.favorite-bubbles>button','.favorite-strip-manage']){const rects=await page.locator(selector).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{w:r.width,h:r.height}}));assert.ok(rects.every(r=>r.w>=43.9&&r.h>=43.9),`${width}/${theme}: ${selector} ${JSON.stringify(rects)}`)}}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Header has no page overflow');
 await page.getByTitle('Einstellungen',{exact:true}).click();await page.locator('.apple-widget-settings').waitFor();await page.locator('.dashboard-module-settings').waitFor();assert.ok(requests.some(u=>u.includes('/src/AppleWidgetSettings.tsx'))&&requests.some(u=>u.includes('/src/DashboardModuleSettings.tsx')),'Settings load on demand');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Settings have no page overflow');assert.deepEqual(errors,[]);if(width===390&&theme==='light')await page.screenshot({path:'/tmp/mid-maintenance-390.png',fullPage:true});count++;await context.close();
}console.log(`${count} maintenance browser cases passed: touch dimensions, header/settings overflow, lazy loading and actual settings rendering.`)}finally{await browser.close();await server.close()}

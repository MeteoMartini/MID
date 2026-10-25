import assert from 'node:assert/strict';
import {readFileSync,realpathSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {startCssRuleUsageTracking,collectCssRuleUsage} from './lib/cssRuleUsageDiagnostic.mjs';
import {browserPrelude} from './lib/mountainBrowserFixture.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=require(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const epoch=Date.UTC(2026,9,5,12),location={id:'soelden-module-fixture',name:'Sölden',latitude:46.9699,longitude:11.0076,elevation:1368,country:'Österreich',country_code:'AT',timezone:'Europe/Vienna'};
const mountain={schemaVersion:2,enabled:true,season:'winter',middleEnabled:true,valleyElevation:1368,middleElevation:2500,summitElevation:3250,valleyName:'Talstation Gaislachkoglbahn · Sölden',middleName:'Mittelstation Gaislachkogl · Sölden',summitName:'Bergstation Rettenbachferner · Sölden',valleyLatitude:46.9699,valleyLongitude:11.0076,middleLatitude:46.955,middleLongitude:10.984,summitLatitude:46.928,summitLongitude:10.94,profileSource:'manual',profileConfidence:'high',profileUpdatedAt:'2026-09-25T12:00:00Z'};
const favorite={id:'module-fixture',location,alias:'Sölden',group:'QA',isDefault:true,rules:{enabled:false},mountain,water:{enabled:false}};
const dates=Array.from({length:168},(_,i)=>new Date(epoch-12*3600000+i*3600000).toISOString().slice(0,16));
const hours=dates.map((time,i)=>({time,epoch:Date.parse(time+'Z'),temperature:15+5*Math.sin(i%24/24*2*Math.PI),apparent:14,dewPoint:8,humidity:70,isDay:i%24>=7&&i%24<19,code:1,cloud:i%24>=7&&i%24<19?20:85,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:2700,gust:5,wind:3,direction:280}));
const days=Array.from({length:7},(_,i)=>({date:dates[i*24].slice(0,10),min:10,max:20,code:1,cloud:20,precipitation:0,probability:0,sunshineDuration:8*3600,sunrise:dates[i*24].slice(0,10)+'T07:00',sunset:dates[i*24].slice(0,10)+'T19:00'}));
const ensemble=days.map(day=>({...day,temperatureHours:hours.filter(h=>h.time.startsWith(day.date)).map(h=>({time:h.time,epoch:h.epoch,p25:h.temperature-2,p50:h.temperature,p75:h.temperature+2,memberCount:12,modelFamilyCount:2}))}));
async function fixtureServer(project){
 const main=readFileSync(join(project,'src/main.tsx'),'utf8'),css=[];
 for(const match of main.matchAll(/^import '\.\/(.*)';/gm))if(match[1]==='v078'&&!main.includes('midPresentation.css'))css.push("import '/src/v078.css';");else if(match[1].endsWith('.css'))css.push(`import '/src/${match[1]}';`);
 const entry=join(project,'src/__module_entry_qa.tsx'),fixture=join(project,'src/__module_fixture_qa.tsx');
 const fixtureSource=`import React from 'react';import{createRoot}from'react-dom/client';import{Widget,MountainSki}from'virtual:module-entry';${css.join('\n')}
 const loc=${JSON.stringify(location)},config=${JSON.stringify(mountain)},days=${JSON.stringify(days)},hours=${JSON.stringify(hours)},ensemble=${JSON.stringify(ensemble)};
 function QA(){const[mode,setMode]=React.useState('none');return <div className="app navigation-bottom-tabs"><main><nav><button onClick={()=>setMode('widget')}>Widget laden</button><button onClick={()=>setMode('mountain')}>Bergwetter laden</button></nav><div id="qa-feature">{mode==='widget'?<Widget loc={loc} days={days} hours={hours} minutes15={[]} ensemble={ensemble} unit="kn" timezone="UTC" ensemblePanel={null} onEnsembleRequested={()=>{window.qaEnsembleRequested=true}}/>:mode==='mountain'?<MountainSki loc={loc} days={days} ensembleDays={[]} alerts={[]} automaticHazards={[]} officialLoading={false} officialError="" officialProvider="Testadapter" unit="kn" config={config} onConfigChange={change=>{Object.assign(config,change);setMode('none');queueMicrotask(()=>setMode('mountain'))}}/>:null}</div></main></div>}createRoot(document.getElementById('root')).render(<QA/>);`;
 const server=await createServer({root:project,server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'module-qa',resolveId(id){if(id==='virtual:module-entry'||id.endsWith('__module_entry_qa.tsx'))return entry;if(id==='virtual:module-fixture'||id.endsWith('__module_fixture_qa.tsx'))return fixture;},load(id){if(id===entry)return readFileSync(join(project,'src/App.tsx'),'utf8')+'\nexport {Widget,MountainSki};';if(id===fixture)return fixtureSource;},configureServer(vite){vite.middlewares.use('/__module-qa',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__module-qa','<!doctype html><html data-mid-design="next"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import "virtual:module-fixture";</script></body></html>'));});}}]});
 await server.listen();return {server,url:`http://127.0.0.1:${server.httpServer.address().port}/__module-qa`};
}
const active=await fixtureServer(root),baseline=process.env.MID_PARITY_BASE?await fixtureServer(resolve(process.env.MID_PARITY_BASE)):null;
const browser=await chromium.launch({executablePath:process.env.MID_BROWSER_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let cases=0,parity=0;const cssCoverage=[];
async function openPage(target,width,height,theme){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme}),page=await context.newPage(),requests=[],errors=[];
 const cssSession=target===active?await startCssRuleUsageTracking(context,page):null;
 await page.addInitScript(({epoch,prelude,theme})=>{const OriginalDate=Date;class FixtureDate extends OriginalDate{constructor(...args){super(...(args.length?args:[epoch]));}static now(){return epoch+Math.floor(performance.now());}}window.Date=FixtureDate;(0,eval)(prelude);localStorage.setItem('theme',theme);localStorage.setItem('mid:0.7.1:widget-settings',JSON.stringify({schema:5,days:7,view:'cards',dark:theme==='dark',ecmwfTemperatureColors:false}));const applyTheme=()=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');};if(document.documentElement)applyTheme();else document.addEventListener('DOMContentLoaded',applyTheme,{once:true});},{epoch,prelude:browserPrelude(favorite,location,mountain,''),theme});
 page.on('request',request=>requests.push(request.url()));page.on('pageerror',error=>errors.push(error.message));await page.goto(target.url);await page.getByRole('button',{name:'Widget laden',exact:true}).waitFor();return {context,page,requests,errors,cssSession};
}
async function measureCssCoverage(item,width,height,theme){
 return collectCssRuleUsage(item.cssSession,{viewport:[width,height],theme,scope:'Vite development fixture; widget/cards/curve/ensemble and mountain only',views:['widget/cards','widget/curve','widget/ensemble','mountain']});
}
async function snapshot(page){
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
 return page.locator('#qa-feature').evaluate(root=>[...root.querySelectorAll('*')].map(node=>{const style=getComputedStyle(node),rect=node.getBoundingClientRect(),origin=root.getBoundingClientRect();return {tag:node.tagName,classes:node.getAttribute('class'),text:node.children.length?'':node.textContent.trim(),box:[rect.x-origin.x,rect.y-origin.y,rect.width,rect.height].map(x=>Math.round(x*100)/100),style:['display','position','color','backgroundColor','fontSize','fontWeight','lineHeight','whiteSpace','overflowX','overflowY','minWidth','minHeight','padding','margin','borderRadius','gridTemplateColumns','gap','fill','stroke','stopColor','stopOpacity'].map(key=>style[key])};}));
}
try{
 for(const [width,height]of [[320,568],[390,844],[412,915],[844,390],[834,1194],[1024,768],[1440,900]])for(const theme of ['light','dark']){
  const current=await openPage(active,width,height,theme),reference=baseline?await openPage(baseline,width,height,theme):null;
  assert.ok(!current.requests.some(url=>/\/src\/(WidgetGenerator|MountainWeather)\.tsx/.test(url)),'Closed optional panels must not request their modules');
  for(const item of [current,reference].filter(Boolean)){await item.page.getByRole('button',{name:'Widget laden',exact:true}).click();await item.page.locator('.weatherwidget').waitFor();}
  assert.ok(current.requests.some(url=>url.includes('/src/WidgetGenerator.tsx')),'Widget module must load when opened');
  for(const view of ['cards','curve','ensemble']){
   for(const item of [current,reference].filter(Boolean)){await item.page.getByLabel('Widget-Darstellung',{exact:true}).selectOption(view);if(view==='curve')await item.page.locator('.seven-day-temperature-quantiles').waitFor();}
   if(view==='curve'&&!reference){
    const page=current.page,strip=()=>page.locator('.seven-day-curve-skybar');
    await page.getByRole('checkbox',{name:'Skybar',exact:true}).check();
    const fullBand=await strip().innerHTML();
    for(const rain of [false,true])for(const sun of [false,true])for(const sky of [false,true]){
     await page.getByRole('checkbox',{name:'Niederschlag',exact:true}).setChecked(rain);
     await page.getByRole('checkbox',{name:'Sonnenstunden',exact:true}).setChecked(sun);
     await page.getByRole('checkbox',{name:'Skybar',exact:true}).setChecked(sky);
     assert.equal(await page.locator('.seven-day-curve-rain-row').count(),rain?1:0);
     assert.equal(await page.locator('.seven-day-curve-sun-row').count(),sun?1:0);
     assert.equal(await strip().count(),sky?1:0);
     if(sky)assert.equal(await strip().innerHTML(),fullBand,'Whole Skybar stays independent of numerical rows');
     assert.equal(await page.locator('.seven-day-curve-meta-row>span').evaluateAll(nodes=>nodes.some(n=>n.scrollWidth>n.clientWidth+1)),false,'Compact daily labels fit their own day columns');
     const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:0.7.1:widget-settings')));
     assert.equal(stored.showSkybar,sky);assert.equal(stored.showRain,rain);assert.equal(stored.showSunshine,sun);
    }
    const boxes=await page.locator('.seven-day-curve-rain-row,.seven-day-curve-wind-row,.seven-day-curve-sun-row,.seven-day-curve-chart').evaluateAll(nodes=>nodes.map(n=>({class:n.className,y:n.getBoundingClientRect().y})));
    assert.equal(boxes.length,4);for(let i=1;i<boxes.length;i++)assert.ok(boxes[i].y>boxes[i-1].y,'Precipitation, wind, sunshine, then chart');
    if(process.env.MID_WIDGET_QA_SCREENSHOTS)await page.locator('.weatherwidget').screenshot({path:process.env.MID_WIDGET_QA_SCREENSHOTS+`/widget262-${width}-${theme}.png`});
   }
   assert.equal(await current.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${theme}/${view}: page overflow`);
   if(reference){assert.deepEqual(await snapshot(current.page),await snapshot(reference.page),`${width}/${theme}/${view}: visual/layout divergence from .169`);parity++;}cases++;
  }
  assert.equal(await current.page.evaluate(()=>window.qaEnsembleRequested),true,'Curve/ensemble must request canonical ensemble support');
  for(const item of [current,reference].filter(Boolean)){await item.page.getByRole('button',{name:'Bergwetter laden',exact:true}).click();try{await item.page.locator('.mountain-current-source').waitFor();await item.page.locator('.mountain-seven-day-row').first().waitFor();}catch(error){console.error(JSON.stringify({width,theme,baseline:item===reference,errors:item.errors,requests:item.requests.slice(-12),body:await item.page.locator('body').innerText()}));throw error;}}
  assert.ok(current.requests.some(url=>url.includes('/src/MountainWeather.tsx')),'Mountain module must load when opened');
  assert.equal(await current.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${theme}/mountain: page overflow`);
  if(reference){assert.deepEqual(await snapshot(current.page),await snapshot(reference.page),`${width}/${theme}/mountain: visual/layout divergence from .169`);parity++;}cases++;
  assert.deepEqual(current.errors,[],'Optional module caused a runtime error');if(reference)assert.deepEqual(reference.errors,[]);
  cssCoverage.push(await measureCssCoverage(current,width,height,theme));
  await current.context.close();if(reference)await reference.context.close();
  console.log(`${width}×${height} ${theme}: module loading and four feature views passed${reference?' with .169 parity':''}.`);
 }
 const report={schema:'mid.css-coverage-diagnostic.v1',sourceSha:process.env.GITHUB_SHA||null,scope:'Vite development fixture only, not whole app or production CSS',cases:cssCoverage};
 mkdirSync(join(root,'artifacts'),{recursive:true});
 writeFileSync(join(root,'artifacts','css-module-coverage.json'),JSON.stringify(report,null,2)+'\n');
 const raw=cssCoverage.reduce((n,item)=>n+item.sheets.reduce((sum,css)=>sum+css.rawBytes,0),0);
 const used=cssCoverage.reduce((n,item)=>n+item.sheets.reduce((sum,css)=>sum+css.usedBytes,0),0);
 console.log('MID_CSS_COVERAGE_DIAGNOSTIC='+JSON.stringify({cases:cssCoverage.length,rawStyleBytesAcrossIndependentCases:raw,usedRuleBytesAcrossIndependentCases:used,hasCoverage:raw>0,artifact:'artifacts/css-module-coverage.json',scope:report.scope}));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### MID CSS coverage — diagnostics only\n\n'+cssCoverage.length+' separate Chromium viewport/theme contexts; rule bytes across cases: '+used+'/'+raw+'. **Not production CSS or whole-app coverage.**\n');
 console.log(`Module/CSS browser QA: ${cases} viewport/theme/view cases; on-demand network edges, shared uncertainty and no overflow/errors; ${parity} exact .169 layout/paint snapshots.`);
}finally{await browser.close();await active.server.close();if(baseline)await baseline.server.close();}

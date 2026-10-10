import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {browserPrelude} from './lib/mountainBrowserFixture.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=require(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const epoch=Date.UTC(2026,9,7,12),location={id:'soelden-module-fixture',name:'Sölden',latitude:46.9699,longitude:11.0076,elevation:1368,country:'Österreich',country_code:'AT',timezone:'Europe/Vienna'};
const mountain={schemaVersion:2,enabled:true,season:'winter',middleEnabled:true,valleyElevation:1368,middleElevation:2500,summitElevation:3250,valleyName:'Talstation Gaislachkoglbahn · Sölden',middleName:'Mittelstation Gaislachkogl · Sölden',summitName:'Bergstation Rettenbachferner · Sölden',valleyLatitude:46.9699,valleyLongitude:11.0076,middleLatitude:46.955,middleLongitude:10.984,summitLatitude:46.928,summitLongitude:10.94,profileSource:'manual',profileConfidence:'high',profileUpdatedAt:'2026-09-25T12:00:00Z'};
const favorite={id:'module-fixture',location,alias:'Sölden',group:'QA',isDefault:true,rules:{enabled:false},mountain,water:{enabled:false}};
const dates=Array.from({length:168},(_,i)=>new Date(epoch-12*3600000+i*3600000).toISOString().slice(0,16));
const hours=dates.map((time,i)=>({time,epoch:Date.parse(time+'Z'),temperature:15+5*Math.sin(i%24/24*2*Math.PI),apparent:14,dewPoint:8,humidity:70,isDay:i%24>=7&&i%24<19,code:1,cloud:i%24>=7&&i%24<19?20:85,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:2700,gust:5,wind:3,direction:280}));
const days=Array.from({length:7},(_,i)=>({date:dates[i*24].slice(0,10),min:10,max:20,code:1,cloud:20,precipitation:0,probability:0,sunshineDuration:8*3600,sunrise:dates[i*24].slice(0,10)+'T07:00',sunset:dates[i*24].slice(0,10)+'T19:00'}));
const ensemble=days.map(day=>({...day,temperatureHours:hours.filter(h=>h.time.startsWith(day.date)).map(h=>({time:h.time,epoch:h.epoch,p25:h.temperature-2,p50:h.temperature,p75:h.temperature+2,memberCount:12,modelFamilyCount:2}))}));

const css="import '/src/midPresentation.css';";
const entry=join(root,'src/__c21_entry_qa.tsx'),fixture=join(root,'src/__c21_fixture_qa.tsx');
const weather={latitude:location.latitude,longitude:location.longitude,elevation:location.elevation,timezone:'UTC',current:{time:'2026-10-07T12:00',temperature_2m:16,relative_humidity_2m:84,dew_point_2m:13,apparent_temperature:16,precipitation:0,rain:0,showers:0,snowfall:0,weather_code:3,cloud_cover:100,is_day:1,wind_speed_10m:4,wind_gusts_10m:8,wind_direction_10m:45,pressure_msl:1006,visibility:15000}};
const fixtureSource=`import React from 'react';import{createRoot}from'react-dom/client';import{Current}from'virtual:c21-entry';${css}createRoot(document.getElementById('root')).render(<div className="app navigation-bottom-tabs"><main><Current w={${JSON.stringify(weather)}} hours={${JSON.stringify(hours)}} minutes15={[]} anchor={{active:false}} days={${JSON.stringify(days)}} air={null} airStation={null} st={null} stationLoading={false} radarHistory={null} radarNowcast={null} thunderRisk={null} unit="kn" advancedMode={false} nowcards={null}/></main></div>);`;
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'c21-qa',resolveId(id){if(id==='virtual:c21-entry')return entry;if(id==='virtual:c21-fixture')return fixture;},load(id){if(id===entry)return readFileSync(join(root,'src/App.tsx'),'utf8')+'\nexport {Current};';if(id===fixture)return fixtureSource;},configureServer(vite){vite.middlewares.use('/__c21-qa',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__c21-qa','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import "virtual:c21-fixture";</script></body></html>'));});}}]});
await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let cases=0;
try{
for(const [width,height] of [[320,568],[390,844],[412,915],[844,390],[834,1194],[1024,768],[1440,900]])for(const design of ['next','classic'])for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width,height},colorScheme:theme}),page=await context.newPage(),errors=[];
 await page.addInitScript(({epoch,design,theme})=>{const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[epoch]));}static now(){return epoch;}};localStorage.clear();document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.midDesign=design;document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');});},{epoch,design,theme});
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)||['data:','blob:'].includes(url.protocol)?route.continue():route.abort();});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__c21-qa`,{waitUntil:'domcontentloaded',timeout:60000});await page.locator('.current-weather-thread').waitFor();await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width}};return {sky:box('.current-weather-thread-sky'),curve:box('.current-weather-thread>.mid-weather-thread'),axis:box('.current-weather-thread-axis'),overflow:document.documentElement.scrollWidth>innerWidth+1,facts:[...document.querySelectorAll('.current-weather-facts>span')].filter(n=>getComputedStyle(n).display!=='none').map(n=>({text:n.innerText,overflow:n.scrollWidth>n.clientWidth+1}))};});
 assert.ok(result.sky.bottom<=result.curve.top+1,`${width}/${design}/${theme}: sky must be above curve ${JSON.stringify(result)}`);
 assert.ok(Math.abs(result.sky.left-result.curve.left)<=1&&Math.abs(result.sky.width-result.curve.width)<=1,`${width}/${design}/${theme}: sky and curve must share plot width`);
 assert.ok(result.curve.bottom<=result.axis.top+1,`${width}/${design}/${theme}: axis must be below curve`);
 assert.equal(result.overflow,false,`${width}/${design}/${theme}: page overflow`);
 if(result.facts.some(f=>f.overflow)){await page.screenshot({path:join(root,'..','c21-overflow.png'),fullPage:true});console.log(JSON.stringify(result));}assert.ok(result.facts.every(f=>!f.overflow),`${width}/${design}/${theme}: parameter overflow`);
 assert.equal(result.facts.length,4);const labels=await page.locator('.current-weather-facts>span small').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width>0).map(n=>({size:parseFloat(getComputedStyle(n).fontSize),before:getComputedStyle(n,'::before').content,after:getComputedStyle(n,'::after').content})));assert.ok(labels.every(n=>n.size>=12&&['none','normal','\"\"'].includes(n.before)&&['none','normal','\"\"'].includes(n.after)),`${width}/${design}/${theme}: legible labels without duplicate generated text`);
 await page.getByRole('button',{name:'Mehr aktuelle Wetterdaten anzeigen'}).click();await page.locator('#current-weather-metrics').waitFor({state:'visible'});assert.ok(await page.locator('#current-weather-metrics').innerText().then(t=>t.includes('Sichtweite')));
 assert.deepEqual(errors,[]);
 if(width===390||width===1440)await page.screenshot({path:join(root,'..',`c21-${width}-${design}-${theme}.png`),fullPage:true});
 await context.close();cases++;console.log(`${width}×${height}/${design}/${theme}: passed`);
}
console.log(`C21 browser QA: ${cases} responsive design/theme cases passed.`);
}finally{await browser.close();await server.close();}

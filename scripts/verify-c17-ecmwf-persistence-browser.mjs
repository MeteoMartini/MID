import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid-c17-ecmwf-browser-')),read=path=>readFileSync(join(root,path));
const appSource=read('src/App.tsx').toString();
const persistEffect=appSource.match(/useEffect\(\(\)=>\{try\{localStorage\.setItem\(FORECAST_DISPLAY_SETTINGS_KEY,JSON\.stringify\(forecastDisplaySettings\)\)\}catch\{\}\},\[forecastDisplaySettings\]\);/)?.[0];
assert.ok(persistEffect,'App keeps the existing persistence fallback');
assert.ok(appSource.includes('commitForecastDisplaySettings(update,forecastDisplaySettingsRef)'),'SettingsManager routes changes through synchronous persistence');

const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim();
const base=dirname(dirname(realpathSync(cli)));
const {chromium}=await import(pathToFileURL(join(base,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
if(!process.env.MID_BROWSER_EXECUTABLE)execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});

const now=Date.UTC(2026,9,4);
const baseHour={temperature:20,apparent:22,humidity:50,dewPoint:11,pressure:1015,wind:3,gust:7,direction:45,cloud:60,lowCloud:20,midCloud:20,highCloud:20,visibility:30000,precipitation:0,rain:0,showers:0,snowfall:0,probability:20,code:2,isDay:true,sunshineDuration:3600};
const hours=Array.from({length:169},(_,index)=>({...baseHour,temperature:-10+(index%24)*45/23,epoch:now+index*3600000,time:new Date(now+index*3600000).toISOString()}));
const days=Array.from({length:7},(_,index)=>{const date=new Date(now+index*86400000).toISOString().slice(0,10);return{date,min:-10,max:35,code:2,cloud:60,precipitation:0,probability:20,gust:7,wind:3,direction:45,sunshineDuration:3600,sunrise:`${date}T07:00`,sunset:`${date}T19:00`}});

const qa=`import React from 'react';
import{createRoot}from'react-dom/client';
import{SevenDayCurveOverview}from'./src/ForecastCockpit';
import{storedForecastDisplaySettings}from'./src/App';
import{commitForecastDisplaySettings,FORECAST_DISPLAY_SETTINGS_KEY}from'./src/forecastDisplaySettings';
const useEffect=React.useEffect;
Date.now=()=>${now};
function QA(){
 const[forecastDisplaySettings,setForecastDisplaySettings]=React.useState(storedForecastDisplaySettings);
 const settingsRef=React.useRef(forecastDisplaySettings);settingsRef.current=forecastDisplaySettings;
 const[view,setView]=React.useState('7d');
 const update=action=>setForecastDisplaySettings(commitForecastDisplaySettings(action,settingsRef));
 window.qaSetEcmwf=value=>update(current=>({...current,ecmwfTemperatureColors:value}));
 window.qaChangeView=value=>setView(value);
 window.qaReadStored=storedForecastDisplaySettings;
 ${persistEffect}
 return <main>
  <label>ECMWF-Temperaturfarben<input aria-label="ECMWF-Temperaturfarben" type="checkbox" checked={forecastDisplaySettings.ecmwfTemperatureColors} onChange={event=>window.qaSetEcmwf(event.target.checked)}/></label>
  <output data-testid="setting" data-value={String(forecastDisplaySettings.ecmwfTemperatureColors)}>{String(forecastDisplaySettings.ecmwfTemperatureColors)}</output>
  <nav>{['7d','14d','46d','season'].map(value=><button key={value} onClick={()=>setView(value)}>{value}</button>)}</nav>
  {view==='7d'?<section data-horizon="7d"><SevenDayCurveOverview ecmwfTemperatureColors={forecastDisplaySettings.ecmwfTemperatureColors} days={${JSON.stringify(days)}} hours={${JSON.stringify(hours)}} selectedDate="2026-10-04" onSelectedDate={()=>{}}/></section>:<section data-horizon={view}>{view}</section>}
 </main>
}
createRoot(document.getElementById('root')).render(<QA/>);`;

await build({
 stdin:{contents:qa,resolveDir:root,loader:'tsx'},
 plugins:[{name:'qa-export',setup(build){build.onLoad({filter:/App\.tsx$/},()=>({contents:read('src/App.tsx').toString()+'\nexport{storedForecastDisplaySettings};',loader:'tsx',resolveDir:join(root,'src')}))}}],
 define:{'import.meta.env':'{}'},bundle:true,jsx:'automatic',format:'esm',outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent'
});

const sheets=[...read('src/main.tsx').toString().matchAll(/import '\.\/([^']+\.css)'/g)].map(match=>match[1]);
const html=`<!doctype html><html data-mid-design="next" data-theme="light"><meta name="viewport" content="width=device-width,initial-scale=1">${sheets.map(sheet=>`<link rel="stylesheet" href="/src/${sheet}">`).join('')}<style>body{margin:0;padding:12px}main{max-width:1200px;margin:auto}nav{display:flex;gap:8px;margin:12px 0}</style><div id="root"></div><script type="module" src="/qa.js"></script>`;
const server=createServer((request,response)=>{
 const url=new URL(request.url||'/',`http://${request.headers.host||'127.0.0.1'}`);
 if(url.pathname==='/'){response.end(html);return}
 if(url.pathname==='/blank'){response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><p>Closed view</p>');return}
 if(url.pathname==='/qa.js'){response.setHeader('Content-Type','application/javascript');response.end(readFileSync(join(out,'qa.js')));return}
 const sheet=sheets.find(path=>url.pathname===`/src/${path}`);
 if(sheet){response.setHeader('Content-Type','text/css');response.end(read(`src/${sheet}`));return}
 response.statusCode=404;response.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const seed=JSON.stringify({ecmwfTemperatureColors:true,showSevenDaySummary:false});
const devices=[
 {name:'iPhone',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3},
 {name:'Android',viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.625},
 {name:'Tablet',viewport:{width:820,height:1180},isMobile:true,hasTouch:true,deviceScaleFactor:2},
 {name:'Desktop',viewport:{width:1440,height:960},isMobile:false,hasTouch:false,deviceScaleFactor:1}
];
let checks=0;
const launchOptions=device=>({headless:true,args:['--no-sandbox'],viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,deviceScaleFactor:device.deviceScaleFactor,...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});
async function openProfile(profile,device,theme){
 const context=await chromium.launchPersistentContext(profile,{...launchOptions(device),colorScheme:theme});
 await context.addInitScript(({key,initial,themeName})=>{const applyTheme=()=>{if(document.documentElement)document.documentElement.dataset.theme=themeName};if(document.documentElement)applyTheme();else document.addEventListener('DOMContentLoaded',applyTheme,{once:true});if(localStorage.getItem(key)===null)localStorage.setItem(key,initial)}, {key:'mid:forecastDisplaySettings',initial:seed,themeName:theme});
 const page=context.pages()[0]||await context.newPage();
 page.on('pageerror',error=>{throw error});
 await page.goto(origin);
 await page.waitForSelector('[data-testid="setting"]');
 return{context,page};
}
async function expectValue(page,value,label){
 await page.waitForFunction(expected=>document.querySelector('[data-testid="setting"]')?.getAttribute('data-value')===String(expected),value);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:forecastDisplaySettings')).ecmwfTemperatureColors),value,label);
}
async function immediateChange(page,value,label){
 const observed=await page.evaluate(next=>{
  window.qaSetEcmwf(next);
  document.dispatchEvent(new Event('visibilitychange'));
  const raw=localStorage.getItem('mid:forecastDisplaySettings');
  return{raw,visibility:document.visibilityState};
 },value);
 assert.equal(JSON.parse(observed.raw).ecmwfTemperatureColors,value,`${label}: synchronous write before React's passive effect`);
 assert.ok(observed.visibility==='visible'||observed.visibility==='hidden',`${label}: visibility state observed`);
 await page.goto(`${origin}/blank`);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:forecastDisplaySettings')).ecmwfTemperatureColors),value,`${label}: survives immediate navigation away`);
 await page.goto(origin);
 await expectValue(page,value,`${label}: restored after reopening the view`);
}
async function exerciseViews(page,value,label){
 for(const view of['14d','46d','season','7d']){
  await page.evaluate(next=>window.qaChangeView(next),view);
  await page.waitForSelector(`[data-horizon="${view}"]`);
  await expectValue(page,value,`${label}: ${view} view retains the preference`);
 }
}

try{
 for(const device of devices)for(const theme of['light','dark']){
  const profile=mkdtempSync(join(tmpdir(),`mid-c17-${device.name.toLowerCase()}-${theme}-`));
  try{
   let{context,page}=await openProfile(profile,device,theme);
   assert.equal(await page.locator('input[aria-label="ECMWF-Temperaturfarben"]').isChecked(),true,`${device.name}/${theme}: sparse legacy saved true loads`);
   const missingLegacy=await page.evaluate(()=>{
    const raw=localStorage.getItem('mid:forecastDisplaySettings');
    localStorage.setItem('mid:forecastDisplaySettings',JSON.stringify({showSevenDaySummary:false}));
    const parsed=window.qaReadStored();
    localStorage.setItem('mid:forecastDisplaySettings',raw);
    return parsed;
   });
   assert.equal(missingLegacy.ecmwfTemperatureColors,false,`${device.name}/${theme}: legacy state missing the flag retains the safe false default`);

   await immediateChange(page,false,`${device.name}/${theme} false`);
   await exerciseViews(page,false,`${device.name}/${theme} false`);
   await page.reload();await expectValue(page,false,`${device.name}/${theme}: false survives reload`);
   await context.close();

   ({context,page}=await openProfile(profile,device,theme));
   await expectValue(page,false,`${device.name}/${theme}: false survives full browser restart`);
   await immediateChange(page,true,`${device.name}/${theme} true`);
   await exerciseViews(page,true,`${device.name}/${theme} true`);
   await page.reload();await expectValue(page,true,`${device.name}/${theme}: true survives reload`);
   await context.close();

   ({context,page}=await openProfile(profile,device,theme));
   await expectValue(page,true,`${device.name}/${theme}: true survives full browser restart`);
   await context.close();
   checks+=1;
   console.log(`PASS ${device.name}/${theme}: legacy state, immediate background/close write, both values, view changes, reload, and full restart`);
  }finally{rmSync(profile,{recursive:true,force:true})}
 }
 console.log(`C17 ECMWF browser persistence passed: ${checks} device/theme combinations.`);
}finally{
 await new Promise(resolve=>server.close(resolve));
 rmSync(out,{recursive:true,force:true});
}

import assert from 'node:assert/strict';
import {readFile,realpath} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {createServer} from 'vite';
import {transform} from 'esbuild';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const strip=app.slice(app.indexOf('function FavoriteQuickStrip('),app.indexOf('function HeightInput('));
const reveal=app.slice(app.indexOf('function revealWithinScrollContainer('),app.indexOf('let favoriteIdFallbackCounter='));
const persist=app.split('\n').find(line=>line.startsWith('function persistSelectedLocation('));
const fixture=`import React,{useRef,useLayoutEffect,useState} from 'react';import {createRoot} from 'react-dom/client';import {Star,LocateFixed,MountainSnow,Waves,Settings2} from 'lucide-react';import '/src/styles.css';import '/src/midPresentation.css';
const LOCATION_STORAGE_KEY='mid:lastLocation',LOCATION_UPDATED_AT_KEY='mid:lastLocation:updated-at';
const writeDurableStorageValue=()=>{throw new DOMException('Injected blocked storage','SecurityError')};
const favoriteLabel=item=>item.alias||item.location.name,matchingStoredFavorite=(favorites,current)=>favorites.find(item=>item.location.id===current?.id),locationsNearlyEquivalent=(a,b)=>a.id===b.id;
${persist}\n${reveal}\n${strip}
const favorites=['Rheidt','Münster','Hochsölden','Kürecik','Mont Blanc'].map((name,id)=>({id:String(id),alias:name,group:'Test',location:{id,name,latitude:50+id,longitude:7},mountain:{enabled:false},water:{enabled:false}}));
document.documentElement.dataset.midDesign=new URLSearchParams(location.search).get('design')||'next';document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
function Fixture(){const [current,setCurrent]=useState(favorites[0].location),[count,setCount]=useState(0),[section,setSection]=useState('Aktuell');const choose=location=>{persistSelectedLocation(location);setCurrent(location);setCount(value=>value+1)};return <main className="app mode-standard density-compact with-section-navigation navigation-bottom-tabs" data-ui-density="compact" data-navigation-mode="bottom-tabs"><header className="top settings-header"><h1>MID</h1><FavoriteQuickStrip favorites={favorites} current={current} trackedLocation={null} trackedSelectionActive={false} onSelect={choose} onManage={()=>setSection('Favoriten')} locationTracking={false} onLocate={()=>{}}/></header><output id="selection" data-count={count} data-id={current.id}>{current.name}</output><section><h2>{section}</h2>{['Aktuell','Heute','Vorhersage','Karten','Mehr'].map(name=><button key={name} onClick={()=>setSection(name)}>{name}</button>)}</section></main>};createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);`;
const require=createRequire(import.meta.url),cli=await realpath(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim()),pw=require(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const compiledFixture=(await transform(fixture,{loader:'tsx',jsx:'automatic',format:'esm',target:'es2022'})).code;
const server=await createServer({server:{host:'127.0.0.1',port:0},plugins:[{name:'favorite-selection-fixture',resolveId(id){if(id==='/__favorite-qa.tsx')return '\0favorite-qa.tsx';},load(id){if(id==='\0favorite-qa.tsx')return compiledFixture;},configureServer(vite){vite.middlewares.use('/__favorite-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await vite.transformIndexHtml('/__favorite-test','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/__favorite-qa.tsx"></script></body></html>'));});}}]});
await server.listen();const browser=await pw.chromium.launch({headless:true,args:['--no-sandbox']}),base=`http://127.0.0.1:${server.httpServer.address().port}`;
let cases=0;
try{
 for(const width of [320,390,412,844,1024,1440])for(const theme of ['light','dark'])for(const design of ['next','classic']){
  const context=await browser.newContext({viewport:{width,height:920},hasTouch:true,colorScheme:theme}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/__favorite-test?design=${design}`);await page.locator('#selection').waitFor();
  let expected=0;
  for(let round=0;round<3;round++)for(const id of ['1','2','0']){
   await page.getByRole('button',{name:['Heute','Karten','Mehr'][round],exact:true}).click();
   const button=page.locator(`[data-quick-favorite-id="${id}"]`);await button.scrollIntoViewIfNeeded();await button.tap();expected++;
   await page.waitForFunction(({id,expected})=>document.querySelector('#selection').dataset.id===id&&Number(document.querySelector('#selection').dataset.count)===expected,{id,expected});
   assert.equal(await button.getAttribute('aria-current'),'location');
  }
  const button=page.locator('[data-quick-favorite-id="1"]');await button.focus();await page.keyboard.press('Enter');expected++;await page.waitForFunction(expected=>Number(document.querySelector('#selection').dataset.count)===expected,expected);
  await page.locator('[data-quick-favorite-id="0"]').click();expected++;assert.equal(await page.locator('#selection').getAttribute('data-count'),String(expected));
  assert.deepEqual(errors,[],'Blocked storage and repeated taps never crash the selection');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)console.error('Overflow geometry',await page.evaluate(()=>Array.from(document.querySelectorAll('main,header,nav,.favorite-bubbles,section,h1,output')).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,scroll:e.scrollWidth}))));
  assert.equal(overflow,false,'Favorite strip does not overflow the page');
  cases++;console.log(`Favorite case ${cases}: ${width}px ${theme} ${design} passed`);await context.close();
 }
 console.log(`${cases} real-browser favorite selection cases passed: repeated touch, section clicks, keyboard/mouse and blocked persistence.`);
}finally{await browser.close();await server.close();}

import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createServer} from 'node:http';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let temporary,playwrightModule=process.env.MID_PLAYWRIGHT_MODULE;
if(!playwrightModule){temporary=mkdtempSync(join(tmpdir(),'mid-c17-browser-'));const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:temporary}).trim());playwrightModule=join(dirname(dirname(cli)),'playwright');execFileSync('node',[cli,'install','chromium'],{stdio:'inherit',timeout:240000});}
const {chromium}=require(playwrightModule);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/App.tsx');
const stored=app.split('\n').find(line=>line.startsWith('function storedForecastDisplaySettings()'));
const defaults=app.split('\n').find(line=>line.startsWith('const DEFAULT_FORECAST_DISPLAY_SETTINGS:'));
const handler=app.slice(app.indexOf(' const forecastDisplaySettingsRef=useRef(forecastDisplaySettings);'),app.indexOf('\n',app.indexOf(' const setForecastDisplaySettings=(value:')));
const boot=stripTypeScriptTypes(`import {initializeStorageSafety,flushStorageSafetyMirror} from './storageSafety.js';import{readForecastDisplaySettingsRaw,persistForecastDisplaySettings}from './forecastDisplayPersistence.js';await initializeStorageSafety();const normalizeConfidenceDisplayMode=x=>x||'signal';${defaults}\n${stored}\nlet forecastDisplaySettings=storedForecastDisplaySettings();const useRef=value=>({current:value});const setForecastDisplaySettingsState=value=>{forecastDisplaySettings=value;document.querySelector('input').checked=value.ecmwfTemperatureColors};${handler}\nwindow.change=value=>setForecastDisplaySettings(previous=>({...previous,ecmwfTemperatureColors:value}));document.querySelector('input').checked=forecastDisplaySettings.ecmwfTemperatureColors;document.querySelector('input').onchange=event=>setForecastDisplaySettings(previous=>({...previous,ecmwfTemperatureColors:event.target.checked}));window.flush=flushStorageSafetyMirror;window.ready=true;`);
const modules={};for(const name of ['storageContracts','storageSafety','forecastDisplayPersistence'])modules['/'+name+'.js']=stripTypeScriptTypes(read('src/'+name+'.ts')).replace(/from '\.\/([^']+)'/g,"from './$1.js'");
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/'?'text/html':'application/javascript');res.end(req.url==='/'?`<!doctype html><meta name="viewport" content="width=device-width"><label><input type="checkbox">ECMWF-Temperaturfarben</label><script type="module" src="/boot.js"></script>`:req.url==='/boot.js'?boot:modules[req.url]||'');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let cases=0;
try{for(const width of [320,390,412,844,1024,1440])for(const theme of ['light','dark']){
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});let page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>window.ready);
 for(const value of [true,false,true,false]){
  await page.evaluate(v=>window.change(v),value);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mid:forecastDisplaySettings')).ecmwfTemperatureColors),value,'native commit exists immediately');
  await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.locator('input').isChecked(),value,'reload restores actual App reader');
  await page.evaluate(()=>window.flush());await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>window.ready);assert.equal(await page.locator('input').isChecked(),value,'closed-page restart restores actual App reader');
 }
 await page.evaluate(async()=>{await window.flush();const local=JSON.parse(localStorage.getItem('mid:forecastDisplaySettings'));local.ecmwfTemperatureColors=true;local.updatedAt+=100;Storage.prototype.setItem.call(localStorage,'mid:forecastDisplaySettings',JSON.stringify(local));});
 await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.locator('input').isChecked(),true,'newer native semantic revision beats stale durable mirror');
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();cases++;
}console.log(`${cases} viewport/theme cases passed: synchronous on/off, immediate reload, closed-page restart, stale mirror recovery, no runtime errors or overflow.`);}finally{await browser.close();await new Promise(resolve=>server.close(resolve));if(temporary)rmSync(temporary,{recursive:true,force:true});}

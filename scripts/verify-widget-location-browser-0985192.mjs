import {readFile,realpath} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const require=createRequire(path.join(process.cwd(),'package.json')),{build}=require('esbuild');
const cli=await realpath(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const {chromium}=createRequire(cli)('playwright');
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{Widget}from'./src/WidgetGenerator';import{WIDGET_URL_LOCATIONS,WIDGET_URL_PROFILES}from'./src/widgetUrlExports';window.renderQA=(index,profileIndex,theme)=>{const location=WIDGET_URL_LOCATIONS[index],profile=WIDGET_URL_PROFILES[profileIndex];createRoot(document.getElementById('root')).render(<Widget loc={location} days={[]} hours={[]} minutes15={[]} unit='kn' elevation={123} timezone='Europe/Berlin' timezoneAbbreviation='CEST' ensemblePanel={null} onEnsembleRequested={()=>{}} urlExport={{location,...profile,theme,temperatureColors:'ecmwf'}}/>)};`;
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,jsx:'automatic',format:'iife',write:false,define:{'import.meta.env':'{}'},loader:{'.css':'empty'},logLevel:'silent'});
const css=await readFile('src/midPresentation.css','utf8'),browser=await chromium.launch({...(process.env.MID_WARNING_QA_BROWSER?{executablePath:process.env.MID_WARNING_QA_BROWSER}:{}),headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [360,393,768,1024,1440])for(const theme of ['light','dark'])for(const location of [0,1,2])for(const profile of [0,1]){
 await page.setViewportSize({width,height:1000});await page.setContent(`<html data-mid-design='next' data-theme='${theme}'><meta name='viewport' content='width=device-width,initial-scale=1'><style>${css}</style><body><div id='root'></div></body></html>`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(([i,p,t])=>window.renderQA(i,p,t),[location,profile,theme]);await page.waitForSelector('.weatherwidget>header');
 const header=page.locator('.weatherwidget>header');if(await header.count()!==1||!await header.isVisible())throw Error('Missing or duplicate export header');
 const name=await header.locator('strong').innerText();if(name!==['Kürecik','Malatya','Ämari'][location])throw Error('Wrong location');
 const text=await header.innerText();for(const token of ['°N','°E','123 m ü. NHN','Ortszeit CEST'])if(!text.includes(token))throw Error('Metadata missing: '+token);
 const inside=await header.evaluate(el=>{const h=el.getBoundingClientRect(),w=el.closest('.weatherwidget').getBoundingClientRect();return h.left>=w.left-1&&h.right<=w.right+1&&h.top>=w.top-1&&h.bottom<=w.bottom+1});if(!inside)throw Error('Header outside exported bounds');
 if(width===1440&&theme==='light'&&location===0&&profile===0)await page.locator('.weatherwidget').screenshot({path:'/tmp/mid-widget-location-192.png'});
}if(errors.length)throw Error(errors.join('\n'));console.log('Widget location browser: 120 profile/location/theme/viewport combinations; complete single visible header inside export bounds.');}finally{await browser.close()}

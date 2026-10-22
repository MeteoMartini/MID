// Real report and React panel with synthetic archived forecasts; no live skill claim.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,realpathSync,rmSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=mkdtempSync(join(tmpdir(),'mid311-browser-'));
const screenshots=process.env.MID_PAIRED_QA_DIR;if(screenshots)mkdirSync(screenshots,{recursive:true});
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out,timeout:180000}).trim());
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const {chromium}=await import(pathToFileURL(join(dirname(dirname(cli)),'playwright','index.mjs'))).catch(()=>import(pathToFileURL(join(dirname(cli),'index.mjs'))));
const entry=`import React from 'react';import{createRoot}from'react-dom/client';
import Panel from './src/ForecastVerificationPanel';import{buildForecastVerificationReport}from'./src/forecastVerification';
localStorage.setItem('mid:weather-twin:settings:v1',JSON.stringify({enabled:false,personalRecommendations:false}));
const location={id:1,name:'Niederkassel-Rheidt · synthetischer Kontrollvergleich',latitude:50.82,longitude:7.14,timezone:'Europe/Berlin'},key='paired-qa';
const captures=[],references=[];
for(let i=1;i<=7;i++){
 const date='2026-10-'+String(i).padStart(2,'0'),source={id:'qa-measured',label:'Synthetische Messreferenz',kind:'measured',quality:.9};
 references.push({date,max:20,min:10,precipitation:0,source:source.label,regime:'wechselhaft',quality:.9,confidence:'high',kind:'measured',sources:[source],coverageHours:24});
 const prediction=(id,max,min)=>({id,label:id,max,min,precipitation:0,probability:0,probabilityKind:'daily-wet-native'});
 const predictions=[prediction('best_match',i===7?99:22,i===7?90:12)];
 if(i<=6)predictions.push({...prediction('mid_local_weighted',21,11),gust:30});
 captures.push({id:'qa-'+i,targetDate:date,issuedAt:new Date(Date.parse(date+'T10:00:00Z')-86400000).toISOString(),leadHours:24,timezone:location.timezone,predictedRegime:'wechselhaft',predictions});
}
localStorage.setItem('mid:forecast-verification:v3:'+key,JSON.stringify({version:3,updatedAt:'2026-10-22T00:00:00Z',captures,references,observations:[]}));
window.__qaReport=buildForecastVerificationReport(key,[],[],location);
createRoot(document.getElementById('root')).render(<main className="app"><Panel locationKey={key} location={location} days={[]} ensemble={[]} hours={[]}/></main>);`;
await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},outfile:join(out,'qa.js'),bundle:true,jsx:'automatic',format:'iife',define:{'import.meta.env':'{}'},loader:{'.css':'empty'},logLevel:'silent'});
const sheets=[...readFileSync('src/main.tsx','utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const server=createServer((req,res)=>{const path=req.url.split('?')[0];
 if(path==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${sheets.map(s=>`<link rel="stylesheet" href="/src/${s}">`).join('')}<style>body{margin:0;padding:12px}.app{display:block!important;max-width:1100px;margin:auto}</style></head><body><div id="root"></div><script src="/qa.js"></script></body></html>`)}
 else if(path==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')))}
 else if(sheets.includes(path.slice(5))){res.setHeader('Content-Type','text/css');res.end(readFileSync(path.slice(1)))}
 else{res.statusCode=404;res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.MID_BROWSER_EXECUTABLE?{executablePath:process.env.MID_BROWSER_EXECUTABLE}:{})});let cases=0;
try{
 for(const [width,height]of [[320,640],[390,844],[430,932],[844,390],[768,1024],[1024,768],[1440,900]])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.midDesign='next'},theme);
  await page.locator('.forecast-verification-kpis').waitFor();
  const result=await page.evaluate(()=>({days:window.__qaReport.weightedValidationDays,cases:window.__qaReport.weightedValidationCases,improvement:window.__qaReport.weightedImprovement,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert.equal(result.days,6);assert.equal(result.cases,6);assert.ok(Math.abs(result.improvement-50)<1e-8);
  const control=page.locator('.forecast-verification-kpis article').last();
  assert.ok((await control.innerText()).includes('6 Tage / 6 Fälle'));
  assert.ok((await control.getAttribute('title')).includes('gemeinsam verfügbare Parameter'));
  assert.equal(result.overflow,false,JSON.stringify({width,height,theme}));
  assert.deepEqual(errors,[]);if(screenshots&&(width===320||width===1440))await page.screenshot({path:join(screenshots,`${width}-${theme}.png`),fullPage:true});cases++;await page.close();
 }
 console.log('Paired verification: actual report and React panel, '+cases+' viewport/theme cases passed; synthetic data, no physical-device or empirical-study acceptance.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));rmSync(out,{recursive:true,force:true})}

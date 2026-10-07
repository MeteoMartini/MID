import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd(),cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const {chromium}=createRequire(cli)('playwright'),{build}=createRequire(path.join(root,'package.json'))('esbuild');
const app=await readFile('src/App.tsx','utf8'),imports=app.split('\n').filter(line=>line.startsWith('import ')&&["from './ForecastDisplayPrimitives'","from 'react'","from 'lucide-react'","from './weather'","from './officialWarningOrder'"].some(token=>line.includes(token))).join('\n');
const functions=app.slice(app.indexOf('function hazardSortEpoch('),app.indexOf('const WIND_WARNING_BANDS='));
const props={automatic:[['Gewitter','2026-10-08T11:00Z','2026-10-08T18:00Z'],['Nebel','2026-10-10T03:00Z','2026-10-10T04:00Z'],['Windböen','2026-10-12T09:00Z','2026-10-12T18:00Z'],['Windböen über Nacht','2026-10-12T18:00Z','2026-10-14T14:00Z'],['Leichter Schneefall','2026-10-13T20:00Z','2026-10-17T16:00Z']].map(([title,validFrom,validTo])=>({title,validFrom,validTo,kind:'wind',level:'medium',text:'MID-Prognosehinweis',metric:'bis zu 35 kt',scopeLabel:'MID · Vorhinweis',precisionLabel:'48–120 h · Zeitfenster und Ausprägung unsicher'})),alerts:[{id:'dwd-test',headline:'Amtliche Windwarnung',description:'Originalmeldung',source:'DWD',level:'yellow',onset:'2026-10-08T12:00Z',expires:'2026-10-08T16:00Z'}],loading:false,error:'',provider:'DWD',timezone:'Europe/Berlin',unit:'kn'};
const result=await build({stdin:{contents:imports+"\nimport {createRoot} from 'react-dom/client';Date.now=()=>Date.parse('2026-10-07T16:00Z');\n"+functions+`\ncreateRoot(document.getElementById('root')).render(<WarningEventTab {...${JSON.stringify(props)}}/>);`,resolveDir:path.resolve('src'),loader:'tsx'},bundle:true,platform:'browser',format:'iife',jsx:'automatic',write:false,logLevel:'silent'});
const css=await readFile('src/midPresentation.css','utf8'),browser=await chromium.launch({...(process.env.MID_WARNING_QA_BROWSER?{executablePath:process.env.MID_WARNING_QA_BROWSER}:{}),headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let cases=0;
 for(const design of ['classic','next'])for(const mode of ['standard','advanced'])for(const theme of ['light','dark'])for(const [width,height] of [[320,740],[393,852],[852,393],[768,1024],[1024,768],[1440,1000]]){
  await page.setViewportSize({width,height});
  await page.setContent(`<html data-mid-design="${design}" data-theme="${theme}"><head><style>${css}</style></head><body><div class="app mode-${mode} density-comfortable with-section-navigation"><main><section class="warnings-responsive-shell"><div id="root"></div></section></main></div><div id="official-warning-dwd-test"></div></body></html>`);
  await page.addScriptTag({content:result.outputFiles[0].text});await page.waitForSelector('.warning-event-row');
  assert.equal(await page.locator('.warning-timeline-day').count(),4);assert.equal(await page.locator('.warning-event-row').count(),6);
  assert.match(await page.locator('.warning-timeline-date').first().innerText(),/Donnerstag[\s\S]*08\.10\.2026/);
  assert.match(await page.locator('.warning-now-row').innerText(),/07\.10\.[\s\S]*18:00/);
  const geometry=await page.evaluate(()=>{const panel=document.querySelector('.warning-event-tab').getBoundingClientRect(),header=document.querySelector('.warning-event-tab-head').getBoundingClientRect(),track=document.querySelector('.warning-event-track').getBoundingClientRect(),row=document.querySelector('.warning-event-row').getBoundingClientRect(),main=document.querySelector('.warning-event-main').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth+1,headerBelow:track.top>=header.bottom-1,coverage:track.width/panel.width,textWidth:main.width,rowWidth:row.width,dateVisible:[...document.querySelectorAll('.warning-timeline-date')].every(e=>e.getBoundingClientRect().width>0)}});
  assert.equal(geometry.overflow,false,`${design}/${mode}/${theme}/${width}: overflow`);assert.ok(geometry.headerBelow,'no horizontal header/cards split');assert.ok(geometry.coverage>.85,'track must use full panel width');assert.ok(geometry.textWidth>geometry.rowWidth*.6,`${design}/${mode}/${theme}/${width}: source badge must not consume text column ${JSON.stringify(geometry)}`);assert.ok(geometry.dateVisible);
  if(width===1440&&mode==='standard')await page.screenshot({path:`/tmp/mid195-timeline-${design}-${theme}.png`,fullPage:true});
  if(width===393&&design==='next'&&mode==='standard'&&theme==='light')await page.screenshot({path:'/tmp/mid195-timeline-mobile.png',fullPage:true});
  cases++;
 }
 assert.equal(cases,48);assert.deepEqual(errors,[]);console.log('Warning timeline: 48 Classic/Next × Standard/Advanced × Light/Dark × phone/tablet/desktop cases passed.');
}finally{await browser.close()}

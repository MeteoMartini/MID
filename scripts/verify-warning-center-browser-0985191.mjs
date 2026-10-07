import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd(),require=createRequire(path.join(root,'package.json')), {build}=require('esbuild');
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const {chromium}=createRequire(cli)('playwright');
const app=await readFile('src/App.tsx','utf8'),imports=app.split('\n').filter(line=>line.startsWith('import ')&&["from './ForecastDisplayPrimitives'","from 'react'","from 'lucide-react'","from './weather'","from './officialWarningOrder'"].some(token=>line.includes(token))).join('\n');
const functions=app.slice(app.indexOf('function hazardSortEpoch('),app.indexOf('const WIND_WARNING_BANDS='));
const now=Date.now(),iso=h=>new Date(now+h*3600000).toISOString();
const props={automatic:[{kind:'wind',title:'Windböen',level:'medium',validFrom:iso(48),validTo:iso(57),text:'Böenhinweis für die Zukunft',metric:'bis zu 35 kt'}],alerts:[{id:'dwd-1',headline:'Amtliche Windwarnung',description:'Amtlicher vollständiger Text',instruction:'Amtliche Handlungsanweisung',level:'yellow',source:'DWD',onset:iso(1),expires:iso(5)}],loading:false,error:'',provider:'DWD',timezone:'Europe/Berlin',unit:'kn'};
const entry=imports+"\nimport {createRoot} from 'react-dom/client'; const warmExtremeWeatherOutlook=()=>{};const MemoOfficialWarnings=memo(OfficialWarnings),MemoHazards=memo(Hazards);\n"+functions+`\ncreateRoot(document.getElementById('root')).render(<WarningCenter {...${JSON.stringify(props)}}/>);`;
const result=await build({stdin:{contents:entry,resolveDir:path.resolve('src'),loader:'tsx'},bundle:true,platform:'browser',format:'iife',jsx:'automatic',write:false,logLevel:'silent'});
let css=await readFile('src/midPresentation.css','utf8');const browser=await chromium.launch({...(process.env.MID_WARNING_QA_BROWSER?{executablePath:process.env.MID_WARNING_QA_BROWSER}:{}),headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [width,height] of [[393,852],[852,393],[768,1024],[1024,768],[360,800],[1440,900]])for(const theme of ['light','dark']){
await page.setViewportSize({width,height});await page.setContent(`<html data-mid-design="next" data-theme="${theme}"><head><style>${css}</style></head><body><div class="app"><main><div id="root"></div></main></div></body></html>`);await page.addScriptTag({content:result.outputFiles[0].text});await page.waitForSelector('.hazard-body');
if(!await page.locator('.official-message').isVisible())throw Error('Official detail hidden');
const status=await page.locator('.hazards-responsive-summary>div>span').innerText();if(!status.includes('1 Hinweis anstehend'))throw Error('Upcoming count missing');
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw Error(`Overflow ${width} ${theme}`);
await page.locator('.hazard-toggle').click();if(await page.locator('.hazard-body').count())throw Error('MID collapse failed');
await page.locator('.official-alert>button').click();if(await page.locator('.official-message').count())throw Error('Official collapse failed');
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('mid:open-module',{detail:{id:'warnings'}})));await page.waitForSelector('.hazard-body');if(!await page.locator('.official-message').isVisible())throw Error('Reopen failed');
if(width===393&&theme==='light')await page.screenshot({path:'/tmp/mid-warning-mobile.png',fullPage:true});
console.log(`${width}x${height} ${theme}: status, initial open, collapse, reopen, no overflow`);
}if(errors.length)throw Error(errors.join('\n'));}finally{await browser.close()}

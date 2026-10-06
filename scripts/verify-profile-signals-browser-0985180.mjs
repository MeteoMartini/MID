import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height] of [[360,800],[390,844],[844,390],[768,1024],[1024,768],[1366,900]])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height}});
  await page.route('**/*',route=>route.abort());
  await page.setContent(`<html data-mid-design="next" data-theme="${theme}"><body><div class="forecast-cockpit" style="width:calc(100vw - 32px);max-width:100%;margin:0 auto"><section class="cockpit-weather-profile"><div class="cockpit-weather-profile__signals"><span class="impact-level-2"><small>Stärkste Einschränkung</small><b>Dauerregen</b><span class="signal-time">Stufe 2 · 07.10. 03:00–08.10. 09:00</span><em>Standortprognose: 48 mm / 48 h. Markiert ist die Regenphase des Summenfensters. MID-Hinweis nach DWD-Schwellen; keine amtliche Warnung.</em></span></div></section></div></body></html>`);
  await page.addStyleTag({content:readFileSync('src/midPresentation.css','utf8')});
  const result=await page.evaluate(()=>{
   const signals=document.querySelector('.cockpit-weather-profile__signals'),card=signals.firstElementChild;
   return {display:getComputedStyle(signals).display,available:signals.clientWidth,width:card.getBoundingClientRect().width,overflow:signals.scrollWidth>signals.clientWidth+1||signals.scrollHeight>signals.clientHeight+1,textOverflow:[...card.children].some(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert.equal(result.display,'grid',`${width}/${theme}: legacy mobile flex still active`);
  assert.ok(result.width>=result.available-2,`${width}/${theme}: signal not full width`);
  assert.equal(result.overflow,false,`${width}/${theme}: signal overflow`);
  assert.equal(result.textOverflow,false,`${width}/${theme}: text clipped`);
  assert.equal(result.pageOverflow,false,`${width}/${theme}: horizontal page overflow`);
  await page.close();
 }
 console.log('Profile signal browser QA: 12 phone/tablet/desktop cases, full width and no text/page overflow.');
}finally{await browser.close();}

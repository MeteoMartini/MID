import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root=process.cwd(),out=mkdtempSync(join(tmpdir(),'mid-model-map-legend-'));
const read=path=>readFileSync(join(root,path),'utf8');
const component=read('src/ModelMapColorLegend.tsx'),styles=read('src/modelMapColorLegend.css');
const existingModelMap=read('src/NativeModelMap.tsx');

assert.ok(component.includes('scales:Record<ModelMapLegendMode,ModelMapLegendScale>'),'Both modes must receive caller-owned scale data.');
assert.ok(component.includes('backgroundImage:scale.gradient'),'The supplied gradient must be rendered without recalculation.');
assert.ok(component.includes('aria-pressed={mode===option}'),'The selected mode must be exposed accessibly.');
assert.ok(!/nativeModelFields|WeatherMapsPanel|MapWorkspacePanel|App\.tsx/.test(component),'The legend must stay independent from map/data/app integration.');
assert.ok(existingModelMap.includes('NATIVE_LEGENDS[kind].map'),'Existing categorical native-map legend must remain separate.');
for(const token of ['.mid-model-map-legend__gradient','[aria-pressed=\'true\']','@media(max-width:520px',":root[data-theme='dark']"]){
  assert.ok(styles.includes(token),`Expected responsive/theme/selection styling: ${token}`);
}

const entry=[
  "import React,{useState} from 'react';",
  "import{createRoot}from'react-dom/client';",
  "import ModelMapColorLegend from './src/ModelMapColorLegend';",
  "const scales={",
  " range:{gradient:'linear-gradient(90deg,#2869a5 0%,#e4e9e7 50%,#c44545 100%)',ticks:[{position:0,label:'−18'},{position:50,label:'0'},{position:100,label:'24'}]},",
  " fixed:{gradient:'linear-gradient(90deg,#1e4e8c 0%,#e0e9e5 50%,#a92f37 100%)',ticks:[{position:0,label:'−30'},{position:50,label:'0'},{position:100,label:'30'}]}",
  "};",
  "function Fixture(){const[mode,setMode]=useState('range');const unit=new URLSearchParams(location.search).get('unit')==='long'?'mm Wasseräquivalent pro 6 Stunden':'m/s';return <main><ModelMapColorLegend label='Windgeschwindigkeit' unit={unit} mode={mode} scales={scales} onModeChange={setMode}/></main>}",
  "createRoot(document.getElementById('root')).render(<Fixture/>);",
].join('\n');

let browser,server;
try{
  await build({
    stdin:{contents:entry,resolveDir:root,loader:'tsx'},
    bundle:true,platform:'browser',format:'esm',jsx:'automatic',
    outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent',
  });

  const html='<!doctype html><html lang="de" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modellkarten-Farblegende QA</title><link rel="stylesheet" href="/legend.css"></head><body><div id="root"></div><script type="module" src="/qa.js"></script></body></html>';
  server=createServer((req,res)=>{
    const pathname=new URL(req.url??'/',`http://${req.headers.host}`).pathname;
    if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return}
    if(pathname==='/qa.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(join(out,'qa.js')));return}
    if(pathname==='/legend.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(styles);return}
    res.statusCode=404;res.end();
  });
  await new Promise((resolveListen,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolveListen)});

  const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',cwd:out}).trim();
  const playwrightRoot=dirname(dirname(realpathSync(cli)));
  const {chromium}=await import(pathToFileURL(join(playwrightRoot,'playwright/index.mjs')).href).catch(()=>import(pathToFileURL(join(dirname(realpathSync(cli)),'index.mjs')).href));
  execFileSync('node',[realpathSync(cli),'install','chromium'],{stdio:'inherit',timeout:240000});
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});

  const base=`http://127.0.0.1:${server.address().port}`;
  const viewports=[[320,740],[390,844],[430,932],[1024,768],[1440,900]];
  const contrastRatio=(foreground,background)=>{
    const rgb=value=>{const match=value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);assert.ok(match,`Unrecognized computed color: ${value}`);return match.slice(1,4).map(Number)};
    const luminance=value=>rgb(value).map(channel=>{const c=channel/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,index)=>sum+c*[.2126,.7152,.0722][index],0);
    const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
    return(values[0]+.05)/(values[1]+.05);
  };

  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const theme of ['light','dark']){
      await page.goto(`${base}/?unit=long`);
      await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
      const legend=page.locator('.mid-model-map-legend');
      await legend.waitFor();
      const rangeButton=page.getByRole('button',{name:'Wertebereich'});
      const fixedButton=page.getByRole('button',{name:'Feste Skala'});
      assert.equal(await rangeButton.getAttribute('aria-pressed'),'true',`${width} ${theme}: initial mode`);
      assert.equal(await fixedButton.getAttribute('aria-pressed'),'false',`${width} ${theme}: inactive mode`);

      const initial=await page.evaluate(()=>{
        const root=document.querySelector('.mid-model-map-legend');
        const rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
        const ticks=[...root.querySelectorAll('.mid-model-map-legend__tick')];
        const mode=root.querySelector('.mid-model-map-legend__modes');
        const header=root.querySelector('.mid-model-map-legend__header');
        const unit=root.querySelector('.mid-model-map-legend__unit-value');
        const button=root.querySelector('.mid-model-map-legend__mode[aria-pressed="true"]');
        return{
          documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
          root:rect(root),header:rect(header),identity:rect(root.querySelector('.mid-model-map-legend__identity')),
          mode:rect(mode),unit:rect(unit),unitScrollWidth:unit.scrollWidth,unitClientWidth:unit.clientWidth,
          ticks:ticks.map(rect),tickLabels:ticks.map(node=>node.textContent.trim()),
          gradient:getComputedStyle(root.querySelector('.mid-model-map-legend__gradient')).backgroundImage,
          textColor:getComputedStyle(root).color,rootColor:getComputedStyle(root).backgroundColor,
          tickColor:getComputedStyle(ticks[0]).color,
          buttonColor:getComputedStyle(button).color,buttonBackground:getComputedStyle(button).backgroundColor,
          buttonHeight:button.getBoundingClientRect().height,
        };
      });
      assert.ok(initial.documentWidth<=width,`${width} ${theme}: page overflows horizontally`);
      assert.ok(initial.root.width<=width,`${width} ${theme}: legend exceeds viewport`);
      assert.ok(initial.unitScrollWidth<=initial.unitClientWidth+1,`${width} ${theme}: long unit overflows`);
      assert.equal(initial.tickLabels.join('|'),'−18|0|24',`${width} ${theme}: range tick values`);
      assert.ok(initial.gradient.startsWith('linear-gradient'),`${width} ${theme}: continuous color band`);
      assert.ok(initial.buttonHeight>=40,`${width} ${theme}: mode control touch target`);
      assert.ok(initial.identity.right<=initial.mode.left+1||initial.identity.bottom<=initial.mode.top+1,`${width} ${theme}: header items overlap`);
      assert.ok(initial.ticks[0].right<=initial.ticks[1].left+1,`${width} ${theme}: left and middle labels overlap`);
      assert.ok(initial.ticks[1].right<=initial.ticks[2].left+1,`${width} ${theme}: middle and right labels overlap`);
      assert.ok(contrastRatio(initial.textColor,initial.rootColor)>=4.5,`${width} ${theme}: legend text contrast`);
      assert.ok(contrastRatio(initial.tickColor,initial.rootColor)>=4.5,`${width} ${theme}: tick contrast`);
      assert.ok(contrastRatio(initial.buttonColor,initial.buttonBackground)>=4.5,`${width} ${theme}: selected mode contrast`);

      await fixedButton.click();
      assert.equal(await fixedButton.getAttribute('aria-pressed'),'true',`${width} ${theme}: fixed mode selected`);
      assert.equal(await rangeButton.getAttribute('aria-pressed'),'false',`${width} ${theme}: range mode deselected`);
      assert.equal((await legend.locator('.mid-model-map-legend__ticks').innerText()).replace(/\s+/g,' '),'−30 0 30',`${width} ${theme}: fixed-scale labels`);
      const fixedGradient=await legend.locator('.mid-model-map-legend__gradient').evaluate(element=>getComputedStyle(element).backgroundImage);
      assert.notEqual(fixedGradient,initial.gradient,`${width} ${theme}: selected scale gradient`);
      assert.ok(await page.getByText('Aktive Skala: Feste Skala').count(),`${width} ${theme}: announced active mode`);
      await rangeButton.click();
      assert.equal(await rangeButton.getAttribute('aria-pressed'),'true',`${width} ${theme}: mode can switch back`);
      assert.equal(errors.length,0,errors.join('; '));

      if(process.env.MID_KEEP_BROWSER_QA==='1')await page.screenshot({path:join(out,`${width}-${theme}.png`),fullPage:true});
      console.log(`Modellkarten-Legende ${width}×${height}, ${theme}, lange Einheit: Modus, Werte, Kontrast und Überbreite geprüft.`);
    }
    await page.close();
  }

  const shortUnitPage=await browser.newPage({viewport:{width:320,height:740}});
  await shortUnitPage.goto(`${base}/?unit=short`);
  await shortUnitPage.locator('.mid-model-map-legend').waitFor();
  assert.ok(await shortUnitPage.locator('.mid-model-map-legend__unit-value').innerText()==='m/s','Short unit must remain visible.');
  assert.ok(await shortUnitPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Short-unit mobile layout must not overflow.');
  await shortUnitPage.close();
  console.log('Kurze Einheit auf 320 px ebenfalls geprüft.');
  if(process.env.MID_KEEP_BROWSER_QA==='1')console.log(`Browser-Screenshots: ${out}`);
}finally{
  if(browser)await browser.close();
  if(server)await new Promise(resolveClose=>server.close(resolveClose));
  if(process.env.MID_KEEP_BROWSER_QA!=='1')rmSync(out,{recursive:true,force:true});
}
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
assert.ok(component.includes('disabledModes?:readonly ModelMapLegendMode[]'),'Unavailable modes must be supported.');
assert.ok(component.includes('disabled={disabled||disabledModes.includes(option)}'),'Disabled modes and animation lock must disable their controls.');
assert.ok(component.includes('scale.stops.map'),'Exact caller-provided fixed color thresholds must render.');
assert.ok(component.includes('aria-pressed={mode===option}'),'The selected mode must be exposed accessibly.');
assert.ok(!/nativeModelFields|WeatherMapsPanel|MapWorkspacePanel|App\.tsx/.test(component),'The legend must stay independent from map/data/app integration.');
assert.ok(existingModelMap.includes("ModelMapColorLegend from './ModelMapColorLegend'"),'The real native model map must import the legend.');
assert.ok(existingModelMap.includes('<ModelMapColorLegend'),'The real native model map must render the legend.');
assert.ok(existingModelMap.includes('mode="fixed"'),'The native map must use the existing fixed scale.');
assert.ok(existingModelMap.includes("disabledModes={['range']}"),'The unverified range mode must remain disabled.');
assert.ok(existingModelMap.includes('disabled={playing}'),'Legend controls must lock during animation.');
assert.ok(existingModelMap.includes("kind==='precipitation'?TOTALS_COLORS:NATIVE_LEGENDS[kind]"),'Displayed numeric colors must come directly from the palette used by the map.');
assert.ok(existingModelMap.includes("kind==='sigwx'?")&&existingModelMap.includes('NATIVE_LEGENDS.sigwx.map'),'Categorical weather-code colors must remain separate.');
assert.ok(!existingModelMap.includes('NATIVE_LEGENDS[kind].map'),'Numeric maps must no longer use the former untyped palette chips.');
assert.ok(!/Intl\.NumberFormat|linear-gradient/.test(existingModelMap),'The integration must not add color or unit calculations.');
for(const token of ['.mid-model-map-legend__stops','.mid-model-map-legend__mode:disabled','min-height:44px','.weather-precipitation-map-shell>.mid-model-map-legend','@media(max-width:520px',":root[data-theme='dark']"]){
  assert.ok(styles.includes(token),`Expected responsive/theme/selection styling: ${token}`);
}

const entry=[
  "import React,{useState} from 'react';",
  "import{createRoot}from'react-dom/client';",
  "import ModelMapColorLegend from './src/ModelMapColorLegend';",
  "import {NATIVE_LEGENDS} from './src/nativeModelFields';",
  "import {TOTALS_COLORS} from './src/precipitationTotals';",
  "const query=new URLSearchParams(location.search),kind=query.get('kind')==='precipitation'?'precipitation':'wind',palette=kind==='precipitation'?TOTALS_COLORS:NATIVE_LEGENDS[kind],stops=palette.map(([value,color])=>({label:String(value),color}));",
  "window.__paletteExpected=stops;",
  "const scales={range:{},fixed:{stops}};",
  "function Fixture(){const[playing,setPlaying]=useState(false);const unit=query.get('unit')==='long'?'mm Wasseräquivalent pro 6 Stunden':'m/s';return <main><button type='button' onClick={()=>setPlaying(value=>!value)}>{playing?'Animation pausieren':'Animation starten'}</button><div className='weather-precipitation-map-shell' style={{position:'relative',height:'360px',width:'100%'}}><ModelMapColorLegend label={kind==='precipitation'?'Niederschlag':'Windgeschwindigkeit'} unit={unit} mode='fixed' scales={scales} onModeChange={()=>{}} disabled={playing} disabledModes={['range']}/></div></main>}",
  "createRoot(document.getElementById('root')).render(<Fixture/>);",
].join('\n');

let browser,server;
try{
  await build({
    stdin:{contents:entry,resolveDir:root,loader:'tsx'},
    bundle:true,platform:'browser',format:'esm',jsx:'automatic',
    outfile:join(out,'qa.js'),loader:{'.css':'empty'},logLevel:'silent',
  });

  const html='<!doctype html><html lang="de" data-theme="light" data-mid-design="next"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modellkarten-Farblegende QA</title><link rel="stylesheet" href="/legend.css"></head><body><div id="root"></div><script type="module" src="/qa.js"></script></body></html>';
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
  const viewports=[[320,740],[390,844],[430,932],[834,1194],[1024,768],[1194,834],[1440,900]];
  const contrastRatio=(foreground,background)=>{
    const rgb=value=>{const match=value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);assert.ok(match,`Unrecognized computed color: ${value}`);return match.slice(1,4).map(Number)};
    const luminance=value=>rgb(value).map(channel=>{const c=channel/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,index)=>sum+c*[.2126,.7152,.0722][index],0);
    const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
    return(values[0]+.05)/(values[1]+.05);
  };

  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const kind of ['wind','precipitation'])for(const theme of ['light','dark']){
      await page.goto(`${base}/?kind=${kind}&unit=long`);
      await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
      const legend=page.locator('.mid-model-map-legend');
      await legend.waitFor();
      const rangeButton=page.getByRole('button',{name:'Wertebereich'});
      const fixedButton=page.getByRole('button',{name:'Feste Skala'});
      assert.equal(await rangeButton.getAttribute('aria-pressed'),'false',`${width} ${theme}: unavailable range mode`);
      assert.equal(await rangeButton.isDisabled(),true,`${width} ${theme}: unavailable range mode disabled`);
      assert.equal(await fixedButton.getAttribute('aria-pressed'),'true',`${width} ${theme}: fixed mode selected`);
      assert.equal(await fixedButton.isDisabled(),false,`${width} ${theme}: fixed mode initially enabled`);

      const initial=await page.evaluate(()=>{
        const root=document.querySelector('.mid-model-map-legend');
        const rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
        const stops=[...root.querySelectorAll('.mid-model-map-legend__stops li')];
        const mode=root.querySelector('.mid-model-map-legend__modes');
        const header=root.querySelector('.mid-model-map-legend__header');
        const unit=root.querySelector('.mid-model-map-legend__unit-value');
        const button=root.querySelector('.mid-model-map-legend__mode[aria-pressed="true"]');
        const colorToRgb=value=>{const match=value.match(/^#([0-9a-f]{6})$/i);if(!match)return value;const hex=match[1];return`rgb(${parseInt(hex.slice(0,2),16)}, ${parseInt(hex.slice(2,4),16)}, ${parseInt(hex.slice(4,6),16)})`};
        return{
          documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
          root:rect(root),header:rect(header),identity:rect(root.querySelector('.mid-model-map-legend__identity')),
          mode:rect(mode),unit:rect(unit),unitScrollWidth:unit.scrollWidth,unitClientWidth:unit.clientWidth,
          position:getComputedStyle(root).position,
          stops:stops.map(node=>({label:node.textContent.trim(),color:getComputedStyle(node.querySelector('i')).backgroundColor})),
          expectedStops:window.__paletteExpected.map(stop=>({label:stop.label,color:colorToRgb(stop.color)})),
          stopRects:stops.map(rect),
          stopTextColor:getComputedStyle(stops[0]).color,
          textColor:getComputedStyle(root).color,rootColor:getComputedStyle(root).backgroundColor,
          theme:document.documentElement.dataset.theme,
          accent:getComputedStyle(root).getPropertyValue('--mid-map-legend-accent').trim(),
          selectedSurface:getComputedStyle(root).getPropertyValue('--mid-map-legend-selected').trim(),
          buttonColor:getComputedStyle(button).color,buttonBackground:getComputedStyle(button).backgroundColor,
          buttonHeight:button.getBoundingClientRect().height,
        };
      });
      assert.ok(initial.documentWidth<=width,`${width} ${theme}: page overflows horizontally`);
      assert.ok(initial.root.width<=width,`${width} ${theme}: legend exceeds viewport`);
      assert.ok(initial.unitScrollWidth<=initial.unitClientWidth+1,`${width} ${theme}: long unit overflows`);
      assert.equal(initial.theme,theme,`${width} ${kind} ${theme}: requested theme applied`);
      assert.deepEqual(initial.stops,initial.expectedStops,`${width} ${kind} ${theme}: all existing fixed thresholds and colors`);
      assert.equal(initial.position,'absolute',`${width} ${theme}: legend overlays the native map shell`);
      assert.ok(initial.stopRects.every(rect=>rect.left>=initial.root.left&&rect.right<=initial.root.right),`${width} ${theme}: fixed thresholds stay within the legend`);
      assert.ok(initial.buttonHeight>=44,`${width} ${theme}: mode control touch target`);
      assert.ok(initial.identity.right<=initial.mode.left+1||initial.identity.bottom<=initial.mode.top+1,`${width} ${theme}: header items overlap`);
      assert.ok(contrastRatio(initial.textColor,initial.rootColor)>=4.5,`${width} ${theme}: legend text contrast`);
      assert.ok(contrastRatio(initial.stopTextColor,initial.rootColor)>=4.5,`${width} ${theme}: fixed-threshold contrast`);
      assert.ok(contrastRatio(initial.buttonColor,initial.buttonBackground)>=4.5,`${width} ${kind} ${theme}: selected mode contrast ${initial.buttonColor} on ${initial.buttonBackground}; theme=${initial.theme}, accent=${initial.accent}, selected=${initial.selectedSurface}`);

      await page.getByRole('button',{name:'Animation starten'}).click();
      assert.equal(await fixedButton.isDisabled(),true,`${width} ${theme}: fixed control disabled during animation`);
      assert.equal(await rangeButton.isDisabled(),true,`${width} ${theme}: range control disabled during animation`);
      assert.equal(await fixedButton.getAttribute('aria-pressed'),'true',`${width} ${theme}: animation keeps the fixed scale selected`);
      await page.getByRole('button',{name:'Animation pausieren'}).click();
      assert.equal(await fixedButton.isDisabled(),false,`${width} ${theme}: fixed control restored after animation`);
      assert.equal(await rangeButton.isDisabled(),true,`${width} ${theme}: range stays unavailable after animation`);
      assert.ok(await page.getByText('Aktive Skala: Feste Skala').count(),`${width} ${theme}: announced active mode`);
      assert.equal(errors.length,0,errors.join('; '));

      if(process.env.MID_KEEP_BROWSER_QA==='1')await page.screenshot({path:join(out,`${width}-${theme}.png`),fullPage:true});
      console.log(`Modellkarten-Legende ${width}×${height}, ${kind}, ${theme}, vorhandene feste Schwellen/Farben, deaktivierter Wertebereich, Animation und Überbreite geprüft.`);
    }
    await page.close();
  }

  const shortUnitPage=await browser.newPage({viewport:{width:320,height:740}});
  await shortUnitPage.goto(`${base}/?kind=wind&unit=short`);
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
/**
 * MID Karten P1: real-Chrome, real React/MapLibre surroundings UI,
 * SOURCE-FIXTURE browser behavior QA, NOT real GRIB/WMS or iOS proof.
 *
 * The existing full unified-map-browser verification owns the broad matrix.
 * This narrowly checks mode persistence + NoData fail-close across devices.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const playwrightBinary=realpathSync(execFileSync('npm',[
  'exec','--yes','--package=playwright@1.56.1','--','which','playwright'
],{encoding:'utf8',timeout:120000}).trim());
const {chromium,webkit}=require(join(dirname(dirname(playwrightBinary)),'playwright'));
const browserFlavor=process.env.MID_QA_BROWSER||'chrome';
if(!['chrome','webkit'].includes(browserFlavor))throw Error('Unsupported fixture browser');

const cases=[
  {width:320,height:720,theme:'light'},
  {width:320,height:720,theme:'dark'},
  {width:390,height:844,theme:'light'},
  {width:390,height:844,theme:'dark'},
  {width:768,height:1024,theme:'light'},
  {width:768,height:1024,theme:'dark'},
  {width:1024,height:768,theme:'light'},
  {width:1024,height:768,theme:'dark'},
  {width:1440,height:900,theme:'light'},
  {width:1440,height:900,theme:'dark'},
];
const fixturePng=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64'
);
const report={schema:'mid.maps.surroundings.browser-responsive-qa.v1',
  sourceScope:'REAL_CHROME_REACT_MAPLIBRE_WITH_DETERMINISTIC_SOURCE_FIXTURES',
  isGenuineDwdOriginalData:false,realIosOrVoiceOverVerified:false,
  manualImageQualityVerified:false,activationAuthorized:false,releaseAuthorized:false,
  cases:[],browserFlavor};

process.env.VITE_WORKER_SAME_ORIGIN_PATH='/__qa-worker';
const server=await createServer({root,cacheDir:join(root,'node_modules/.vite-mid-surroundings-smoke'),
  server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
  plugins:[{name:'mid-surroundings-responsive-qa',configureServer(vite){
    vite.middlewares.use('/__surroundings-qa',async(_req,res)=>{
      res.setHeader('Content-Type','text/html');
      res.end(await vite.transformIndexHtml('/__surroundings-qa',
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/scripts/fixtures/unified-map-browser.tsx"></script></body></html>'));
    });
  }}]});
await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
const browser=browserFlavor==='webkit'
 ?await webkit.launch({headless:true})
 :await chromium.launch({channel:'chrome',headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

async function validateLayout(page,label){
  const box=await page.locator('.current-surroundings').evaluate(el=>{
    const rect=el.getBoundingClientRect();
    const selectors=[
      '.current-surroundings-display-modes button',
      '.current-surroundings-cloud-timeline button',
      '.current-surroundings-cloud-timeline input[type="range"]',
      '.current-surroundings header button',
    ];
    const touch=[...el.querySelectorAll(selectors.join(','))]
      .filter(node=>node.getBoundingClientRect().width>0)
      .map(node=>({text:node.getAttribute('aria-label')||node.textContent?.trim().slice(0,50),
        height:node.getBoundingClientRect().height,width:node.getBoundingClientRect().width}));
    const timeline=el.querySelector('.current-surroundings-cloud-timeline');
    const m=el.querySelector('.current-surroundings-map');
    return {
      pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
      cardOverflow:el.scrollWidth>el.clientWidth+1,
      timelineOverflow:!!timeline&&timeline.scrollWidth>timeline.clientWidth+1,
      cardRect:{x:rect.x,width:rect.width},
      mapHeight:m?.getBoundingClientRect().height,
      touch,
      modeBackground:getComputedStyle(el.querySelector('.current-surroundings-display-modes button')).backgroundColor,
    };
  });
  assert.equal(box.pageOverflow,false,label+': viewport overflow');
  assert.equal(box.cardOverflow,false,label+': card overflow');
  assert.equal(box.timelineOverflow,false,label+': quarter-hour timeline overflow');
  assert.ok(box.cardRect.x>=-1&&box.cardRect.x+box.cardRect.width<=
    page.viewportSize().width+1,label+': card outside viewport');
  assert.ok(box.mapHeight>=220,label+': map collapsed');
  assert.ok(box.touch.length>=5,label+': missing real UI controls');
  for(const touch of box.touch){
    assert.ok(touch.height>=44,label+': touch target under 44 CSS px: '+JSON.stringify(touch));
  }
  return box;
}

async function runCase(spec){
 const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},
   colorScheme:spec.theme,locale:'de-DE',timezoneId:'Europe/Berlin',
   reducedMotion:'reduce',deviceScaleFactor:1,
   ...(browserFlavor==='webkit'&&spec.width<=390?{isMobile:true,hasTouch:true}:{})});
 const page=await context.newPage(),errors=[];
 const label=spec.width+'/'+spec.height+'/'+spec.theme;
 const observed=new Date(Date.now()-5*60000).toISOString();
 const future=new Date(Date.now()+15*60000).toISOString();
 let timesCalls=0;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/__qa-worker?**',async route=>{
   const url=new URL(route.request().url()),mode=url.searchParams.get('mode');
   if(mode==='composite-times'){timesCalls++;return route.fulfill({json:{
     dwdRadar:[observed],dwdRadarNowcast:[future]}});}
   if(mode==='composite-wms')return route.fulfill({body:fixturePng,contentType:'image/png'});
   return route.fulfill({status:503,json:{error:'QA fixture: unavailable source, not zero'}});
 });
 try{
   await page.goto(base+'/__surroundings-qa?surroundings&design=next',{waitUntil:'domcontentloaded'});
   const cloud=page.getByRole('button',{name:'Wolken + Wetter',exact:true});
   const radar=page.getByRole('button',{name:'Radar / Satellit',exact:true});
   await cloud.waitFor({timeout:40000});
   await page.locator('.current-surroundings-maplibre canvas').first().waitFor({timeout:40000});
   assert.equal(await cloud.getAttribute('aria-pressed'),'true',label+': initial cloud mode');
   assert.equal(timesCalls,0,label+': lazy radar network on cloud mode');
   let geometry=await validateLayout(page,label+' cloud');
   const cloudRange=page.getByRole('slider',{name:/Wolkenprognose/});
   const cloudNext=page.getByRole('button',{name:'Wolkenprognose 15 Minuten vor',exact:true});
   const cloudPrev=page.getByRole('button',{name:'Wolkenprognose 15 Minuten zurück',exact:true});
   assert.equal(await cloudRange.inputValue(),'0');
   await cloudNext.click();
   assert.equal(await cloudRange.inputValue(),'1',label+': cloud advanced one original target');
   assert.match(await page.locator('.current-surroundings-cloud-timeline output').innerText(),
     /\d{2}\.\d{2}\./,label+': no absolute validity date');
   await cloudPrev.click();
   assert.equal(await cloudRange.inputValue(),'0',label+': cloud seek reverse');
   assert.equal(timesCalls,0,label+': cloud original scrub caused radar calls');
   await radar.click();
   assert.equal(await radar.getAttribute('aria-pressed'),'true');
   await page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'})
     .waitFor({timeout:45000});
   assert.ok(timesCalls>0,label+': no original source catalogue queried');
   await validateLayout(page,label+' radar');
   const radarRange=page.getByRole('slider',{name:/Radar\/Satellit/});
   const radarNext=page.getByRole('button',{name:'Radar und Satellit 15 Minuten vor',exact:true});
   const radarPrev=page.getByRole('button',{name:'Radar und Satellit 15 Minuten zurück',exact:true});
   await radarNext.click();
   assert.equal(await radarRange.inputValue(),'1',label+': radar +15 source target');
   await page.getByRole('status').filter({hasText:'DWD-Radar · Nowcast'})
     .waitFor({timeout:40000});
   await page.getByRole('button',{name:'Karte öffnen',exact:true}).click();
   const handoff=await page.evaluate(()=>JSON.parse(document.body.dataset.surroundingsHandoff));
   assert.equal(handoff.time,Date.parse(future),label+': actual Nowcast source validity not handed off');
   await radarPrev.click();
   assert.equal(await radarRange.inputValue(),'0');
   await page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'})
     .waitFor({timeout:40000});
   await radarPrev.click();
   assert.equal(await radarRange.inputValue(),'-1',label+': history target -15');
   await page.getByRole('status').filter({hasText:'Kein originales Radar-/Nowcast-Bild'})
     .waitFor({timeout:40000});
   assert.equal(await page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'}).count(),
     0,label+': stale radar image shown as current');
   // Restore present original and persistence before reload.
   await page.getByRole('button',{name:'Jetzt',exact:true}).click();
   assert.equal(await radarRange.inputValue(),'0');
   await page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'})
     .waitFor({timeout:40000});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector(
     '.current-surroundings-display-modes button:nth-child(2)')?.getAttribute('aria-pressed')==='true',
     null,{timeout:30000});
   const reloadStatus=page.getByRole('status').filter({hasText:'DWD-Radar · Beobachtung'});
   await reloadStatus.waitFor({timeout:45000});
   await validateLayout(page,label+' persisted radar after reload');
   const screen=await page.screenshot({type:'png',fullPage:false,
     animations:'disabled'});
   assert.ok(screen.byteLength>10000,label+': empty viewport screenshot');
   const snapSha=createHash('sha256').update(screen).digest('hex');
   assert.deepEqual(errors,[],label+': uncaught browser JS errors');
   console.log('MID_P1_SURROUNDINGS_CASE_PASS '+JSON.stringify({browserFlavor,
     viewport:label,checks:'cloud+radar+original-only+no-stale+persist+reload+44px+overflow',
     screenshotSha256:snapSha,screenshotBytes:screen.length,
     radarOriginalTimesRequests:timesCalls}));
   return {viewport:label,success:true,sourceFixtureOnly:true,
     screenshotSha256:snapSha,modeBackground:geometry.modeBackground,
     browserPageErrors:errors.length};
 }finally{await context.close();}
}

try{
 for(const spec of cases)report.cases.push(await runCase(spec));
 assert.equal(report.cases.length,cases.length,'Viewport/theme matrix truncated');
 for(const width of new Set(cases.map(x=>x.width))){
   const pair=report.cases.filter(x=>x.viewport.startsWith(width+'/'));
   assert.equal(pair.length,2,'Both light/dark themes required at every width');
   assert.notEqual(pair[0].screenshotSha256,pair[1].screenshotSha256,
     'Light/dark screenshot identical; theme response not visually established');
 }
 console.log('MID_P1_SURROUNDINGS_'+browserFlavor.toUpperCase()+'_RESPONSIVE_FIXTURE_QA_PASS '+JSON.stringify(report));
}finally{await browser.close();await server.close();}
